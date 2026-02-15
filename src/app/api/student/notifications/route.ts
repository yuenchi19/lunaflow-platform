import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Check for unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false
            }
        });

        return NextResponse.json({ notifications, unreadCount });

    } catch (error: any) {
        console.error("Notifications GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, readAll } = body;

        if (readAll) {
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true });
        }

        if (id) {
            await prisma.notification.update({
                where: { id },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    } catch (error: any) {
        console.error("Notifications PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
