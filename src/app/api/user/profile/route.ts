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
        const { name, avatarUrl, zipCode, address, communityNickname, bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountHolder, invoiceRegistrationNumber, kobutsushoNumber, agreedToCompliance, communityRulesAgreed, communityIntroRead } = body;

        // Construct update data dynamically to ensure we only update fields that are present
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (address !== undefined) updateData.address = address;
        if (communityNickname !== undefined) updateData.communityNickname = communityNickname;
        if (bankName !== undefined) updateData.bankName = bankName;
        if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
        if (bankAccountType !== undefined) updateData.bankAccountType = bankAccountType;
        if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
        if (bankAccountHolder !== undefined) updateData.bankAccountHolder = bankAccountHolder;
        if (invoiceRegistrationNumber !== undefined) updateData.invoiceRegistrationNumber = invoiceRegistrationNumber;
        if (kobutsushoNumber !== undefined) updateData.kobutsushoNumber = kobutsushoNumber;
        if (agreedToCompliance !== undefined) updateData.agreedToCompliance = agreedToCompliance;
        if (communityRulesAgreed !== undefined) updateData.communityRulesAgreed = communityRulesAgreed;
        if (communityIntroRead !== undefined) updateData.communityIntroRead = communityIntroRead;

        console.log('Updating Profile for:', authUser.id, updateData);

        const updatedUser = await prisma.user.update({
            where: { id: authUser.id },
            data: updateData
        });

        return NextResponse.json(updatedUser);

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
