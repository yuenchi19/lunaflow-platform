import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

// This is a minimal webhook handler to verify integration.
// In a production environment with a real DB, you would verify signature and update user status.
export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    try {
        const body = await req.text();
        // NOTE: In a real app we must verify signature:
        // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        // For development/mock without local tunnel setup, we just parse body:
        const event = JSON.parse(body);

        console.log(`Received Stripe Event: ${event.type}`);

        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            console.log(`💰 Payment succeeded for Invoice: ${invoice.id}, Customer: ${invoice.customer}, Amount: ${invoice.amount_paid}`);

            // TODO: Here you would:
            // 1. Find the Purchase Request in DB by Customer Email or Metadata
            // 2. Update status to 'paid'
            // 3. Send notification email to admin/user
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
