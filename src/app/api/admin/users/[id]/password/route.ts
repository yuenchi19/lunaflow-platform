import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API to change user password
// Updated: Force Vercel Deploy Trigger
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

        // 1. Get DB User to retrieve Email and Name
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findUnique({
            where: { id: params.id },
            select: { email: true, name: true }
        });

        if (!dbUser || !dbUser.email) {
            return NextResponse.json({ error: 'Database User not found' }, { status: 404 });
        }

        // 2. Find Auth User ID by Email
        const { data: authData, error: listError } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (listError) throw listError;

        const authUser = authData.users.find(u => u.email === dbUser.email);

        // 3. Auto-Heal: If Auth User is MISSING, Create it.
        if (!authUser) {
            console.log(`[Admin Password Reset] Auth user MISSING for ${dbUser.email}. Attempting Auto-Heal (Re-creation)...`);

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: dbUser.email,
                password: password,
                email_confirm: true,
                user_metadata: { name: dbUser.name || 'Restored User' }
            });

            if (createError || !newUser.user) {
                console.error('[Admin Password Reset] Auto-Heal Failed:', createError);
                return NextResponse.json({ error: `Auth account missing & Recovery failed: ${createError?.message}` }, { status: 500 });
            }

            const newAuthId = newUser.user.id;
            console.log(`[Admin Password Reset] Auto-Heal Success. New Auth ID: ${newAuthId}. Migrating DB ID...`);

            // 4. Migrate DB ID to match new Auth ID (Critical for Data Link)
            try {
                // Try to update the ID.
                await prisma.user.update({
                    where: { id: params.id },
                    data: { id: newAuthId }
                });
                console.log(`[Admin Password Reset] DB ID Migration Success: ${params.id} -> ${newAuthId}`);

                return NextResponse.json({
                    success: true,
                    message: 'Password set. (Account restored & data relinked)',
                    details: 'Auth account was missing and has been recreated.'
                });

            } catch (dbError: any) {
                console.error('[Admin Password Reset] DB ID Migration Failed (FK Constraints?):', dbError);
                return NextResponse.json({
                    success: true,
                    message: 'Password set (New Account), but Data Link requires manual fix.',
                    warning: 'Foreign Key Constraint prevented ID update. User logs in as fresh account.',
                    newAuthId: newAuthId,
                    oldDbId: params.id
                });
            }
        }

        // 5. Normal Path: Link Found. Update Password.
        console.log(`[Admin Password Reset] Found Auth User ${authUser.id}. Updating password...`);
        const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: password,
            user_metadata: { email_verified: true }
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
