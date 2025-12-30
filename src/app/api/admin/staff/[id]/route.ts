
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const id = params.id;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const { name, email, role, status } = body;

        // Update User table
        const { error } = await supabase
            .from('User')
            .update({ name, role, email }) // Note: Email update in DB doesn't change Auth email automatically. 
            // Creating a robust sync is complex. We will update DB metadata for now.
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also try to update Auth Metadata if possible
        await supabase.auth.admin.updateUserById(id, {
            user_metadata: { name, role }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const id = params.id;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Delete from Auth (Cascade should handle DB, but safety first)
        const { error } = await supabase.auth.admin.deleteUser(id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
