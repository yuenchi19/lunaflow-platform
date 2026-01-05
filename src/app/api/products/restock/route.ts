
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const body = await req.json();
        const { productId, email } = body;

        // Either user is logged in (use their ID) or we rely on email?
        // User requested "Student registers email". They are likely logged in.
        // We will store userId + email.

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        await prisma.productRestockSubscription.create({
            data: {
                productId,
                email,
                userId: user?.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
