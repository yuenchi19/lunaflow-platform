
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
        return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    // Limit to latest 50 messages
    const messages = await prisma.message.findMany({
        where: { channelId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    communityNickname: true,
                    avatarUrl: true,
                    role: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }, // Older first is standard for chat history usually, or desc if paginating. Simple: Ascending.
        take: 50
    });

    return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value)); } catch { } },
                },
            }
        );

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { channelId, content, imageUrl } = body;

        if (!channelId || !content) {
            return NextResponse.json({ error: "Content required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true }
        });

        if (!user) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

        const newMessage = await prisma.message.create({
            data: {
                userId: user.id,
                channelId,
                content,
                imageUrl
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        communityNickname: true,
                        avatarUrl: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json(newMessage);

    } catch (e: any) {
        console.error("Chat API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
