
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const keys = searchParams.get('keys')?.split(',') || [];

    if (keys.length === 0) {
        const all = await prisma.systemConfig.findMany();
        return NextResponse.json(all.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {}));
    }

    const configs = await prisma.systemConfig.findMany({
        where: { key: { in: keys } }
    });

    const result = configs.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    return NextResponse.json(result);
}

export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Admin
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // In a real app we would check role here, but assuming middleware handles route protection?
    // API routes are NOT protected by middleware usually! Middleware protects Pages.
    // So we MUST check role here.

    // Fetch role from metadata or DB
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value !== 'string') {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updated = await prisma.systemConfig.upsert({
        where: { key: key },
        update: { value: value },
        create: { key: key, value: value }
    });

    return NextResponse.json(updated);
}
