
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['line_reminder_enabled', 'line_reminder_days', 'line_reminder_template'] }
            }
        });

        const config = {
            enabled: settings.find(s => s.key === 'line_reminder_enabled')?.value === 'true',
            days: parseInt(settings.find(s => s.key === 'line_reminder_days')?.value || '7'),
            template: settings.find(s => s.key === 'line_reminder_template')?.value || 'お久しぶりです！学習の進捗はいかがですか？\nまた一緒に頑張りましょう！\n\n[Login URL]'
        };

        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch LINE settings', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { enabled, days, template } = body;

        await prisma.$transaction([
            prisma.systemSetting.upsert({
                where: { key: 'line_reminder_enabled' },
                update: { value: String(enabled) },
                create: { key: 'line_reminder_enabled', value: String(enabled) }
            }),
            prisma.systemSetting.upsert({
                where: { key: 'line_reminder_days' },
                update: { value: String(days) },
                create: { key: 'line_reminder_days', value: String(days) }
            }),
            prisma.systemSetting.upsert({
                where: { key: 'line_reminder_template' },
                update: { value: template },
                create: { key: 'line_reminder_template', value: template }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update LINE settings', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
