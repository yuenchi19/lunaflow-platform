
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Reusing Service Role execution for reliability in Admin context
// Ideally, use cookies() + createServerComponentClient for RLS, but without knowing RLS policies, 
// Service Role is the "Hammer" to ensure Admin sees data.
// We assume this route is protected by Middleware or parent layout checks.

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    try {
        // Fetch students
        // Note: Joining with purchases to calculate totals would be ideal.
        // For Supabase, we can use foreign key join if set up, or just fetch purchases separately.
        // Let's try to select purchases too.

        // Check if 'purchases' relation exists. In schema.sql it references profile(id).
        // Prisma schema also has relation.
        // Supabase Postgrest syntax:

        const { data: users, error } = await supabase
            .from('profiles')
            .select(`
                *,
                purchases (
                    amount,
                    status
                )
            `)
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching students:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to format expected by UI
        const formattedUsers = users.map((u: any) => {
            // Calculate Total Purchase
            const totalPurchase = u.purchases?.reduce((acc: number, p: any) => {
                if (p.status === 'succeeded' || p.status === 'paid') {
                    return acc + (p.amount || 0);
                }
                return acc;
            }, 0) || 0;

            return {
                id: u.id,
                name: u.name || 'No Name',
                email: u.email,
                role: u.role,
                plan: u.plan,
                subscriptionStatus: 'active', // Placeholder until logic checks Stripe Sub
                communityNickname: u.community_nickname, // snake_case
                registrationDate: u.created_at, // snake_case
                lifetimePurchaseTotal: totalPurchase,
                address: u.address,
                phoneNumber: u.phone_number // snake_case
            };
        });

        return NextResponse.json(formattedUsers);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
