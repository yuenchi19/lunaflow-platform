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
        const secret = process.env.STRIPE_WEBHOOK_SECRET || "undefined";
        const maskedSecret = secret.length > 5 ? `${secret.substring(0, 5)}...` : secret;
        return NextResponse.json({
            error: `Webhook Error: ${error.message}`,
            debug_secret_prefix: maskedSecret,
            received_signature: signature ? "YES" : "NO"
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
                // Try to find user by email
                const { data: userByEmail, error: userLookupError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (userLookupError && userLookupError.code !== 'PGRST116') { // PGRST116 is "not found"
                    console.error("Profile Lookup Error:", userLookupError);
                    throw new Error(`Profile Lookup Error: ${userLookupError.message}`);
                }

                targetUserId = userByEmail?.id;
            }

            if (targetUserId) {
                // Update Profile
                const { error: updateError } = await supabaseAdmin.from('profiles').update({
                    name: customerDetails?.name,
                    // phone_number: customerDetails?.phone, // Optional
                    // address: ... // Simplify for now to reduce failure points
                    zip_code: customerDetails?.address?.postal_code,
                    role: 'student',
                    plan: 'premium',
                    stripe_customer_id: session.customer as string,
                    updated_at: new Date().toISOString()
                }).eq('id', targetUserId);

                if (updateError) {
                    throw new Error(`Profile Update Error: ${updateError.message}`);
                }
                console.log("[Webhook] Existing profile updated.");
            } else {
                // User doesn't exist -> Create Auth User
                console.log(`[Webhook] User not found for ${email}. Creating new account...`);

                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email!,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        name: customerDetails?.name || email!.split('@')[0],
                        role: 'student',
                        plan: 'premium'
                    }
                });

                if (createError) {
                    console.error("[Webhook] Failed to create user:", createError);
                    throw new Error(`User Creation Error: ${createError.message}`);
                }

                if (newUser.user) {
                    targetUserId = newUser.user.id;
                    console.log(`[Webhook] User created! ID: ${targetUserId}`);

                    // Real Email Sending with Resend
                    const { Resend } = await import('resend');
                    if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

                    const resend = new Resend(process.env.RESEND_API_KEY);

                    try {
                        const { data: emailData, error: emailError } = await resend.emails.send({
                            from: 'onboarding@resend.dev',
                            to: email!,
                            subject: '【重要】Luna Flowへようこそ！アカウント登録が完了しました ✨',
                            html: `
                                <p>${customerDetails?.name || 'お客様'} 様</p>
                                <p>Luna Flowへの入会誠にありがとうございます。<br>
                                お客様のアカウント作成が完了いたしました！</p>

                                <p>新しい一歩を踏み出すお手伝いができること、心より嬉しく思います。<br>
                                これから、理想の毎日を一緒に叶えていきましょう！</p>

                                <p>さっそく、以下の情報でマイページにログインいただけます。</p>
                                
                                <p><strong>■ ログイン情報</strong><br>
                                ・ログインURL： ${process.env.NEXT_PUBLIC_APP_URL}<br>
                                ・メールアドレス： ${email}<br>
                                ・初期パスワード： ${tempPassword}</p>
                                
                                <p>※セキュリティのため、ログイン後は速やかに「設定」よりパスワードの変更をお願いいたします。</p>

                                <p>これから始まるLuna Flowでの体験が、${customerDetails?.name || 'お客様'} 様にとって輝かしいものとなりますように。<br>
                                あなたの毎日が、もっと心地よく、もっと私らしくなりますように。<br>
                                心を込めて。</p>

                                <p>Luna Flow 運営事務局</p>
                            `
                        });
                        if (emailError) console.error("Resend Error:", emailError);
                    } catch (e: any) {
                        console.error("Email Only Error (Non-fatal):", e);
                        // Don't throw here, allowing transaction to complete
                    }
                }
            }

            // 2. Log Purchase
            if (targetUserId) {
                const { error: purchaseError } = await supabaseAdmin
                    .from('purchases')
                    .insert({
                        user_id: targetUserId,
                        stripe_session_id: session.id,
                        amount: session.amount_total || 0,
                        currency: session.currency || 'jpy',
                        status: 'succeeded'
                    });

                if (purchaseError) {
                    console.error("Purchase Insert Error:", purchaseError);
                    // Don't throw, critical part (user creation) is done
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error("Handler Logic Error:", err);
        return NextResponse.json({
            error: `Handler Check Failed`,
            details: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
