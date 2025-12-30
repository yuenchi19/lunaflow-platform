
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['admin', 'staff', 'accounting']) // Include accounting as staff-like
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching staff:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedUsers = users.map((u: any) => ({
            id: u.id,
            name: u.name || 'No Name',
            email: u.email,
            role: u.role,
            avatarUrl: u.avatar_url || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`,
            joinedAt: u.created_at,
        }));

        return NextResponse.json(formattedUsers);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const { email, name, role } = body;

        // 1. Create Auth User (Invite)
        const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { name, role }
        });

        if (authError) {
            // If user already exists, we might just want to update their role in DB if they are not staff yet?
            // For now, return error.
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Ensure DB entry exists (Trigger usually handles this, but we update role)
        // Check if user exists in public.User
        const userId = authData.user.id;

        // Upsert to profiles table to ensure Role is set
        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                name: name,
                role: role,
                updated_at: new Date().toISOString()
            });

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: authData.user });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
