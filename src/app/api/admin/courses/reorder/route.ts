import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Expecting body to be an array of objects: { id: string, order: number }
        const { list } = body;

        if (!Array.isArray(list)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Transactional update for all items
        await prisma.$transaction(
            list.map((item: { id: string; order: number }) =>
                prisma.course.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering courses:', error);
        return NextResponse.json({ error: 'Failed to reorder courses' }, { status: 500 });
    }
}
