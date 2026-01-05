import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
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
            const subscriptionId = session.subscription as string;

            const customerDetails = session.customer_details;
            const email = customerDetails?.email;
            const userId = session.client_reference_id;

            console.log(`[Webhook] Processing checkout for: ${email}`);

            let targetUserId = userId;

            if (!targetUserId && email) {
                // Try to find user by email in 'User' table
                const { data: userByEmail } = await supabaseAdmin
                    .from('User')
                    .select('id, initialPaymentDate')
                    .eq('email', email)
                    .single();

                if (userByEmail) {
                    targetUserId = userByEmail.id;
                }
            }

            if (targetUserId) {
                // Check existing role before updating
                const { data: existingUser } = await supabaseAdmin
                    .from('User')
                    .select('role, initialPaymentDate')
                    .eq('id', targetUserId)
                    .single();

                const currentRole = existingUser?.role || 'student';
                const newRole = (currentRole === 'admin' || currentRole === 'staff') ? currentRole : 'student';

                const amount = session.amount_total || 0;
                let detectedPlan = 'premium';

                if (amount === 18960 || amount === 12980) detectedPlan = 'standard';
                if (amount === 11960 || amount === 5980) detectedPlan = 'light';
                if (amount === 7960 || amount === 1980) detectedPlan = 'partner';
                if (amount === 25780 || amount === 19800) detectedPlan = 'premium';

                // Update Existing User
                const { error: updateError } = await supabaseAdmin.from('User').update({
                    name: customerDetails?.name,
                    zipCode: customerDetails?.address?.postal_code,
                    role: newRole,
                    plan: detectedPlan,
                    initialPaymentDate: existingUser?.initialPaymentDate || new Date().toISOString(),
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'active',
                    updatedAt: new Date().toISOString()
                }).eq('id', targetUserId);

                if (updateError) {
                    console.error(`Profile Update Error: ${updateError.message}`);
                } else {
                    console.log("[Webhook] Existing User profile updated.");
                    await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                        user_metadata: { plan: 'premium', role: newRole, subscriptionStatus: 'active' }
                    });
                }
            } else {
                // Check if Auth User exists
                const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();

                console.log(`[Webhook] User not found in Public Table for ${email}. Checking Auth...`);

                let authUserId = null;
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                const amount = session.amount_total || 0;
                let detectedPlan = 'premium';

                if (amount === 18960 || amount === 12980) detectedPlan = 'standard';
                if (amount === 11960 || amount === 5980) detectedPlan = 'light';
                if (amount === 7960 || amount === 1980) detectedPlan = 'partner';
                if (amount === 25780 || amount === 19800) detectedPlan = 'premium';

                // 1. Try Create
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email!,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        name: customerDetails?.name || email!.split('@')[0],
                        role: 'student',
                        plan: detectedPlan,
                        subscriptionStatus: 'active'
                    }
                });

                if (newUser?.user) {
                    authUserId = newUser.user.id;
                    console.log(`[Webhook] New Auth User created! ID: ${authUserId}`);
                } else if (createError && createError.message.includes("already registered")) {
                    console.log("[Webhook] Auth User already exists. Linking...");
                    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
                    // @ts-ignore
                    const found = existingAuthUser?.users.find(u => u.email === email);

                    if (found) {
                        authUserId = found.id;
                    } else {
                        console.error("[Webhook] User reported existing but not found in list.");
                        throw new Error("Auth Sync Error");
                    }
                } else {
                    console.error("[Webhook] Failed to create auth user:", createError);
                    throw new Error(`User Creation Error: ${createError?.message}`);
                }

                if (authUserId) {
                    targetUserId = authUserId;
                    // Insert into 'User' table
                    const { error: profileInsertError } = await supabaseAdmin
                        .from('User')
                        .insert({
                            id: targetUserId,
                            email: email!,
                            name: customerDetails?.name || email!.split('@')[0],
                            role: 'student',
                            plan: detectedPlan,
                            zipCode: customerDetails?.address?.postal_code,
                            initialPaymentDate: new Date().toISOString(),
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                            subscriptionStatus: 'active',
                            updatedAt: new Date().toISOString()
                        });

                    if (profileInsertError) {
                        console.error("[Webhook] Failed to create public User profile:", profileInsertError);
                    } else {
                        console.log(`[Webhook] Public User profile created/restored!`);
                    }
                }

                // Send Email Logic (Simplified/Skipped for brevity as it was working)
                // Assuming it's the same logic, preserving functionality.
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
    <h2>${customerDetails?.name || '受講生'} 様</h2>
    <p>この度は、<strong>Luna Flow</strong> にお申し込みいただき、誠にありがとうございます。<br>
    アカウントの開設が完了いたしました。</p>
    
    <p>以下のボタンをクリックして、学習プラットフォームにログインしてください。</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Luna Flow にログインする
        </a>
    </div>
    
    <p>※上記ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：<br>
    <a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
    
    <h3>🚀 今後のステップ</h3>
    <ol>
        <li>ログイン後、画面左側のメニューから<strong>「コース」</strong>を選択してください。</li>
        <li><strong>「はじめに」</strong>カテゴリの動画を必ず視聴し、コミュニティのルールをご確認ください。</li>
        <li><strong>「公式LINE」</strong>との連携を行うと、新着通知を受け取ることができます。</li>
    </ol>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 0.9em; color: #666;">
        ご不明な点がございましたら、このメールに返信するか、コミュニティ内の「お悩み相談」チャンネルよりご連絡ください。<br>
        今後とも Luna Flow をよろしくお願いいたします。
    </p>
    
    <p style="font-size: 0.9em; color: #999;">
        --------------------------------------------------<br>
        <strong>Luna Flow 事務局</strong><br>
        公式サイト: <a href="https://lunaflow.space">https://lunaflow.space</a><br>
        --------------------------------------------------
    </p>
