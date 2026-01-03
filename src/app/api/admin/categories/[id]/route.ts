
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch category details with blocks
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { title, published } = body;

        const updated = await prisma.category.update({
            where: { id: params.id },
            data: {
                title,
                published
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.category.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
