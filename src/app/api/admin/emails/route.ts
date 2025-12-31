import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ideally check for admin role here as well

        const emails = await prisma.sentEmail.findMany({
            orderBy: {
                sentAt: 'desc'
            }
        });

        // Map to match the frontend expected type if necessary, or just return as is
        // Frontend expects SentEmail interface
        // Prisma SentEmail: id, recipientName, recipientEmail, subject, content, sentAt, status
        // Types SentEmail: id, recipientName, recipientEmail, subject, content, sentAt, status
        // It matches.

        return NextResponse.json(emails);

    } catch (error: any) {
        console.error('Admin Emails Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
