
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
            .update({ name, role, email, status }) // Note: Email update in DB doesn't change Auth email automatically. 
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
        // Attempt to DELETE from Auth first (Prevent Login)
        // If this fails, the user might not be in Auth, but we still want to clean DB.
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) {
            console.warn(`[Staff Delete] Auth delete warning: ${authError.message}`);
            // Proceed to DB delete anyway, as Auth might be desynced
        }

        // Try HARD DELETE from DB
        const { error: dbError } = await supabase
            .from('User')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error(`[Staff Delete] Hard delete failed (likely FK constraint): ${dbError.message}`);

            // FALLBACK: SOFT DELETE (Deactivate & Remove Role)
            // If we can't delete the row, we strip permissions and hide them.
            const { error: updateError } = await supabase
                .from('User')
                .update({
                    status: 'inactive',
                    role: 'student', // Downgrade to student so they don't show up in Staff list if filter is by role
                    subscriptionStatus: 'canceled'
                })
                .eq('id', id);

            if (updateError) {
                return NextResponse.json({ error: `Failed to delete and failed to deactivate: ${updateError.message}` }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Soft deleted due to constraints' });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
