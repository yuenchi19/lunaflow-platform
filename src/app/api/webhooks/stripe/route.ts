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
                    .select('id')
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
                    .select('role')
                    .eq('id', targetUserId)
                    .single();

                const currentRole = existingUser?.role || 'student';
                // Only update role to 'student' if current role is NOT admin/staff
                const newRole = (currentRole === 'admin' || currentRole === 'staff') ? currentRole : 'student';

                // Update Existing User
                const { error: updateError } = await supabaseAdmin.from('User').update({
                    name: customerDetails?.name,
                    zipCode: customerDetails?.address?.postal_code, // camelCase
                    role: newRole,
                    plan: 'premium',
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
                // listUsers is heavy, better to use getUserByEmail? 
                // Admin API doesn't have getUserByEmail easily exposed in type definition sometimes, 
                // but usually createClient(..., { auth: { autoRefreshToken: false } }).auth.admin.getUserByEmail(email) works.
                // Let's rely on listUsers filter for now or try/catch createUser.

                // Better approach: Try to create. If fails with "User already registered", then GET user.

                console.log(`[Webhook] User not found in Public Table for ${email}. Checking Auth...`);

                let authUserId = null;
                const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                // 1. Try Create
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

                if (newUser?.user) {
                    authUserId = newUser.user.id;
                    console.log(`[Webhook] New Auth User created! ID: ${authUserId}`);

                    // Send Email ONLY for new users
                    // ... (Email logic) ...
                } else if (createError && createError.message.includes("already registered")) {
                    console.log("[Webhook] Auth User already exists. Linking...");
                    // 2. Fallback: Find the existing auth user
                    // Since specific API might be vague, let's list users with filter? 
                    // Or just use the error? We need the ID.
                    // supabaseAdmin.auth.admin.listUsers() isn't ideal for High Scale, but for now:

                    // Attempt to fetch user by email (Available in recent Supabase JS)
                    // @ts-ignore
                    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
                    // Filter locally (Inefficient but robust if API method missing)
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
                            plan: 'premium',
                            zipCode: customerDetails?.address?.postal_code,
                            updatedAt: new Date().toISOString()
                        });

                    if (profileInsertError) {
                        console.error("[Webhook] Failed to create public User profile:", profileInsertError);
                    } else {
                        console.log(`[Webhook] Public User profile created/restored!`);
                    }
                }


                // Real Email Sending with Resend
                const { Resend } = await import('resend');
                if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

                const resend = new Resend(process.env.RESEND_API_KEY);

                try {
                    const { data: emailData, error: emailError } = await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
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
                    }
                }
            } // Close else for auth fallback (if targetUserId was null initially)

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
