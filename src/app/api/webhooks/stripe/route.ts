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
            // const subscription = await stripe.subscriptions.retrieve(subscriptionId); // Not strictly needed unless verifying status

            // Extract Customer Details
            const customerDetails = session.customer_details;
            const email = customerDetails?.email;
            const userId = session.client_reference_id;

            console.log(`[Webhook] Processing checkout for: ${email}`);

            let targetUserId = userId;

            if (!targetUserId && email) {
                // Try to find user by email in 'User' table
                const { data: userByEmail, error: userLookupError } = await supabaseAdmin
                    .from('User')
                    .select('id, initialPaymentDate')
                    .eq('email', email)
                    .single();

                // Ignore "not found" error, strict check causes issues if table is empty
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
                // Only update role to 'student' if current role is NOT admin/staff
                const newRole = (currentRole === 'admin' || currentRole === 'staff') ? currentRole : 'student';

                const amount = session.amount_total || 0;
                let detectedPlan = 'premium'; // Default fallback

                if (amount === 18960 || amount === 12980) detectedPlan = 'standard';
                if (amount === 11960 || amount === 5980) detectedPlan = 'light';
                if (amount === 7960 || amount === 1980) detectedPlan = 'partner';
                if (amount === 25780 || amount === 19800) detectedPlan = 'premium';

                // Update Existing User
                const { error: updateError } = await supabaseAdmin.from('User').update({
                    name: customerDetails?.name,
                    zipCode: customerDetails?.address?.postal_code, // camelCase
                    role: newRole,
                    plan: detectedPlan,
                    initialPaymentDate: existingUser?.initialPaymentDate || new Date().toISOString(),
                    // stripeCustomerId: session.customer as string, 
                    updatedAt: new Date().toISOString() // camelCase
                }).eq('id', targetUserId);

                if (updateError) {
                    console.error(`Profile Update Error: ${updateError.message}`);
                } else {
                    console.log("[Webhook] Existing User profile updated.");
                    // Sync Metadata (Safety net) - only if not admin to be safe? 
                    // Or Just update plan, keep role safe.
                    await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                        user_metadata: { plan: 'premium', role: newRole }
                    });
                }
            } else {
                // Check if Auth User exists (even if public User doesn't)
                const { data: { users: existingAuthUsers }, error: authLookupError } = await supabaseAdmin.auth.admin.listUsers();

                console.log(`[Webhook] User not found in Public Table for ${email}. Checking Auth...`);

                let authUserId = null;
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                const amount = session.amount_total || 0;
                let detectedPlan = 'premium'; // Default fallback

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
                        plan: detectedPlan
                    }
                });

                if (newUser?.user) {
                    authUserId = newUser.user.id;
                    console.log(`[Webhook] New Auth User created! ID: ${authUserId}`);

                    // Send Email ONLY for new users
                    // ... (Email logic) ...
                } else if (createError && createError.message.includes("already registered")) {
                    console.log("[Webhook] Auth User already exists. Linking...");
                    // 2. Fallback: Find the existing auth user
                    // @ts-ignore
                    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
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
                            zipCode: customerDetails?.address?.postal_code, // camelCase
                            initialPaymentDate: new Date().toISOString(),
                            updatedAt: new Date().toISOString() // camelCase
                        });

                    if (profileInsertError) {
                        console.error("[Webhook] Failed to create public User profile:", profileInsertError);
                    } else {
                        console.log(`[Webhook] Public User profile created/restored!`);
                    }
                }


                // Real Email Sending with Resend
                const { Resend } = await import('resend');
                const { generateLineMagicLinkUrl } = await import('@/lib/line-auth');

                if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

                const resend = new Resend(process.env.RESEND_API_KEY);

                if (!targetUserId) {
                    throw new Error("Failed to resolve User ID for Magic Link generation");
                }

                // Generate Magic Link (LINE Integration)
                const magicLinkUrl = await generateLineMagicLinkUrl(targetUserId);

                try {
                    console.log(`[Webhook] Attempting to send welcome email to ${email}...`);
                    const { data: emailData, error: emailError } = await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || 'info@lunaflow.space',
                        to: email!,
                        subject: '【重要】Luna Flowへようこそ！アカウント登録が完了しました ✨',
                        html: `
                                <p>${customerDetails?.name || 'お客様'} 様</p>

                                <p>Luna Flowへの入会誠にありがとうございます。<br>
                                お客様のアカウント作成が完了いたしました！</p>

                                <p>これからの新しい一歩を、私たちが全力でサポートいたします。<br>
                                理想の毎日を一緒に叶えていきましょう！</p>

                                <p><strong>▼ 面倒な入力なしで、今すぐスタート！</strong><br>
                                以下のボタンを押すだけで、<strong>自動的にログインし、同時にLINE連携も完了します。</strong><br>
                                （推奨：スマートフォンからタップしてください）</p>

                                <p style="text-align: center; margin: 24px 0;">
                                    <a href="${magicLinkUrl}" style="display:inline-block; background-color:#E64A19; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:5px; font-weight:bold; font-size:16px;">
                                        🚀 今すぐ学習を始める
                                    </a>
                                </p>
                                <p style="text-align: center; margin-bottom: 24px;"><small>※このリンクはセキュリティのため72時間有効です。</small></p>

                                <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">

                                <p><strong>■ 通常のログイン情報（PCやリンク切れの場合）</strong><br>
                                もし上記ボタンから入れない場合は、以下の情報でログインしてください。</p>
                                
                                <p style="background-color: #f9f9f9; padding: 16px; border-radius: 8px;">
                                ・ログインURL： ${process.env.NEXT_PUBLIC_APP_URL}<br>
                                ・メールアドレス： ${email}<br>
                                ・初期パスワード： ${tempPassword}
                                </p>
                                
                                <p>※ログイン後、マイページの「設定」からパスワードを変更可能です。</p>

                                <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">

                                <p><strong>■ 公式LINEについて</strong><br>
                                上記のボタンからスタートすると、公式LINEとの連携もスムーズに完了します。</p>

                                <p>これから始まるLuna Flowでの体験が、${customerDetails?.name || 'お客様'} 様にとって輝かしいものとなりますように。</p>

                                <p>Luna Flow 運営事務局</p>
                            `
                    });

                    if (emailError) {
                        console.error("[Webhook] Resend API Error:", emailError);
                    } else {
                        console.log(`[Webhook] Welcome email sent successfully to ${email}. ID: ${emailData?.id}`);
                    }
                } catch (e: any) {
                    console.error("[Webhook] Email Sending CRITICAL Error:", e);
                    // Don't throw here, allowing transaction to complete
                }
            } // Close else for auth fallback

            // 2. Log Purchase (PurchaseRequest) - MOVED OUTSIDE to run for BOTH Existing and New Users
            if (targetUserId) {
                const amount = session.amount_total || 0;
                let detectedPlan = 'premium'; // Default fallback

                // Logic: Initial Payment = Monthly + System Fee (5980)
                // Partner: 1980 + 5980 = 7960
                // Light: 5980 + 5980 = 11960
                // Standard: 12980 + 5980 = 18960
                // Premium: 19800 + 5980 = 25780

                // Also check for recurring amounts (just in case it's a renewal event, though this is checkout.session.completed)

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

                if (purchaseError) {
                    console.error("Purchase Insert Error:", purchaseError);
                } else {
                    console.log(`[Webhook] PurchaseRequest logged for user ${targetUserId}`);
                }
            }

        } // Close if (event.type === 'checkout.session.completed')

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error("Handler Logic Error:", err);
        return NextResponse.json({
            error: `Handler Check Failed`,
            details: err.message
        }, { status: 500 });
    }
}
