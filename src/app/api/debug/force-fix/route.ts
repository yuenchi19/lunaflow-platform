
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        // Handle URL encoding issues (space instead of +)
        const rawEmail = searchParams.get('email') || 'yuenchi1991+light@gmail.com';
        const targetEmail = rawEmail.replace(/ /g, '+');

        const targetPlan = searchParams.get('plan') || 'light';
        const targetAddress = searchParams.get('address') || '〒100-0001 東京都千代田区1-1 (Universal Fix)';
        const targetZip = searchParams.get('zip') || '100-0001';

        // Admin Client for Auth Updates
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Fetch Current DB State
        const beforeDB = await prisma.user.findUnique({ where: { email: targetEmail } });
        if (!beforeDB) {
            return NextResponse.json({ error: `User not found: ${targetEmail}` }, { status: 404 });
        }

        // 2. Force Update DB
        const updatedDB = await prisma.user.update({
            where: { email: targetEmail },
            data: {
                plan: targetPlan,
                subscriptionStatus: 'active',
                address: targetAddress,
                zipCode: targetZip
            }
        });

        // 3. Force Update Auth Metadata
        // Try to get by ID from DB (assuming they are linked)
        let authUser = null;
        let authFoundMethod = 'none';

        if (updatedDB.id) {
            const { data, error } = await supabaseAdmin.auth.admin.getUserById(updatedDB.id);
            if (data?.user) {
                authUser = data.user;
                authFoundMethod = 'db_id';
            }
        }

        // Fallback: List scan if ID mismatch
        if (!authUser) {
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            authUser = users?.find(u => u.email === targetEmail) || null;
            if (authUser) authFoundMethod = 'list_scan';
        }

        let authUpdateResult = null;
        if (authUser) {
            const { data: updatedAuth, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                authUser.id,
                { user_metadata: { plan: targetPlan } } // Sync plan to metadata
            );
            if (updateError) throw updateError;
            authUpdateResult = updatedAuth.user.user_metadata;
        }

        return NextResponse.json({
            message: `Universal Fix Executed for ${targetEmail}`,
            params: { targetPlan, targetAddress },
            db: {
                before: { plan: beforeDB?.plan },
                after: { plan: updatedDB.plan, address: updatedDB.address }
            },
            auth: {
                found: !!authUser,
                foundMethod: authFoundMethod,
                metadataUpdated: authUpdateResult
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
