import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch students using Prisma to bypass RLS and ensures generic visibility
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'student' },
                    { plan: { in: ['standard', 'premium'] } }
                ]
            },
            include: {
                purchaseRequests: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to format expected by UI
        const formattedUsers = users.map((u) => {
            // Calculate Total Purchase
            const totalPurchase = u.purchaseRequests?.reduce((acc: number, p: any) => {
                if (p.status === 'succeeded' || p.status === 'paid' || p.status === 'completed') {
                    return acc + (p.amount || 0);
                }
                return acc;
            }, 0) || 0;

            return {
                id: u.id,
                name: u.name || 'No Name',
                email: u.email,
                role: u.role,
                plan: u.plan,
                subscriptionStatus: u.subscriptionStatus || (u.status === 'active' ? 'active' : 'inactive'),
                communityNickname: u.communityNickname,
                registrationDate: u.createdAt,
                lifetimePurchaseTotal: totalPurchase,
                address: u.address,
                // Prisma user model might not have phoneNumber in schema? 
                // Schema has: zipCode, address. No phone? 
                // Schema.prisma: id, name, email, role, plan, affiliateCode, referredBy, communityNickname, zipCode, address, payoutPreference, createdAt, updatedAt.
                // NO PHONE in schema. 
                // API was mapping `u.phoneNumber`.
                phoneNumber: ""
            };
        });

        return NextResponse.json(formattedUsers);

    } catch (e: any) {
        console.error("Admin Student API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
