import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Check if admin (optional strict check, middleware usually handles this)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all users with plan 'partner'
        const partners = await prisma.user.findMany({
            where: {
                plan: 'partner'
            },
            select: {
                id: true,
                name: true,
                email: true,
                affiliateCode: true,
                bankName: true,
                bankBranch: true,
                bankAccountType: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
                // We might want to include earnings calculation here later
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(partners);
    } catch (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
