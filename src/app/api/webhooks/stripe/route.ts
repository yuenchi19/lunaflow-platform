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
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Extract Customer Details
        const customerDetails = session.customer_details;
        const email = customerDetails?.email;
        const userId = session.client_reference_id; // Passed from Checkout creation if available

        console.log(`[Webhook] Processing checkout for: ${email}`);

        // 1. Sync Profile (Upsert)
        // Note: In a real flow, the user might already exist via Auth. 
        // We match by ID if client_reference_id is present (best), or Email (fallback).
        // Since we don't have client_reference_id guaranteed here without auth flow integration,
        // we'll try to find user by email.

        let targetUserId = userId;

        if (!targetUserId && email) {
            // Try to find user by email
            const { data: userByEmail } = await supabaseAdmin
                .from('profiles') // or auth.users? We can't query auth.users easily without direct DB access or specific admin API
                // querying 'profiles' is safer if we sync profiles on signup.
                .select('id')
                .eq('email', email)
                .single();

            targetUserId = userByEmail?.id;
        }

        if (targetUserId) {
            // Update Profile
            await supabaseAdmin.from('profiles').update({
                name: customerDetails?.name,
                phone_number: customerDetails?.phone,
                address: customerDetails?.address ?
                    `〒${customerDetails.address.postal_code} ${customerDetails.address.state}${customerDetails.address.city}${customerDetails.address.line1} ${customerDetails.address.line2 || ''}`
                    : null,
                zip_code: customerDetails?.address?.postal_code,
                role: 'student',
                plan: 'premium',
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString()
            }).eq('id', targetUserId);

            console.log("[Webhook] Existing profile updated.");
        } else {
            // User doesn't exist -> Create Auth User
            console.log(`[Webhook] User not found for ${email}. Creating new account...`);

            // Generate Random Temp Password
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8); // e.g. "a1b2c3d4e5f6"

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email!,
                password: tempPassword,
                email_confirm: true, // Auto-confirm
                user_metadata: {
                    name: customerDetails?.name || email!.split('@')[0],
                    role: 'student',
                    plan: 'premium'
                }
            });

            if (createError) {
                console.error("[Webhook] Failed to create user:", createError);
                // Return success anyway to avoid Stripe retry loop for business logic error
                // (or throw if you want retry)
            } else if (newUser.user) {
                targetUserId = newUser.user.id;
                console.log(`[Webhook] User created! ID: ${targetUserId}`);
                console.log(`[Webhook] TEMP PASSWORD for ${email}: ${tempPassword}`);

                // Real Email Sending with Resend
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                try {
                    const { data: emailData, error: emailError } = await resend.emails.send({
                        from: 'onboarding@resend.dev', // Default for testing. User should verify domain later.
                        to: email!, // If using 'onboarding@resend.dev', 'to' must be the verified email in Resend dashboard during testing.
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

                    if (emailError) {
                        console.error("[Webhook] Resend Error:", emailError);
                    } else {
                        console.log(`[Webhook] Email sent! ID: ${emailData?.id}`);
                    }
                } catch (e: any) {
                    console.error("[Webhook] Failed to send email:", e.message);
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

            if (purchaseError) console.error("Purchase Insert Error:", purchaseError);
            else console.log("[Webhook] Purchase recorded.");
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        // Handle renewal logic if needed (update plan expiration?)
        console.log(`[Webhook] Recurring payment received.`);
    }

    return NextResponse.json({ received: true });
}
