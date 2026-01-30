import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Verify Authentication (Standard Way)
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ authenticated: false, plan: null }, { status: 401 });
    }

    // 2. Fetch User Profile using SERVICE ROLE (Bypass RLS)
    // This ensures we can read the profile even if RLS policies are missing/broken
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3ZweXJ2cnp4bWhodmV0cXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkxMzAxMSwiZXhwIjoyMDgyNDg5MDExfQ.65o0Qbg4fBMPAPVHeKLi8z_OaimA0wS46GDk8WRgrqw"
    );

    const { data: profile, error } = await supabaseAdmin
        .from('User')
        .select('plan, role, subscriptionStatus')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        // Fallback: Check User Metadata from Auth Object (if sync'd)
        const metaPlan = user.user_metadata?.plan;

        if (metaPlan === 'premium' || metaPlan === 'standard') {
            return NextResponse.json({
                authenticated: true,
                plan: metaPlan,
                role: user.user_metadata?.role || 'student',
                subscriptionStatus: 'active' // Metadata implies active
            });
        }

        return NextResponse.json({ authenticated: true, plan: null, error: 'Profile not found' });
    }

    const response = NextResponse.json({
        authenticated: true,
        plan: profile.plan,
        role: profile.role,
        subscriptionStatus: profile.subscriptionStatus
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
}
