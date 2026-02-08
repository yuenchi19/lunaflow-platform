
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStudentStatus } from '@/lib/utils';
import { getQuota } from '@/lib/quota';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                purchaseRequests: true,
                rewardTransactions: true,
                // If progress is stored in DB, include it. 
                // Currently progress might be in a separate table or just 'User' JSON? 
                // Looking at schema, currently there is NO explicit 'Progress' table linked to user in the snippet I saw?
                // Wait, previous context showed 'getStudentProgressDetail' reading from... let's check lib/data.
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Mocking payments from PurchaseRequests (as done in list) or separate table? 
        // The list page calculated total purchase from PurchaseRequests. 
        // We will construct 'payments' from PurchaseRequests for consistency if no dedicated Payment table exists.
        // Actually, the frontend expects 'Payment[]'.

        const payments = user.purchaseRequests
            .filter(req => req.status === 'completed' || req.status === 'succeeded') // Adjust based on actual status enums
            .map(req => ({
                id: req.id,
                userId: req.userId,
                date: req.createdAt, // or scheduledDate
                amount: req.amount,
                method: req.stripeInvoiceId ? 'stripe' : 'manual',
                status: req.status
            }));

        // Mock Progress for now if DB doesn't have it, or fetch if available.
        // Since I haven't seen a Progress model in schema, I will check if I should return empty or mock.
        // For now, let's just return what we have.

        // Fetch Quota
        const quota = await getQuota(user.id);

        return NextResponse.json({
            user: {
                ...user,
                // Add computed total if needed, or rely on frontend
                lifetimePurchaseTotal: payments.reduce((sum, p) => sum + p.amount || 0, 0),
                registrationDate: user.createdAt.toISOString().split('T')[0] // Format YYYY-MM-DD
            },
            quota: {
                researchCount: quota.researchCount,
                researchLimit: quota.researchLimit,
                listingCount: quota.listingCount,
                listingLimit: quota.listingLimit
            },
            payments,
            progressLogs: [] // Placeholder until we confirm where logs are stored
        });

    } catch (e: any) {
        console.error("Fetch Student Detail Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { name, email, plan, communityNickname, lineUserId, researchLimit, listingLimit } = body;

        // Update User
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                plan,
                communityNickname,
                lineUserId: lineUserId || null // Handle empty string
            }
        });

        // Update/Upsert Quota if limits provided
        if (researchLimit !== undefined || listingLimit !== undefined) {
            const date = new Date();
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            await prisma.userQuota.upsert({
                where: {
                    userId_month: {
                        userId: id,
                        month
                    }
                },
                update: {
                    researchLimit: researchLimit !== undefined ? Number(researchLimit) : undefined,
                    listingLimit: listingLimit !== undefined ? Number(listingLimit) : undefined
                },
                create: {
                    userId: id,
                    month,
                    researchLimit: researchLimit !== undefined ? Number(researchLimit) : 50,
                    listingLimit: listingLimit !== undefined ? Number(listingLimit) : 50
                }
            });
        }

        // Fetch fresh data to return
        // Reuse GET logic or just return updated User? 
        // For simplicity, just return updatedUser and assume frontend updates state. 
        // But frontend expects { user: ... } format from handleSave?
        // Let's check handleSave in page.tsx: `setStudent(data.user)`.

        return NextResponse.json({
            user: updatedUser,
            message: "Updated successfully"
        });

    } catch (e: any) {
        console.error("Update Student Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
