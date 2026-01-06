import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import Stripe from "stripe";
import { unstable_noStore as noStore } from 'next/cache';

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
        const { amount: omakaseAmountInput, scheduledDate, note, plan, carrier, useReward, items } = body;

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.isLedgerEnabled) {
            return NextResponse.json({ error: "This feature is currently locked for your account." }, { status: 403 });
        }

        // 1. Calculate Totals
        // Omakase Amount
        let omakaseAmount = typeof omakaseAmountInput === 'string' ? parseInt(omakaseAmountInput.replace(/[^0-9]/g, '')) : (omakaseAmountInput || 0);

        // EC Cart Items Calculation & Validation
        let cartTotal = 0;
        let cartLineItems: any[] = [];
        let validItems: any[] = []; // To store product details for DB creation

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

                // Stripe Line Item
                cartLineItems.push({
                    amount: product.price, // Unit price
                    quantity: item.quantity,
                    description: `[Store] ${product.name}`,
                    productId: product.id, // Keep ref
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
        // Rule: Max(Omakase(1000), EC(800)). If 0 use 0.
        // Assuming 'omakaseAmount > 0' implies a request is being made that needs shipping. 
        // Note: Sometimes Omakase is just "consultation" but usually "purchase request" involves shipping goods eventually.
        // Assuming fixed rates for now as per instructions.
        const omakaseShippingFee = omakaseAmount > 0 ? 1000 : 0;
        const ecShippingFee = cartTotal > 0 ? 800 : 0;
        const shippingFee = Math.max(omakaseShippingFee, ecShippingFee);

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
        // We only store 'omakaseAmount' in the `amount` field to keep track of that specific budget.
        // The Invoice will link everything else.
        const purchaseRequest = await prisma.purchaseRequest.create({
            data: {
                userId: user.id,
                amount: omakaseAmount, // Only the Omakase part
                plan: plan || user.plan,
                status: "pending",
                note: `${note || ''}
[自動計算詳細]
- 仕入れ希望額: ¥${omakaseAmount.toLocaleString()}
- ストア商品計: ¥${cartTotal.toLocaleString()}
- 同梱送料: ¥${shippingFee.toLocaleString()}
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

                // Create Inventory Items (One per quantity unit, or grouped? Usually individual items for tracking)
                // System logic: InventoryItem represents a physical object. If user buys 2 bags, we make 2 items.
                // For "Goods", maybe one record with quantity? Current schema InventoryItem doesn't seem to have valid quantity field?
                // Schema check: user provided earlier 'model InventoryItem' has NO quantity.
                // So we must create N records.
                for (let i = 0; i < v.quantity; i++) {
                    await prisma.inventoryItem.create({
                        data: {
                            adminId: 'system_store', // or system user
                            brand: v.product.brand || 'Store Item',
                            name: v.product.name,
                            category: v.product.category || 'Goods',
                            costPrice: v.product.price, // Store price is cost for user? Or we track our cost?
                            // For Student Ledger, 'costPrice' is what THEY bought it for (which is v.product.price).
                            // 'sellingPrice' is what they will sell it for (null).
                            status: 'ASSIGNED', // "Purchased/Assigned"
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
                    amount: item.amount * item.quantity, // Stripe invoiceItems take 'amount' as total or unit?
                    // stripe.invoiceItems.create: 'amount' is total amount in cents/yen. 'quantity' is not widely used for arbitrary amount unless using price API.
                    // Actually for "one-off" invoice items, we specify 'amount'. If we specify 'unit_amount' and 'quantity', we need a Price ID usually.
                    // But we can just push "Total for this Product".
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
                    description: `配送料 (同梱適用)`,
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
