
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
        const { name, description, price, image, stripePriceId, stock, isVisible } = body;

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseInt(price),
                image,
                stripePriceId,
                stock: parseInt(stock),
                isVisible
            }
        });

        return NextResponse.json(product);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
