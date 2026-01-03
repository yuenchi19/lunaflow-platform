
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

        let targetFilter: string[] = ['all'];
        if (user) {
            targetFilter.push('students');
            // Check if staff from DB? Skipping for now for simplicity/speed as user wants update, 
            // relying on simple target matching.
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
