
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLineMagicLinkUrl } from '@/lib/line-auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get DB User ID from email (since Supabase ID might differ if we are syncing) 
        // OR assuming Supabase Auth User ID matches DB User ID? 
        // In this project, it seems User ID is CUID, not UUID from Supabase.
        // We need to fetch DB user by email.
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const url = await generateLineMagicLinkUrl(dbUser.id);

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Failed to generate LINE link', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
