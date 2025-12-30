
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();

    // 1. Get Current User Session (Standard Auth)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    // 2. Use Service Role to Update DB (Bypass RLS)
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the User table
    const { error: updateError } = await adminSupabase
        .from('User')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update user role', details: updateError }, { status: 500 });
    }

    // Update User Metadata as fallback (optional but good practice)
    await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { role: 'admin' }
    });

    // 3. Redirect to Admin Dashboard
    // We use a 307 Temporary Redirect
    const url = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(url);
}
