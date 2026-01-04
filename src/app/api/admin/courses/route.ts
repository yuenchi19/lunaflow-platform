import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all courses
export async function GET() {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { categories: true }
                }
            }
        });

        const formatted = courses.map(c => ({
            id: c.id,
            title: c.title,
            label: c.label,
            categoryCount: c._count.categories,
            studentCount: 0, // TODO: Implement real student count
            order: c.order,
            thumbnailUrl: c.thumbnailUrl,
            published: c.published,
            allowedPlans: c.allowedPlans
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new course
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, label, allowedPlans } = body;

        // Get max order to append at end
        const lastCourse = await prisma.course.findFirst({
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastCourse?.order ?? 0) + 1;

        const course = await prisma.course.create({
            data: {
                title,
                label,
                allowedPlans: allowedPlans || ['light', 'standard', 'premium'], // Default all
                order: newOrder,
                published: true
            }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
