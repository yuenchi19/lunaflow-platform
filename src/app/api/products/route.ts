import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isVisible: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
