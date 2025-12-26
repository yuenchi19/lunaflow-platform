import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            // For development without webhook secret, we might just log headers
            // But in production this is critical.
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

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        // Retrieve the subscription details from Stripe.
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        console.log(`[Stripe Webhook] Payment successful for session ID: ${session.id}`);
        console.log(`[Stripe Webhook] Customer Email: ${session.customer_details?.email}`);
        console.log(`[Stripe Webhook] Subscription Status: ${subscription.status}`);

        // Extract Customer Details for DB Sync
        const customerDetails = session.customer_details;
        const syncData = {
            name: customerDetails?.name,
            email: customerDetails?.email,
            phone: customerDetails?.phone,
            address: {
                line1: customerDetails?.address?.line1,
                line2: customerDetails?.address?.line2,
                city: customerDetails?.address?.city,
                state: customerDetails?.address?.state,
                postal_code: customerDetails?.address?.postal_code,
                country: customerDetails?.address?.country,
            }
        };

        console.log(`[Stripe Webhook] SYNCING CUSTOMER DATA:`, JSON.stringify(syncData, null, 2));

        // TODO: In a real app, you would verify the user exists and update their profile
        // await db.user.update({
        //   where: { email: syncData.email },
        //   data: {
        //     name: syncData.name,
        //     phoneNumber: syncData.phone,
        //     address: `${syncData.address.postal_code} ${syncData.address.state}${syncData.address.city}${syncData.address.line1}${syncData.address.line2 || ''}`
        //   }
        // });
        console.log(`[Stripe Webhook] MOCK DB UPDATE: User Profile Updated.`);

        // TODO: In a real app, you would update the database here.
        // const userId = session.client_reference_id;
        // await updateDatabase(userId, { plan: 'premium', status: 'active' });
        console.log(`[Stripe Webhook] MOCK DB UPDATE: User plan activated.`);
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        console.log(`[Stripe Webhook] Recurring payment succeeded for subscription: ${subscription.id}`);
        // TODO: Extend validity in database
    }

    return NextResponse.json({ received: true });
}
