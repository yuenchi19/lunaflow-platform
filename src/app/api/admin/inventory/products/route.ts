
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, price, image, stock, isVisible } = body;

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // 1. Create Product in Stripe (for appearance in Checkout)
        const stripeProduct = await stripe.products.create({
            name: name,
            description: description,
            images: image ? [image] : [],
            metadata: {
                app: 'lunaflow'
            }
        });

        // 2. Create Price in Stripe
        const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: parseInt(price),
            currency: 'jpy',
        });

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseInt(price),
                image,
                stripePriceId: stripePrice.id,
                stock: parseInt(stock),
                isVisible,
                // New Fields
                brand: body.brand,
                category: body.category,
                condition: body.condition,
                accessories: body.accessories || []
            }
        });

        return NextResponse.json(product);
    } catch (e: any) {
        console.error("Product Create Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
