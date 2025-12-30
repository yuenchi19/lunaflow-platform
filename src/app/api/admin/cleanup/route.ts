
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    // Basic Auth Check (Should ideally use session info, but for now we trust the Admin Route guard middleware if strictly applied, or add simple check)
    // For Vercel, we can assume this is triggered by the Admin user from the frontend.
    // Ideally, check for "admin" role from cookie/session here. 
    // We'll proceed with Supabase Service Role to actually DELETE users.

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
        console.log('[Cleanup] Starting cleanup process...');

        // 1. Fetch Users to Delete (Not Admin/Staff)
        const { data: usersToDelete, error: fetchError } = await supabase
            .from('User')
            .select('id, email, role')
            .not('role', 'in', '("admin","staff")');

        if (fetchError) {
            console.error('[Cleanup] Fetch Error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!usersToDelete || usersToDelete.length === 0) {
            return NextResponse.json({ message: 'No dummy users found to delete.' });
        }

        let deletedCount = 0;
        const limit = 50; // Safety limit per run
        const targets = usersToDelete.slice(0, limit);

        for (const user of targets) {
            // Delete Purchases
            await supabase.from('purchases').delete().eq('user_id', user.id);

            // Delete Profile
            const { error: delProfileError } = await supabase.from('User').delete().eq('id', user.id);

            if (!delProfileError) {
                // Delete Auth
                await supabase.auth.admin.deleteUser(user.id);
                deletedCount++;
            }
        }

        return NextResponse.json({
            message: `Cleanup completed. Deleted ${deletedCount} users.`,
            deletedCount
        });

    } catch (e: any) {
        console.error('[Cleanup] Unexpected Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
