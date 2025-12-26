import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, postalCode, prefecture, address, phone, plan, amount, note, payoutPreference } = body;

        // Basic validation
        if (!email || !amount) {
            return NextResponse.json({ error: 'Email and Amount are required.' }, { status: 400 });
        }

        // 1. Find or Create Stripe Customer
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        let customerId;

        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email,
                name,
                phone,
                metadata: {
                    postalCode,
                    prefecture: prefecture || '',
                    address: address || '',
                },
                address: {
                    line1: address,
                    state: prefecture,
                    postal_code: postalCode,
                    country: 'JP'
                }
            });
            customerId = newCustomer.id;
        }

        const purchaseAmount = parseInt(amount);
        let offsetAmount = 0;
        let invoiceAmount = purchaseAmount;
        let invoiceId = "";

        // ============================================
        // CRITICAL TRANSACTION: Purchase & Reward Usage
        // ============================================
        // We use prisma.$transaction to ensure that if the invoice fails, the reward deduction is rolled back.
        // However, Stripe API calls are external and cannot be "rolled back" by Prisma.
        // Best Practice: 
        // 1. Calculate and lock DB Balance.
        // 2. Create Stripe Invoice Items.
        // 3. Finalize Stripe Invoice.
        // 4. IF Stripe success -> Commit DB Transaction (Deduct Balance).
        // 5. IF Stripe fails -> DB Transaction aborts (Balance safe).

        await prisma.$transaction(async (tx) => {
            // A. Identify User (In real app, use Auth Session. Here we mock find/create by email for safety)
            let user = await tx.user.findUnique({ where: { email } });
            if (!user) {
                // Auto-create user if not exists (for this mock flow compatibility)
                user = await tx.user.create({
                    data: {
                        email, name, role: 'student', plan: 'light' // Default
                    }
                });
            }

            // B. Calculate Available Balance
            // Logic: Sum of all transactions (Earnings - Usages)
            const balanceResult = await tx.rewardTransaction.aggregate({
                _sum: { amount: true },
                where: { userId: user.id }
            });
            const availableBalance = balanceResult._sum.amount || 0;

            // C. Determine Offset
            // Only apply if balance > 0 AND User preference is NOT 'bank_transfer' (explicit opt-out)
            // (Frontend sends 'payoutPreference', or we check DB user.payoutPreference)
            const shouldUseOffset = payoutPreference !== 'bank_transfer'; // or check user.payoutPreference

            if (availableBalance > 0 && shouldUseOffset) {
                if (availableBalance >= purchaseAmount) {
                    offsetAmount = purchaseAmount;
                } else {
                    offsetAmount = availableBalance;
                }
            }
            invoiceAmount = purchaseAmount - offsetAmount;

            // D. Create Purchase Request Record (Pending)
            const purchaseReq = await tx.purchaseRequest.create({
                data: {
                    userId: user.id,
                    amount: purchaseAmount,
                    plan: plan,
                    status: 'pending',
                }
            });

            // E. Stripe Operations (External)
            // Note: If this fails, the whole transaction throws and rolls back the purchaseReq creation.

            // E-1. Item: Purchase
            await stripe.invoiceItems.create({
                customer: customerId,
                amount: purchaseAmount,
                currency: 'jpy',
                description: `仕入れ希望: ${plan}プラン - ${note || '備考なし'}`,
            });

            // E-2. Item: Offset (if any)
            if (offsetAmount > 0) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: -offsetAmount,
                    currency: 'jpy',
                    description: `アフィリエイト報酬充当`,
                });
            }

            // E-3. Create & Finalize Invoice
            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true,
                collection_method: 'send_invoice',
                days_until_due: 7,
            });

            if (invoice.status !== 'open' && invoice.status !== 'paid') {
                await stripe.invoices.finalizeInvoice(invoice.id);
            }

            // F. Update Purchase Request with Invoice ID
            await tx.purchaseRequest.update({
                where: { id: purchaseReq.id },
                data: { stripeInvoiceId: invoice.id }
            });

            // G. DEDUCT BALANCE (Create Negative Transaction)
            if (offsetAmount > 0) {
                await tx.rewardTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -offsetAmount, // Negative!
                        type: 'offset_purchase',
                        description: `仕入れ代金充当 (${plan}プラン)`,
                        purchaseRequestId: purchaseReq.id
                    }
                });
            }

            invoiceId = invoice.id;
            return purchaseReq;
        });

        // Loop finished = Transaction Committed.

        return NextResponse.json({ success: true, invoiceId, offsetAmount, invoiceAmount });

    } catch (error: any) {
        console.error('Purchase/Stripe Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
