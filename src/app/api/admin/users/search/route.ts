import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        return NextResponse.json(users);

    } catch (error: any) {
        console.error("User Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
