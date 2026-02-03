import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Manual Supabase Client creation to avoid build-time "cookies()" error
    let response = NextResponse.next({ request: { headers: req.headers } });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );

    // Auth Check
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role Check
    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (dbUser?.role !== 'admin' && dbUser?.role !== 'staff' && dbUser?.role !== 'accounting') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Data Fetch
    const requests = await prisma.purchaseRequest.findMany({
        include: {
            user: true,
            inventoryItems: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return NextResponse.json(requests);
}
