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

        const posts = await prisma.timelinePost.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        communityNickname: true,
                        avatarUrl: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                },
                likes: {
                    where: { userId: user.id },
                    select: { userId: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Format for frontend
        const formattedPosts = posts.map(post => ({
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            user: post.user,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            isLiked: post.likes.length > 0
        }));

        return NextResponse.json(formattedPosts);

    } catch (error: any) {
        console.error("Timeline GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content, imageUrl } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const newPost = await prisma.timelinePost.create({
            data: {
                userId: user.id,
                content: content,
                imageUrl: imageUrl || null
            },
            include: {
                user: {
                    select: {
                        name: true,
                        communityNickname: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return NextResponse.json(newPost);

    } catch (error: any) {
        console.error("Timeline POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
