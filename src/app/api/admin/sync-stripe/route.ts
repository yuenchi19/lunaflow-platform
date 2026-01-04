import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log("[Sync] Starting Stripe Subscription Sync...");

        // 1. Fetch ALL subscriptions from Stripe (Pagination)
        let hasMore = true;
        let startingAfter: string | undefined = undefined;
        const allSubs: any[] = [];

        while (hasMore) {
            const response = await stripe.subscriptions.list({
                limit: 100,
                status: 'all',
                expand: ['data.customer'],
                starting_after: startingAfter
            });

            allSubs.push(...response.data);

            if (response.has_more && response.data.length > 0) {
                startingAfter = response.data[response.data.length - 1].id;
            } else {
                hasMore = false;
            }
        }

        console.log(`[Sync] Fetched total ${allSubs.length} subscriptions.`);

        const activeEmails = new Set<string>();
        const subMap = new Map<string, any>();

        for (const sub of allSubs) {
            const customer = sub.customer as any;
            // Handle deleted customer case where customer might not have email field expanded or is null
            // Check if customer object exists and has email, OR check deleted
            if (!customer || customer.deleted) continue;

            const email = customer.email;
            if (email) {
                const currentStatus = sub.status;
                const existingEntry = subMap.get(email);

                const isActiveLike = (s: string) => ['active', 'trialing'].includes(s);

                // Priority Logic:
                // 1. If we already have an ACTIVE entry, don't overwrite it with a non-active one.
                // 2. If the current sub is ACTIVE, definitely save it.
                // 3. Otherwise (current is canceled/past_due etc), saves it only if we don't have an entry yet.
                //    (Wait, if we have a canceled entry, and find another canceled one, it doesn't matter much.
                //     But we want to capture the "most meaningful" status.)

                let shouldUpdate = true;
                if (existingEntry) {
                    if (isActiveLike(existingEntry.status)) {
                        shouldUpdate = false; // Already have active, keep it.
                    } else if (isActiveLike(currentStatus)) {
                        shouldUpdate = true; // New one is active, upgrade.
                    } else {
                        // Both are non-active. Maybe keep the latest?
                        // For now, overwrite is fine.
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate) {
                    subMap.set(email, {
                        stripeCustomerId: customer.id,
                        stripeSubscriptionId: sub.id,
                        status: currentStatus
                    });
                }
            }
        }

        console.log(`[Sync] Found ${activeEmails.size} active emails in Stripe.`);

        // 2. Fetch all DB Users
        const users = await prisma.user.findMany();
        let updatedCount = 0;

        for (const user of users) {
            const stripeData = subMap.get(user.email);

            let newStatus = 'inactive';
            let newSubStatus = 'none';
            let stripeCustId = user.stripeCustomerId; // Keep existing if not found? Or overwrite? 
            let stripeSubId = user.stripeSubscriptionId;

            if (stripeData) {
                // User exists in Stripe List
                stripeCustId = stripeData.stripeCustomerId;
                stripeSubId = stripeData.stripeSubscriptionId;
                newSubStatus = stripeData.status;

                if (newSubStatus === 'active' || newSubStatus === 'trialing') {
                    newStatus = 'active';
                } else {
                    newStatus = 'inactive';
                }
            } else {
                // User NOT in Stripe List at all (or limit reached).
                // If we fetched 'all', then they likely don't have a subscription or it's very old.
                // EXCEPTION: Admin/Staff should stay active
                if (user.role === 'admin' || user.role === 'staff') {
                    newStatus = 'active';
                    newSubStatus = 'active'; // Fake it or leave as is?
                } else {
                    newStatus = 'inactive';
                    newSubStatus = 'none';
                }
            }

            // Perform Update
            if (user.status !== newStatus || user.subscriptionStatus !== newSubStatus || user.stripeSubscriptionId !== stripeSubId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: newStatus,
                        subscriptionStatus: newSubStatus,
                        stripeCustomerId: stripeCustId,
                        stripeSubscriptionId: stripeSubId
                    }
                });
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${users.length} users. Updated ${updatedCount}.`,
            activeCount: activeEmails.size
        });

    } catch (e: any) {
        console.error("[Sync] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
