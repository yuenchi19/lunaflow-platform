
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const rules = await prisma.featureUnlock.findMany();
        return NextResponse.json(rules);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { key, plan, status, courseId, blockId } = body;

        const rule = await prisma.featureUnlock.upsert({
            where: {
                featureKey_plan: {
                    featureKey: key,
                    plan: plan || 'standard'
                }
            },
            update: {
                status: status || 'active',
                requiredCourseId: courseId,
                requiredBlockId: blockId
            },
            create: {
                featureKey: key,
                plan: plan || 'standard',
                status: status || 'active',
                requiredCourseId: courseId,
                requiredBlockId: blockId
            },
        });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error('Unlock Rule Update Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update rule' }, { status: 500 });
    }
}
// Alias POST to PUT logic for compatibility/fixing 405
export async function POST(req: NextRequest) {
    return PUT(req);
}
