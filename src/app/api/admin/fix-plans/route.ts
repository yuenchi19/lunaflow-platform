import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fix Partner
        const p1 = await prisma.user.updateMany({
            where: { email: { contains: '+partner' } },
            data: { plan: 'partner' }
        });

        // Fix Light
        const p2 = await prisma.user.updateMany({
            where: { email: { contains: '+light' } },
            data: { plan: 'light' }
        });

        // Fix Standard
        const p3 = await prisma.user.updateMany({
            where: { email: { contains: '+standard' } },
            data: { plan: 'standard' }
        });

        return NextResponse.json({
            success: true,
            message: "Plans patched",
            results: { partner: p1.count, light: p2.count, standard: p3.count }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
