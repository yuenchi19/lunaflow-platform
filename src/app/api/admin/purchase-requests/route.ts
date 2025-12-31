import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optional: Check if admin (assuming role is in public.users or handled via simpler check for now)
        // ideally we check db user role
        const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
        if (dbUser?.role !== 'admin' && dbUser?.role !== 'staff' && dbUser?.role !== 'accounting') {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const requests = await prisma.purchaseRequest.findMany({
            include: {
                user: true // Fetch user details
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(requests);

    } catch (error: any) {
        console.error('Admin Purchase Request Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