</div>
`
                        });
                        console.log(`[Webhook] Welcome email sent to ${email}`);
                    } catch (e) {
                        console.error("[Webhook] Email Sending Error:", e);
                    }
                }
            }

            // Log Purchase for Checkout
            if (targetUserId) {
                const amount = session.amount_total || 0;
                let detectedPlan = 'premium';
                if (amount === 18960 || amount === 12980) detectedPlan = 'standard';
                if (amount === 11960 || amount === 5980) detectedPlan = 'light';
                if (amount === 7960 || amount === 1980) detectedPlan = 'partner';
                if (amount === 25780 || amount === 19800) detectedPlan = 'premium';

                const { error: purchaseError } = await supabaseAdmin
                    .from('PurchaseRequest')
                    .insert({
                        userId: targetUserId,
                        stripeInvoiceId: session.invoice as string || session.id,
                        amount: amount,
                        plan: detectedPlan,
                        status: 'paid',
                    });
                if (!purchaseError) console.log(`[Webhook] PurchaseRequest logged for user ${targetUserId}`);
            }

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;
            // Only non-subscription invoices
            if (!(invoice as any).subscription) {
                const email = invoice.customer_email;
                const amount = invoice.amount_paid;
                const stripeInvoiceId = invoice.id;
                let targetUserId = null;

                if (email) {
                    const { data: user } = await supabaseAdmin.from('User').select('id').eq('email', email).single();
                    if (user) targetUserId = user.id;
                }

                if (targetUserId) {
                    console.log(`[Webhook] Invoice Paid: ${amount} by ${targetUserId}`);
                    const { error: purchaseError } = await supabaseAdmin.from('PurchaseRequest').insert({
                        userId: targetUserId,
                        stripeInvoiceId: stripeInvoiceId,
                        amount: amount,
                        plan: 'one_time',
                        status: 'paid',
                        note: 'Invoice Payment'
                    });
                    if (purchaseError) console.error("Invoice Log Error:", purchaseError);
                }
            }

        } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const stripeSubscriptionId = subscription.id;
            const status = subscription.status;

            console.log(`[Webhook] Subscription event: ${event.type}, ID: ${stripeSubscriptionId}, Status: ${status}`);

            const updateData: any = {
                subscriptionStatus: status,
                updatedAt: new Date().toISOString()
            };

            if (status === 'active' || status === 'trialing') {
                updateData.status = 'active';
            } else {
                updateData.status = 'inactive';
            }

            const { error: subUpdateError } = await supabaseAdmin
                .from('User')
                .update(updateData)
                .eq('stripeSubscriptionId', stripeSubscriptionId);

            if (subUpdateError) {
                console.error(`[Webhook] Failed to update subscription status: ${subUpdateError.message}`);
            } else {
                console.log(`[Webhook] User subscription updated to ${status}`);

                // Also update Auth Metadata for Middleware Checks
                // Need to find the user first to get ID? We updated by stripeSubscriptionId. 
                // We returned nothing. Let's select ID first or use returned data if supported (Supabase update returns count, need select).

                const { data: updatedUser } = await supabaseAdmin
                    .from('User')
                    .select('id')
                    .eq('stripeSubscriptionId', stripeSubscriptionId)
                    .single();

                if (updatedUser) {
                    await supabaseAdmin.auth.admin.updateUserById(updatedUser.id, {
                        user_metadata: { subscriptionStatus: status }
                    });
                    console.log(`[Webhook] Auth metadata updated for ${updatedUser.id}`);
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error("Handler Logic Error:", err);
        return NextResponse.json({
            error: `Handler Check Failed`,
            details: err.message
        }, { status: 500 });
    }
}
