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

        // Get the user's profile to find their Stripe Customer ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_customer_id) {
            // Ideally, create a customer if missing or return error. 
            // For now, if no customer ID, they probably haven't paid yet.
            return NextResponse.json({ error: 'No Billing Account found' }, { status: 400 });
        }

        const returnUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/student/dashboard`
            : 'http://localhost:3000/student/dashboard'; // Fallback for local

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (err: any) {
        console.error(err);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
