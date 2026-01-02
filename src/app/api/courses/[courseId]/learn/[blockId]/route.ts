import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { courseId: string; blockId: string } }) {
    try {
        const { courseId, blockId } = params;

        // Fetch Block
        const block = await prisma.block.findUnique({
            where: { id: blockId },
        });

        if (!block) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        // Fetch Category
        const category = await prisma.category.findUnique({
            where: { id: block.categoryId }
        });

        // Determine Next Block Logic (Simplified: Fetch all blocks in course flatly sorted)
        // A optimized way:
        /*
           1. Get all categories in course (ordered).
           2. Get all blocks in those categories (ordered).
           3. Find current index, return next.
        */

        // Let's implement this logic to support "Next Lesson"
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                categories: {
                    include: { blocks: { orderBy: { order: 'asc' } } },
                    orderBy: { order: 'asc' }
                }
            }
        });

        let nextBlockId = null;
        let prevBlockId = null;

        if (course && course.categories) {
            const allBlocks = course.categories.flatMap(c => c.blocks.map(b => ({ ...b, categoryId: c.id })));
            const idx = allBlocks.findIndex(b => b.id === blockId);
            if (idx >= 0) {
                if (idx < allBlocks.length - 1) nextBlockId = allBlocks[idx + 1].id;
                if (idx > 0) prevBlockId = allBlocks[idx - 1].id;
            }
        }

        return NextResponse.json({
            block,
            category,
            nextBlockId,
            prevBlockId
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
