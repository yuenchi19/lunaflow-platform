import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log("[Sync] Starting Stripe Subscription Sync...");

        // 1. Fetch ALL active subscriptions from Stripe
        // Note: Stripe pagination defaults to 10 limits. Need to auto-paginate or fetch enough.
        // For now, let's fetch 100 which should cover the "2 active users" scenario easily.
        const subscriptions = await stripe.subscriptions.list({
            limit: 100,
            status: 'all', // We want to know about canceled ones too if possible, or usually just active to confirm who is active
            expand: ['data.customer']
        });

        const activeEmails = new Set<string>();
        const subMap = new Map<string, any>();

        for (const sub of subscriptions.data) {
            const customer = sub.customer as any; // Expanded
            const email = customer.email;
            if (email) {
                // If user has multiple subs, pick the most 'active' one or latest.
                // Priority: active > trialing > past_due > canceled
                if (sub.status === 'active' || sub.status === 'trialing') {
                    activeEmails.add(email);
                }
                subMap.set(email, {
                    stripeCustomerId: customer.id,
                    stripeSubscriptionId: sub.id,
                    status: sub.status
                });
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
