
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.affiliateCode) {
            return NextResponse.json({ affiliateCode: user.affiliateCode });
        }

        // Generate Code
        let code = "";
        let isUnique = false;

        // Try 3 times
        for (let i = 0; i < 3; i++) {
            // Simple generation: Name prefix + random or just random
            // Using random 8 chars
            code = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 chars

            const existing = await prisma.user.findUnique({
                where: { affiliateCode: code }
            });
            if (!existing) {
                isUnique = true;
                break;
            }
        }

        if (!isUnique) {
            throw new Error("Failed to generate unique code");
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { affiliateCode: code }
        });

        return NextResponse.json({ affiliateCode: updated.affiliateCode });

    } catch (error) {
        console.error('Affiliate generation failed', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
