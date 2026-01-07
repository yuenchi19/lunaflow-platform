import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, zipCode, address, communityNickname, bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountHolder, invoiceRegistrationNumber, kobutsushoNumber } = body;

        // Note: Email update is more complex due to Auth provider sync, so we might skip it here or just update the DB record if it's display only.
        // For now, we update the DB fields.

        const updatedUser = await prisma.user.update({
            where: { id: authUser.id }, // Assuming ID matches Auth ID for now, or we lookup by Email
            data: {
                name,
                zipCode,
                address,
                communityNickname,
                bankName,
                bankBranch,
                bankAccountType,
                bankAccountNumber,
                bankAccountHolder,
                invoiceRegistrationNumber,
                kobutsushoNumber
                // Not updating email here to avoid desync with Auth
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
