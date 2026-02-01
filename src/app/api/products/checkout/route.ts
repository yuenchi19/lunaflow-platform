
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
        const { items } = body; // Array of { id, quantity }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        const lineItems = [];
        const productIds = items.map((i: any) => i.id);

        // Fetch all products at once
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        for (const item of items) {
            const product = products.find(p => p.id === item.id);
            if (!product) continue;
            if (!product.stripePriceId || product.stock < item.quantity) {
                return NextResponse.json({ error: `在庫切れの商品があります: ${product.name}` }, { status: 400 });
            }

            lineItems.push({
                price: product.stripePriceId,
                quantity: item.quantity,
            });
        }

        // Fetch User Referrer
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { referredBy: true }
        });

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            client_reference_id: user.id,
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                type: 'product_purchase',
                referral: dbUser?.referredBy || '',
                item_count: items.length
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lunaflow.space'}/student/store/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lunaflow.space'}/student/store/cart`,
        });

        return NextResponse.json({ url: session.url });

    } catch (e: any) {
        console.error("Checkout Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
