
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, description, price, image, stock, isVisible, brand, category, condition, accessories } = body;

        // Fetch current product to check if price changed (optimization) or just create new price
        // For robustness, let's create a new Stripe Price if price is provided. 
        // We need stripePriceId for Checkout.

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        let stripePriceId = body.stripePriceId; // Preserve existing if not changing

        // If price is being updated, we MUST generate a new Stripe Price ID
        if (price) {
            // We need the product ID from Stripe? 
            // Ideally we store stripeProductId too. 
            // But we only stored stripePriceId. 
            // We can retrieve the Price from Stripe to get the Product ID, OR just create a new Product/Price pair?
            // Creating a new Product/Price pair for every update is spammy but safe for "Product" model (EC).

            // Better: Retrieve the Price object using the old stripePriceId (if we have it), get product, then create new Price.
            // Remove 'id' if present in body to avoid update error
            const { id, ...updateData } = body;

            // 1. Get Old Product for comparison
            const oldProduct = await prisma.product.findUnique({ where: { id: params.id } });
            if (!oldProduct) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            // 2. Update Product
            const product = await prisma.product.update({
                where: { id: params.id },
                data: updateData
            });

            // 3. Check Restock
            if (typeof updateData.stock === 'number') {
                await checkAndNotifyRestock(product.id, oldProduct.stock, updateData.stock, product.name);
            }

            // 4. Update Stripe if Price Changed
            if (oldProduct.price !== product.price) {
                const newPrice = await stripe.prices.create({
                    unit_amount: product.price,
                    currency: 'jpy',
                    product_data: { name: product.name }, // Create new product/price combo
                });
                await prisma.product.update({
                    where: { id: product.id },
                    data: { stripePriceId: newPrice.id }
                });
            }

            return NextResponse.json(product);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
        try {
            await prisma.product.delete({ where: { id: params.id } });
            return NextResponse.json({ success: true });
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }
