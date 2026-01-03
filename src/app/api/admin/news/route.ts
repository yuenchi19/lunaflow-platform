
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const news = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formattedNews = news.map((item: any) => ({
            id: item.id,
            title: item.title,
            target: item.target,
            date: item.publishedAt.toISOString().split('T')[0],
            status: item.status,
            content: item.content
        }));

        return NextResponse.json(formattedNews);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, target, status, content, date } = body;

        // Use provided date or now
        const publishedAt = date ? new Date(date) : new Date();

        const newItem = await prisma.announcement.create({
            data: {
                title,
                target: target || 'all',
                status: status || 'draft',
                content: content || '',
                publishedAt
            }
        });

        // Return formatted
        return NextResponse.json({
            id: newItem.id,
            title: newItem.title,
            target: newItem.target,
            date: newItem.publishedAt.toISOString().split('T')[0],
            status: newItem.status,
            content: newItem.content
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
    }
}
