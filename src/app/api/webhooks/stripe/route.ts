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
        return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
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
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    name: customerDetails?.name,
                    phone_number: customerDetails?.phone,
                    // Schema has 'address' as text. Let's format it nicely or store JSON if you want structured.
                    // Request was "address" field. Let's format text for compatibility with Settings page text area.
                    address: customerDetails?.address ?
                        `〒${customerDetails.address.postal_code} ${customerDetails.address.state}${customerDetails.address.city}${customerDetails.address.line1} ${customerDetails.address.line2 || ''}`
                        : null,
                    zip_code: customerDetails?.address?.postal_code,
                    role: 'student', // Ensure role
                    plan: 'premium', // Or derive from Price ID
                    stripe_customer_id: session.customer as string,
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetUserId);

            if (profileError) console.error("Profile Update Error:", profileError);
            else console.log("[Webhook] Profile updated successfully.");
        } else {
            console.warn(`[Webhook] User not found for email: ${email}. Profile sync skipped (User must sign up first).`);
            // Optional: Create a "Pending Purchase" record to link later?
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
