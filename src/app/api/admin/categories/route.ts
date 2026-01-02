
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Handle Reorder
        if (body.action === 'reorder') {
            const { items } = body; // [{id, order}]

            // Transaction for safety
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.category.update({
                        where: { id: item.id },
                        data: { order: item.order }
                    })
                )
            );
            return NextResponse.json({ success: true });
        }

        // Handle Create
        const { courseId, title } = body;

        // Get max order
        const lastCat = await prisma.category.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastCat?.order ?? 0) + 1;

        const category = await prisma.category.create({
            data: {
                courseId,
                title,
                order: newOrder
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
