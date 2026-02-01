
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn("Missing STRIPE_WEBHOOK_SECRET");
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return NextResponse.json({
            error: `Webhook Error: ${error.message}`
        }, { status: 400 });
    }

    // Check for critical env vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
        return NextResponse.json({ error: "Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    try {
        // Initialize Supabase Admin Client (Service Role)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const session = event.data.object as Stripe.Checkout.Session;

        if (event.type === 'checkout.session.completed') {

            // --- PRODUCT PURCHASE LOGIC ---
            if (session.metadata?.type === 'product_purchase') {
                console.log(`[Webhook] Processing Product Purchase for ${session.customer_email}`);

                const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ['line_items.data.price.product']
                });
                const items = fullSession.line_items?.data || [];
                const userId = session.client_reference_id;
                const referralCode = session.metadata.referral;

                if (userId) {
                    await prisma.$transaction(async (tx) => {
                        // 1. Log Purchase Request (Paid)
                        await tx.purchaseRequest.create({
                            data: {
                                userId: userId!,
                                amount: session.amount_total || 0,
                                plan: 'one_time',
                                status: 'paid',
                                stripeInvoiceId: session.id,
                                note: `Store Purchase (${items.length} items)`
                            }
                        });

                        // 2. Process Items (Stock & Ledger)
                        for (const item of items) {
                            const price = item.price;
                            if (!price?.id) continue;

                            const dbProduct = await tx.product.findFirst({
                                where: { stripePriceId: price.id }
                            });

                            if (dbProduct) {
                                // Decrement Stock
                                await tx.product.update({
                                    where: { id: dbProduct.id },
                                    data: { stock: { decrement: item.quantity || 1 } }
                                });

                                // Create Ledger Entry
                                await tx.ledgerEntry.create({
                                    data: {
                                        userId: userId!,
                                        sellDate: new Date(),
                                        sellPrice: (item.amount_total || 0),
                                        profit: (item.amount_total || 0),
                                        salePlatform: 'LunaFlow Store',
                                        saleNote: `Product: ${dbProduct.name} (Qty: ${item.quantity})`
                                    }
                                });
                            }
                        }

                        // 3. Affiliate Reward (10%)
                        if (referralCode) {
                            const referrer = await tx.user.findFirst({ where: { affiliateCode: referralCode } });
                            if (referrer && referrer.id !== userId) { // Prevent self-referral
                                const commission = Math.floor((session.amount_total || 0) * 0.10);
                                if (commission > 0) {
                                    await tx.rewardTransaction.create({
                                        data: {
                                            userId: referrer.id,
                                            amount: commission,
                                            type: 'earning',
                                            description: `Commission from Store Purchase (User: ${userId})`
                                        }
                                    });
                                }
                            }
                        }
                    });
                    console.log(`[Webhook] Product Purchase Processed for ${userId}`);
                }

            } else {
                // --- SUBSCRIPTION LOGIC (Existing) ---
                const email = session.customer_details?.email;
                const userId = session.client_reference_id;

                console.log(`[Webhook] Processing Subscription Checkout for: ${email}`);

                let targetUserId = userId;

                if (!targetUserId && email) {
                    const { data: userByEmail } = await supabaseAdmin
                        .from('User')
                        .select('id, initialPaymentDate')
                        .eq('email', email)
                        .single();
                    if (userByEmail) targetUserId = userByEmail.id;
                }

                if (targetUserId) {
                    // Update Existing User
                    const { data: existingUser } = await supabaseAdmin.from('User').select('role, initialPaymentDate').eq('id', targetUserId).single();
                    const currentRole = existingUser?.role || 'student';
                    const newRole = (currentRole === 'admin' || currentRole === 'staff') ? currentRole : 'student';
                    const amount = session.amount_total || 0;

                    let detectedPlan = 'premium';
                    // Re-implement Plan Map logic just in case
                    if (amount === 18960 || amount === 12980) detectedPlan = 'standard';
                    if (amount === 11960 || amount === 5980) detectedPlan = 'light';
                    if (amount === 7960 || amount === 1980) detectedPlan = 'partner';
                    if (amount === 25780 || amount === 19800) detectedPlan = 'premium';

                    await supabaseAdmin.from('User').update({
                        name: session.customer_details?.name,
                        zipCode: session.customer_details?.address?.postal_code,
                        role: newRole,
                        plan: detectedPlan,
                        initialPaymentDate: existingUser?.initialPaymentDate || new Date().toISOString(),
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: session.subscription as string,
                        subscriptionStatus: 'active',
                        updatedAt: new Date().toISOString()
                    }).eq('id', targetUserId);

                    await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                        user_metadata: { plan: detectedPlan, role: newRole, subscriptionStatus: 'active' }
                    });
                } else {
                    // Create New User (Copied from previous file)
                    const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
                    let authUserId = null;
                    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                    const amount = session.amount_total || 0;

                    const PLAN_MAP: Record<number, string> = {
                        29800: 'premium', 25780: 'premium', 19800: 'premium',
                        9800: 'standard', 18960: 'standard', 12980: 'standard',
                        2980: 'light', 11960: 'light', 5980: 'light',
                        1980: 'partner', 7960: 'partner'
                    };
                    let detectedPlan = PLAN_MAP[amount] || 'student';

                    const userMetadata = {
                        name: session.customer_details?.name || email!.split('@')[0],
                        role: 'student',
                        plan: detectedPlan,
                        subscriptionStatus: 'active'
                    };

                    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: email!,
                        password: tempPassword,
                        email_confirm: true,
                        user_metadata: userMetadata
                    });

                    if (newUser?.user) {
                        authUserId = newUser.user.id;
                    } else if (createError && createError.message.includes("already registered")) {
                        // @ts-ignore
                        const found = existingAuthUsers?.find(u => u.email === email);
                        if (found) authUserId = found.id;
                    }

                    if (authUserId) {
                        targetUserId = authUserId;
                        await supabaseAdmin.auth.admin.updateUserById(targetUserId, { user_metadata: userMetadata });

                        await supabaseAdmin.from('User').upsert({
                            id: targetUserId,
                            email: email!,
                            name: session.customer_details?.name || email!.split('@')[0],
                            role: 'student',
                            plan: detectedPlan,
                            zipCode: session.customer_details?.address?.postal_code,
                            initialPaymentDate: new Date().toISOString(),
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                            subscriptionStatus: 'active',
                            updatedAt: new Date().toISOString()
                        }, { onConflict: 'id' });

                        // Send Email (Line Magic Link)
                        const { Resend } = await import('resend');
                        const { generateLineMagicLinkUrl } = await import('@/lib/line-auth');

                        if (process.env.RESEND_API_KEY && targetUserId) {
                            const resend = new Resend(process.env.RESEND_API_KEY);
                            const magicLinkUrl = await generateLineMagicLinkUrl(targetUserId);
                            try {
                                await resend.emails.send({
                                    from: process.env.RESEND_FROM_EMAIL || 'info@lunaflow.space',
                                    to: email!,
                                    subject: '【重要】Luna Flowへようこそ！アカウント登録が完了しました ✨',
                                    html: `
                                        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
                                            <p>${session.customer_details?.name || '受講生'} 様</p>
                                            <p>Luna Flowへの入会誠にありがとうございます。<br>アカウント作成が完了しました。</p>
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="${magicLinkUrl}" style="background-color: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">
                                                    🚀 今すぐ学習を始める
                                                </a>
                                            </div>
                                            <div style="margin-top: 40px; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                                                <p>メールアドレス: ${email}</p>
                                                <p>初期パスワード: ${tempPassword}</p>
                                            </div>
                                        </div>`
                                });
                            } catch (e) { console.error("Email Error", e); }
                        }
                    }
                }

                // Log Purchase Request for Subscription
                if (targetUserId) {
                    const amount = session.amount_total || 0;
                    // Plan map override logic for PurchaseRequest log
                    let planLog = 'premium';
                    if (amount === 18960 || amount === 12980) planLog = 'standard';
                    if (amount === 11960 || amount === 5980) planLog = 'light';
                    if (amount === 7960 || amount === 1980) planLog = 'partner';

                    await supabaseAdmin.from('PurchaseRequest').insert({
                        userId: targetUserId,
                        stripeInvoiceId: session.invoice as string || session.id,
                        amount: amount,
                        plan: planLog,
                        status: 'paid'
                    });
                }
            }

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;
            // Only non-subscription invoices (or if we want to track recurring payments?)
            // If subscription, Stripe usually ignores PurchaseRequest creation in webhook above (it handles "Initial").
            // But we should track recurring.
            // Current existing logic handled "non-subscription".
            // I will keep existing logic to avoid breaking changes.
            if (!(invoice as any).subscription) {
                // ... Existing Logic for Invoice ...
                const email = invoice.customer_email;
                const amount = invoice.amount_paid;
                const stripeInvoiceId = invoice.id;
                let targetUserId = null;
                if (email) {
                    const { data: user } = await supabaseAdmin.from('User').select('id').eq('email', email).single();
                    if (user) targetUserId = user.id;
                }
                if (targetUserId) {
                    // Check existing
                    const { data: existingReq } = await supabaseAdmin.from('PurchaseRequest').select('id').eq('stripeInvoiceId', stripeInvoiceId).single();
                    if (existingReq) {
                        await supabaseAdmin.from('PurchaseRequest').update({ status: 'paid' }).eq('id', existingReq.id);
                    } else {
                        // Fallback create
                        await supabaseAdmin.from('PurchaseRequest').insert({
                            userId: targetUserId,
                            stripeInvoiceId: stripeInvoiceId,
                            amount: amount,
                            plan: 'one_time',
                            status: 'paid',
                            note: 'Invoice Payment'
                        });
                    }
                }
            }
        } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const stripeSubscriptionId = subscription.id;
            const status = subscription.status;

            const updateData: any = { subscriptionStatus: status, updatedAt: new Date().toISOString() };
            if (status === 'active' || status === 'trialing') updateData.status = 'active';
            else updateData.status = 'inactive';

            await supabaseAdmin.from('User').update(updateData).eq('stripeSubscriptionId', stripeSubscriptionId);

            const { data: updatedUser } = await supabaseAdmin.from('User').select('id').eq('stripeSubscriptionId', stripeSubscriptionId).single();
            if (updatedUser) {
                await supabaseAdmin.auth.admin.updateUserById(updatedUser.id, { user_metadata: { subscriptionStatus: status } });
            }
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error("Handler Logic Error:", err);
        return NextResponse.json({ error: `Handler Check Failed`, details: err.message }, { status: 500 });
    }
}
