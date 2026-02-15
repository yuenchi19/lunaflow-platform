import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const postId = params.id;

        // Toggle Like
        const existingLike = await prisma.timelineLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: user.id
                }
            }
        });

        if (existingLike) {
            await prisma.timelineLike.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId: user.id
                    }
                }
            });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.timelineLike.create({
                data: {
                    postId,
                    userId: user.id
                }
            });
            return NextResponse.json({ liked: true });
        }

    } catch (error: any) {
        console.error("Timeline Like Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
