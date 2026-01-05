
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, description, price, image, stripePriceId, stock, isVisible } = body;

        const product = await prisma.product.update({
            where: { id: params.id },
            data: {
                name,
                description,
                price: parseInt(price),
                image,
                stripePriceId,
                stock: parseInt(stock),
                isVisible: Boolean(isVisible)
            }
        });

        return NextResponse.json(product);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.product.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
