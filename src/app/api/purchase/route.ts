import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import Stripe from "stripe";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
    noStore();

    // Lazy init Stripe to prevent build-time crash if env is missing
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string || 'mock_key_for_build');

    let response = NextResponse.next({
        request: { headers: req.headers }
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        req.cookies.set(name, value)
                    )
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { amount, scheduledDate, note, plan, carrier, useReward } = body;

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.isLedgerEnabled) {
            return NextResponse.json({ error: "This feature is currently locked for your account." }, { status: 403 });
        }

        // --- Address Sync Logic (Skipping complexity, user data assumed valid or handled elsewhere) ---

        // --- Reward Logic ---
        let finalAmount = typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g, '')) : amount;
        let offsetAmount = 0;

        if (useReward && (user.plan === 'standard' || user.plan === 'premium') && user.affiliateCode) {
            const directReferrals = await prisma.user.findMany({
                where: { referredBy: user.affiliateCode },
                select: { plan: true, affiliateCode: true }
            });

            let monthlyEarnings = 0;
            const PLAN_PRICES: any = { premium: 29800, standard: 9800, light: 2980 };

            for (const direct of directReferrals) {
                monthlyEarnings += Math.floor((PLAN_PRICES[direct.plan] || 0) * 0.07);
                if (direct.affiliateCode) {
                    const indirectUsers = await prisma.user.findMany({ where: { referredBy: direct.affiliateCode }, select: { plan: true } });
                    for (const ind of indirectUsers) {
                        monthlyEarnings += Math.floor((PLAN_PRICES[ind.plan] || 0) * 0.03);
                    }
                }
            }

            const now = new Date();
            const regDate = user.createdAt || new Date();
            let months = (now.getFullYear() - regDate.getFullYear()) * 12 + (now.getMonth() - regDate.getMonth());
            if (months < 1) months = 1;

            const virtualTotal = monthlyEarnings * months;

            const transactions = await prisma.rewardTransaction.findMany({ where: { userId: user.id } });
            const used = transactions.reduce((sum, t) => sum + (t.amount < 0 ? -t.amount : 0), 0);
            const dbEarnings = transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

            const available = Math.max(0, (dbEarnings > 0 ? dbEarnings : virtualTotal) - used);

            if (available > 0) {
                offsetAmount = Math.min(finalAmount, available);
                finalAmount -= offsetAmount;
            }
        }

        const purchaseRequest = await prisma.purchaseRequest.create({
            data: {
                userId: user.id,
                amount: finalAmount,
                plan: plan || user.plan,
                status: "pending",
                note: offsetAmount > 0 ? `${note || ''}\n[自動] アフィリエイト報酬充当: -¥${offsetAmount}` : note,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                carrier: carrier
            }
        });

        if (offsetAmount > 0) {
            await prisma.rewardTransaction.create({
                data: {
                    userId: user.id,
                    amount: -offsetAmount,
                    type: 'offset_purchase',
                    description: `仕入れ購入充当 (Req: ${purchaseRequest.id})`,
                    purchaseRequestId: purchaseRequest.id
                }
            });
        }

        let invoiceId = null;
        try {
            let customerId = "";
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    name: user.name || "",
                });
                customerId = newCustomer.id;
            }

            await stripe.invoiceItems.create({
                customer: customerId,
                amount: typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g, '')) : amount,
                currency: "jpy",
                description: `仕入れ購入申請 (${new Date().toLocaleDateString()}) - ${note || ''}`,
            });

            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true,
                collection_method: 'send_invoice',
                days_until_due: 7,
            });
            invoiceId = invoice.id;

            await prisma.purchaseRequest.update({
                where: { id: purchaseRequest.id },
                data: { stripeInvoiceId: invoiceId }
            });

            if (invoice.status === 'draft') {
                await stripe.invoices.finalizeInvoice(invoice.id);
            }

        } catch (stripeError) {
            console.error("Stripe Invoice Error:", stripeError);
        }

        return NextResponse.json({ success: true, purchaseRequest });

    } catch (error: any) {
        console.error("Purchase API Error:", error);
        if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
