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

                // STRICT PLAN MAPPING (Lock Down)
                // Premium: 25780, 19800, 29800
                // Standard: 18960, 12980, 9800
                // Light: 11960, 5980, 2980
                // Partner: 7960, 1980
                let detectedPlan = 'student'; // Default fallback (safe)

                const PLAN_MAP: Record<number, string> = {
                    29800: 'premium', 25780: 'premium', 19800: 'premium',
                    9800: 'standard', 18960: 'standard', 12980: 'standard',
                    2980: 'light', 11960: 'light', 5980: 'light',
                    1980: 'partner', 7960: 'partner'
                };

                if (PLAN_MAP[amount]) {
                    detectedPlan = PLAN_MAP[amount];
                } else {
                    console.warn(`[Webhook] Warning: Unknown amount ${amount}. Defaulting to 'student' (Access Restricted).`);
                }

                console.log(`[Webhook] Amount: ${amount} => Detected Plan: ${detectedPlan}`);

                // 1. Try Create or Get
                let isNewAccount = false;

                // Prepare metadata
                const userMetadata = {
                    name: customerDetails?.name || email!.split('@')[0],
                    role: 'student', // FORCE STUDENT ROLE. Never auto-promote.
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
                    isNewAccount = true; // Mark as new
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

                    // FORCE METADATA UPDATE (Even if user exists)
                    // This ensures Auth Session has the latest plan immediately.
                    await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                        user_metadata: userMetadata
                    });
                    console.log(`[Webhook] Auth Metadata updated for ${targetUserId} to plan: ${detectedPlan}`);

                    // Upsert into 'User' table (Insert or Update)
                    const { error: profileUpsertError } = await supabaseAdmin
                        .from('User')
                        .upsert({
                            id: targetUserId,
                            email: email!,
                            name: customerDetails?.name || email!.split('@')[0],
                            role: 'student',
                            plan: detectedPlan,
                            zipCode: customerDetails?.address?.postal_code,
                            address: `${customerDetails?.address?.state || ''}${customerDetails?.address?.city || ''}${customerDetails?.address?.line1 || ''}${customerDetails?.address?.line2 || ''}`,
                            initialPaymentDate: new Date().toISOString(),
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                            subscriptionStatus: 'active',
                            updatedAt: new Date().toISOString()
                        }, { onConflict: 'id' }); // Conflict on ID -> Update

                    if (profileUpsertError) {
                        console.error("[Webhook] Failed to upsert public User profile:", profileUpsertError);
                    } else {
                        console.log(`[Webhook] Public User profile synced (Upsert)!`);
                    }
                }



                // Send Email Logic
                const { Resend } = await import('resend');
                const { generateLineMagicLinkUrl } = await import('@/lib/line-auth');

                if (process.env.RESEND_API_KEY && targetUserId) {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const magicLinkUrl = await generateLineMagicLinkUrl(targetUserId);

                    try {
                        const passwordSection = isNewAccount
                            ? `<p>・初期パスワード : <strong>${tempPassword}</strong></p>`
                            : `<p>・パスワード : (既存のパスワードをご利用ください)</p>`;

                        await resend.emails.send({
                            from: process.env.RESEND_FROM_EMAIL || 'info@lunaflow.space',
                            to: email!,
                            subject: '【重要】Luna Flowへようこそ！アカウント登録が完了しました ✨',
                            html: `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
    <p>${customerDetails?.name || '受講生'} 様</p>
    <p>Luna Flowへの入会誠にありがとうございます。<br>
    お客様のアカウント作成が完了いたしました！</p>
    
    <p>これからの新しい一歩を、私たちが全力でサポートいたします。<br>
    理想の毎日を一緒に叶えていきましょう！</p>

    <p style="margin-top: 20px;"><strong>▼ 面倒な入力なしで、今すぐスタート！</strong><br>
    以下のボタンを押すだけで、自動的にログインし、同時にLINE連携も完了します。<br>
    (推奨：スマートフォンからタップしてください)</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" style="background-color: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">
            🚀 今すぐ学習を始める
        </a>
    </div>
    
    <p style="text-align: center; font-size: 0.8em; color: #666;">※このリンクはセキュリティのため72時間有効です。</p>
    
    <div style="margin-top: 40px; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0; font-size: 1em;">■ 通常のログイン情報（PCやリンク切れの場合）</h3>
        <p style="font-size: 0.9em; margin-bottom: 5px;">もし上記ボタンから入れない場合は、以下の情報でログインしてください。</p>
        <div style="font-size: 0.9em; background-color: #fff; padding: 15px; border-radius: 4px; border: 1px solid #ddd;">
            <p style="margin: 5px 0;">・ログインURL : <a href="https://lunaflow.space">https://lunaflow.space</a></p>
            <p style="margin: 5px 0;">・メールアドレス : ${email}</p>
            ${passwordSection}
        </div>
    </div>
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

                    // 1. Check if PurchaseRequest exists for this Invoice
                    const { data: existingReq } = await supabaseAdmin
                        .from('PurchaseRequest')
                        .select('id, amount')
                        .eq('stripeInvoiceId', stripeInvoiceId)
                        .single();

                    if (existingReq) {
                        // Update Status to Paid
                        const { error: updateError } = await supabaseAdmin
                            .from('PurchaseRequest')
                            .update({ status: 'paid' })
                            .eq('id', existingReq.id);

                        if (updateError) console.error("Failed to update PurchaseRequest:", updateError);
                        else console.log(`[Webhook] PurchaseRequest ${existingReq.id} marked as paid.`);

                        // Update Linked InventoryItems
                        // "Status -> Paid" requested. But InventoryItem has strict Enum.
                        // We interpret this as "Confirmed/Assigned". Ideally 'SHIPPED' comes later.
                        // But to distinguish from "Pending Payment" (which we set as ASSIGNED), 
                        // we might just leave it as ASSIGNED, as "Paid" is tracked on PurchaseRequest.
                        // However, to follow "Status update" instruction, maybe we assume `ASSIGNED` is correct and just ensure it.
                        // Or if we need to mark it, maybe `IN_STOCK` (for the user)?
                        // "InventoryItem (Bag) ... status -> 'Paid'".
                        // Let's assume the user meant "System recognizes it as paid".
                        // I will trigger an update to `updatedAt` to ensure sync, or explicit status set if valid.
                        // Ideally, `InventoryItem` for a user should be `IN_STOCK` if they have it? No, they don't have it yet.
                        // `ASSIGNED` is correct.
                        // I will skip changing InventoryItem status unless `PAID` enum exists.
                        // (Schema check: IN_STOCK, ASSIGNED, SHIPPED, RECEIVED, SOLD, RETURNED)
                        // I will just leave it ASSIGNED.

                    } else {
                        // Fallback: Create new if not found (Legacy behavior)
                        const { error: purchaseError } = await supabaseAdmin.from('PurchaseRequest').insert({
                            userId: targetUserId,
                            stripeInvoiceId: stripeInvoiceId,
                            amount: amount,
                            plan: 'one_time',
                            status: 'paid',
                            note: 'Invoice Payment (Created via Webhook)'
                        });
                        if (purchaseError) console.error("Invoice Log Error:", purchaseError);
                    }
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
