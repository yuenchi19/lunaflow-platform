
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get DB user to check role if needed? For now just return public/student news.
        // Assuming public for everyone? Or filter by target?
        // Prompt implies "students side", so likely filtering for target=students OR all.
        // If no user, maybe only 'all'?
        // Let's assume logged in user mainly.

        // Always include 'students' for the dashboard API to ensure visibility
        // even if auth context is partial or stricter checks fail temporarily.
        let targetFilter: string[] = ['all', 'students'];
        if (user) {
            // Can extend for staff later
        }

        const news = await prisma.announcement.findMany({
            where: {
                status: 'published',
                target: { in: targetFilter }
            },
            orderBy: {
                publishedAt: 'desc'
            }
        });

        // Format for frontend (matches existing Mock format with 'date' string)
        const formattedNews = news.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            date: item.publishedAt.toISOString().split('T')[0], // YYYY-MM-DD
            target: item.target
        }));

        return NextResponse.json(formattedNews);
    } catch (error) {
        console.error('Failed to fetch news', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
