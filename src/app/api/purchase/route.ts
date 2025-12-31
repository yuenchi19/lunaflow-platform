import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate User
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Input
        const body = await req.json();
        const { amount, scheduledDate, note, plan } = body; // plan from hidden field or default

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required.' }, { status: 400 });
        }

        // 3. Fetch User Profile (Find or Create)
        let targetUser = await prisma.user.findUnique({
            where: { email: authUser.email! }
        });

        if (!targetUser) {
            // Auto-create User if missing (Sync Auth -> DB)
            console.log(`[Purchase] User sync: Creating DB record for ${authUser.email}`);
            targetUser = await prisma.user.create({
                data: {
                    id: authUser.id, // Try to sync ID
                    email: authUser.email!,
                    name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
                    role: 'student',
                    plan: 'light', // Default
                }
            });
        }


        // 4. Stripe Customer Logic
        const customers = await stripe.customers.list({ email: targetUser.email, limit: 1 });
        let customerId;

        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email: targetUser.email,
                name: targetUser.name || '',
                metadata: {
                    userId: targetUser.id,
                }
            });
            customerId = newCustomer.id;
        }

        const purchaseAmount = parseInt(amount);
        let offsetAmount = 0;
        let invoiceAmount = purchaseAmount;
        let invoiceId = "";

        // 5. Transaction
        await prisma.$transaction(async (tx) => {
            // Re-fetch balance inside tx
            const balanceResult = await tx.rewardTransaction.aggregate({
                _sum: { amount: true },
                where: { userId: targetUser.id }
            });
            const availableBalance = balanceResult._sum.amount || 0;

            const shouldUseOffset = targetUser.payoutPreference !== 'bank_transfer';

            if (availableBalance > 0 && shouldUseOffset) {
                if (availableBalance >= purchaseAmount) {
                    offsetAmount = purchaseAmount;
                } else {
                    offsetAmount = availableBalance;
                }
            }
            invoiceAmount = purchaseAmount - offsetAmount;

            // Create Purchase Request
            // Use new fields: scheduledDate, note
            // Ensure types match Schema (DateTime for scheduledDate)
            const purchaseReq = await tx.purchaseRequest.create({
                data: {
                    userId: targetUser.id,
                    amount: purchaseAmount,
                    plan: plan || targetUser.plan || 'standard',
                    status: 'pending',
                    // New fields - Cast to any to bypass stale local types if needed
                    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                    note: note || '',
                } as any
            });

            // Stripe operations
            await stripe.invoiceItems.create({
                customer: customerId,
                amount: purchaseAmount,
                currency: 'jpy',
                description: `仕入れ希望: ${purchaseReq.plan}プラン - ${note || '備考なし'}`,
            });

            if (offsetAmount > 0) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: -offsetAmount,
                    currency: 'jpy',
                    description: `アフィリエイト報酬充当`,
                });
            }

            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true, // Auto-finalize
                collection_method: 'send_invoice',
                days_until_due: 7,
                metadata: {
                    purchaseRequestId: purchaseReq.id // Link back
                }
            });

            // The invoice might not be finalized immediately if 'send_invoice', 
            // but `auto_advance` helps. Often we finalize explicitly to be sure.
            if (invoice.status !== 'open' && invoice.status !== 'paid') {
                await stripe.invoices.finalizeInvoice(invoice.id);
            }

            // Update Purchase with Invoice ID
            await tx.purchaseRequest.update({
                where: { id: purchaseReq.id },
                data: { stripeInvoiceId: invoice.id }
            });

            // Deduct Balance
            if (offsetAmount > 0) {
                await tx.rewardTransaction.create({
                    data: {
                        userId: targetUser.id,
                        amount: -offsetAmount,
                        type: 'offset_purchase',
                        description: `仕入れ代金充当`,
                        purchaseRequestId: purchaseReq.id
                    }
                });
            }

            invoiceId = invoice.id;
        });

        return NextResponse.json({ success: true, invoiceId, offsetAmount });

    } catch (error: any) {
        console.error('Purchase API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
