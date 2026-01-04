import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch single course details (with categories/blocks if needed)
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const course = await prisma.course.findUnique({
            where: { id: params.id },
            include: {
                categories: {
                    include: {
                        blocks: true
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update course
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        // Allow updating title, label, etc.
        const { title, label, description, published, order, allowedPlans } = body;

        const updated = await prisma.course.update({
            where: { id: params.id },
            data: {
                title,
                label,
                description,
                published,
                order,
                allowedPlans
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete course
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.course.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
