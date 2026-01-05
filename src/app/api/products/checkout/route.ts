
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { productId } = body;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.stripePriceId || product.stock < 1) {
            return NextResponse.json({ error: 'Product unavailable' }, { status: 400 });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            client_reference_id: user.id,
            line_items: [
                {
                    price: product.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                type: 'product_purchase',
                productId: product.id
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lunaflow.space'}/student/store/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lunaflow.space'}/student/store`,
        });

        return NextResponse.json({ url: session.url });

    } catch (e: any) {
        console.error("Checkout Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
