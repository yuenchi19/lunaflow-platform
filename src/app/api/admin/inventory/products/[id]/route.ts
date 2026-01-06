
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAndNotifyRestock } from '@/lib/restock';
import { stripe } from '@/lib/stripe';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        // Remove 'id' if present in body to avoid update error
        const { id, ...updateData } = body;

        // 1. Get Old Product for comparison
        const oldProduct = await prisma.product.findUnique({ where: { id: params.id } });
        if (!oldProduct) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // 2. Update Product
        // Sanitize description for Stripe (not necessarily for DB, but let's keep DB consistent if we want)
        // Actually DB can hold empty string.

        const product = await prisma.product.update({
            where: { id: params.id },
            data: updateData
        });

        // 3. Check Restock
        if (typeof updateData.stock === 'number') {
            await checkAndNotifyRestock(product.id, oldProduct.stock, updateData.stock, product.name);
        }

        // 4. Update Stripe Product Details (Name, Description, Image)
        // We need 'stripeProductId'. We only have 'stripePriceId'. Retrieve Price to find Product.
        if (oldProduct.stripePriceId) {
            try {
                const priceObj = await stripe.prices.retrieve(oldProduct.stripePriceId);
                if (typeof priceObj.product === 'string') {
                    await stripe.products.update(priceObj.product, {
                        name: product.name,
                        description: product.description || undefined,
                        images: product.image ? [product.image] : [],
                    });
                }
            } catch (e) {
                console.error("Failed to update Stripe Product:", e);
            }
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
