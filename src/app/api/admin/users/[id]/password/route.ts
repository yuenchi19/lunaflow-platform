import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API to change user password
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const id = params.id;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Configuration Error: Missing Admin Keys' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const body = await req.json();
        const { password } = body;

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // 1. Get DB User to retrieve Email
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findUnique({
            where: { id: params.id },
            select: { email: true }
        });

        if (!dbUser || !dbUser.email) {
            return NextResponse.json({ error: 'Database User not found' }, { status: 404 });
        }

        // 2. Find Auth User ID by Email
        const { data: authData, error: listError } = await supabase.auth.admin.listUsers({
            perPage: 1000 // Simple search for now
        });

        if (listError) throw listError;

        const authUser = authData.users.find(u => u.email === dbUser.email);

        if (!authUser) {
            console.error(`[Admin Password Reset] Auth user miss for ${dbUser.email}. DB Id: ${params.id}`);
            return NextResponse.json({ error: `Auth account missing for ${dbUser.email}` }, { status: 404 });
        }

        // 3. Update Password using correct Auth ID
        const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: password,
            user_metadata: { email_verified: true } // Ensure verified if resetting
        });

        if (error) {
            console.error('[Admin Password Reset] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (e: any) {
        console.error('[Admin Password Reset] Exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
