import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Find Stripe Customer ID via Purchase History (since User table might not have it synced)
        const { data: latestPurchase } = await supabase
            .from('purchases')
            .select('stripe_session_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let stripeCustomerId = null;

        if (latestPurchase?.stripe_session_id) {
            const session = await stripe.checkout.sessions.retrieve(latestPurchase.stripe_session_id);
            stripeCustomerId = session.customer as string;
        }

        if (!stripeCustomerId) {
            // Fallback: Try to find by email if no purchase history (rare for paid users)
            if (user.email) {
                const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                }
            }
        }

        if (!stripeCustomerId) {
            return NextResponse.json({ error: 'No Billing Account found' }, { status: 400 });
        }

        const returnUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/student/dashboard`
            : 'http://localhost:3000/student/dashboard';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (err: any) {
        console.error(err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
