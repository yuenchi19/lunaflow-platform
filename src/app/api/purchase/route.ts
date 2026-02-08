import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { getShippingFee, Carrier } from '@/lib/shipping';
import Stripe from "stripe";
import { unstable_noStore as noStore } from 'next/cache';
import { checkQuota, incrementQuota } from '@/lib/quota';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
    noStore();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string || 'mock_key_for_build');

    let response = NextResponse.next({
        request: { headers: req.headers }
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
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
        const { amount: omakaseAmountInput, scheduledDate, note, plan, carrier, useReward, items, prefecture } = body;

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.isLedgerEnabled) {
            return NextResponse.json({ error: "This feature is currently locked for your account." }, { status: 403 });
        }

        // Quota Check
        const quota = await checkQuota(user.id, 'research');
        if (!quota.allowed) {
            return NextResponse.json({
                error: `Research limit exceeded for this month. (${quota.current}/${quota.limit})`
            }, { status: 403 });
        }

        // 1. Calculate Totals
        // Omakase Amount (Pure Investment)
        let omakaseAmount = typeof omakaseAmountInput === 'string' ? parseInt(omakaseAmountInput.replace(/[^0-9]/g, '')) : (omakaseAmountInput || 0);

        // EC Cart Items Calculation & Validation
        let cartTotal = 0;
        let cartLineItems: any[] = [];
        let validItems: any[] = [];

        if (items && Array.isArray(items) && items.length > 0) {
            const productIds = items.map((i: any) => i.id);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } }
            });

            for (const item of items) {
                const product = products.find(p => p.id === item.id);
                if (!product) continue;
                if (product.stock < item.quantity) {
                    return NextResponse.json({ error: `Not enough stock for: ${product.name}` }, { status: 400 });
                }
                const itemTotal = product.price * item.quantity;
                cartTotal += itemTotal;

                // Stripe Line Item (Goods)
                cartLineItems.push({
                    amount: product.price,
                    quantity: item.quantity,
                    description: `[Store] ${product.name}`,
                    productId: product.id,
                    productName: product.name,
                    image: product.image
                });

                validItems.push({
                    product,
                    quantity: item.quantity
                });
            }
        }

        // Shipping Calculation
        if (!prefecture && (omakaseAmount > 0 || cartTotal > 0)) {
            return NextResponse.json({ error: "都道府県を選択してください" }, { status: 400 });
        }

        let shippingFee = 0;
        let omakaseShipping = 0;
        let ecShipping = 0;

        if (prefecture && carrier) {
            const rate = getShippingFee(prefecture, carrier as Carrier);
            if (omakaseAmount > 0) omakaseShipping = rate;
            if (cartTotal > 0) ecShipping = rate;

            // Unified Shipping Rule: Apply the higher of the two (or just one rate if they are combined)
            // As per instructions: "Combine items, apply shipping once (highest)".
            // Since the rate is based on Region/Carrier, it's usually the same rate for both unless box size differs significantly.
            // Assuming the 'getShippingFee' returns the standard box rate.
            // If both exist, we take the max (which is just the rate).
            shippingFee = Math.max(omakaseShipping, ecShipping);
        }

        // Grand Total
        const subTotal = omakaseAmount + cartTotal + shippingFee;

        if (subTotal === 0) {
            return NextResponse.json({ error: "Total amount is 0" }, { status: 400 });
        }

        // 2. Reward Offset Calculation
        let offsetAmount = 0;
        if (useReward && (user.plan === 'standard' || user.plan === 'premium') && user.affiliateCode) {
            const transactions = await prisma.rewardTransaction.findMany({ where: { userId: user.id } });
            const totalEarned = transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
            const totalUsed = transactions.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
            const available = Math.max(0, totalEarned - totalUsed);

            if (available > 0) {
                offsetAmount = Math.min(subTotal, available);
            }
        }

        // Final Invoice Amount
        const chargeAmount = Math.max(0, subTotal - offsetAmount);

        // 3. Create PurchaseRequest (Parent Record)
        // STRICT: 'amount' only contains Omakase Investment.
        const purchaseRequest = await prisma.purchaseRequest.create({
            data: {
                userId: user.id,
                amount: omakaseAmount, // Only Omakase
                plan: plan || user.plan,
                status: "pending",
                note: `${note || ''}
[決済内訳詳細]
- 仕入れ希望額: ¥${omakaseAmount.toLocaleString()}
- ストア商品計: ¥${cartTotal.toLocaleString()}
- 送料 (${prefecture}): ¥${shippingFee.toLocaleString()}
----------------
小計: ¥${subTotal.toLocaleString()}
ポイント充当: -¥${offsetAmount.toLocaleString()}
----------------
請求合計: ¥${chargeAmount.toLocaleString()}`,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                carrier: carrier
            }
        });

        // 4. Create InventoryItems (EC Goods) & Decrement Stock
        if (validItems.length > 0) {
            for (const v of validItems) {
                // Decrement Stock
                await prisma.product.update({
                    where: { id: v.product.id },
                    data: { stock: { decrement: v.quantity } }
                });

                // Create Inventory Items linked to Request
                for (let i = 0; i < v.quantity; i++) {
                    await prisma.inventoryItem.create({
                        data: {
                            adminId: 'system_store',
                            brand: v.product.brand || 'Store Item',
                            name: v.product.name,
                            category: v.product.category || 'Goods',
                            costPrice: v.product.price,
                            status: 'ASSIGNED',
                            assignedToUserId: user.id,
                            purchaseRequestId: purchaseRequest.id,
                            images: v.product.image ? [v.product.image] : [],
                            hasAccessories: false,
                            accessories: [],
                            condition: v.product.condition || 'N/A'
                        }
                    });
                }
            }
        }

        // 5. Record Offset Transaction
        if (offsetAmount > 0) {
            await prisma.rewardTransaction.create({
                data: {
                    userId: user.id,
                    amount: -offsetAmount,
                    type: 'offset_purchase_combined',
                    description: `一括決済充当 (Req: ${purchaseRequest.id})`,
                    purchaseRequestId: purchaseRequest.id
                }
            });
        }

        // Increment Quota
        await incrementQuota(user.id, 'research');

        // 6. Generate Stripe Invoice
        let invoiceId = null;
        try {
            let customerId = user.stripeCustomerId;

            // Ensure Customer
            if (!customerId) {
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
                await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
            }

            // Line Item: Omakase
            if (omakaseAmount > 0) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: omakaseAmount,
                    currency: "jpy",
                    description: `仕入れ代金 (Request #${purchaseRequest.id.slice(-4)})`,
                });
            }

            // Line Items: Cart Products
            for (const item of cartLineItems) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: item.amount * item.quantity,
                    currency: "jpy",
                    description: `${item.description} x${item.quantity}`,
                });
            }

            // Line Item: Shipping
            if (shippingFee > 0) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: shippingFee,
                    currency: "jpy",
                    description: `配送料 (${carrier?.toUpperCase()} - ${prefecture})`,
                });
            }

            // Line Item: Reward Offset (Negative)
            if (offsetAmount > 0) {
                await stripe.invoiceItems.create({
                    customer: customerId,
                    amount: -offsetAmount,
                    currency: "jpy",
                    description: `アフィリエイト報酬充当`,
                });
            }

            // Create & Finalize
            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true,
                collection_method: 'send_invoice',
                days_until_due: 7,
                description: `ご請求 (Req: ${purchaseRequest.id.slice(-6)})`
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
