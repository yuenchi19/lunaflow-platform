
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/client'; // or server

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const targetEmail = 'yuenchi1991+light@gmail.com';

        // 1. Fetch Current State
        const before = await prisma.user.findUnique({ where: { email: targetEmail } });

        // 2. Force Update
        const updated = await prisma.user.update({
            where: { email: targetEmail },
            data: {
                plan: 'light',
                subscriptionStatus: 'active',
                address: '〒344-0023 埼玉県春日部市 (Manual synced)',
                zipCode: '344-0023'
            }
        });

        return NextResponse.json({
            message: 'Emergency Fix Executed',
            before: {
                plan: before?.plan,
                address: before?.address,
                dbUrl: process.env.DATABASE_URL ? 'Set' : 'Unset' // Check env
            },
            after: {
                plan: updated.plan,
                address: updated.address,
                id: updated.id
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
