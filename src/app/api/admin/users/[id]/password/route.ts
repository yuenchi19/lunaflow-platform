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

        const { data, error } = await supabase.auth.admin.updateUserById(id, {
            password: password
        });

        if (error) {
            console.error('[Admin Password Reset] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 }); // Bad Request likely (e.g. invalid pass)
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (e: any) {
        console.error('[Admin Password Reset] Exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
