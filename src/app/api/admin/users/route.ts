import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                },
            },
        }
    );
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin/Staff
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'admin' && dbUser?.role !== 'staff') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch users
        // Filter: Valid Subscription OR Partner logic?
        // User request: "Valid Subscription (or non-partner?)" -> "Valid Subscription (or exclude Partner?)"
        // Request: "Filter to 'Has Valid Subscription' (or 'Partner Payment' excluded?)"
        // Text: "Stripe data based... 'Valid Subscription' (or Partner Payment excluded members)"
        // Actually: "Valid Subscription (OR Partner Payment members?)"
        // "有効なサブスクリプションを持つ（またはパートナー決済以外の）メンバー"
        // "Members with Valid Subscription (OR [maybe meaning non-partner? or partner included?])"
        // Interpreting as: Active Subscription is Key.
        // If Partner Payment users don't have stripe subscription status 'active', we need to check distinct field?
        // Let's return ALL users for now but include subscription status, and let Frontend filter?
        // Or filter here.
        // Let's include `subscriptionStatus` and `name`, `email`.

        const users = await prisma.user.findMany({
            where: {
                role: 'student', // Only assign to students
                // subscriptionStatus: 'active' // Optional strict filter
            },
            select: {
                id: true,
                name: true,
                email: true,
                subscriptionStatus: true,
                kobutsushoNumber: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Admin User Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
