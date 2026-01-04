import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const debugEmail = searchParams.get('debug_email')?.toLowerCase();
        const debugLog: string[] = [];

        console.log("[Sync] Starting Stripe Subscription Sync...");
        if (debugEmail) debugLog.push(`Debug Mode for: ${debugEmail}`);

        // 1. Fetch ALL subscriptions from Stripe (Pagination)
        let hasMore = true;
        let startingAfter: string | undefined = undefined;
        const allSubs: any[] = [];

        while (hasMore) {
            const response: any = await stripe.subscriptions.list({
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

        const subMap = new Map<string, any>();

        for (const sub of allSubs) {
            const customer = sub.customer as any;
            if (!customer || customer.deleted) continue;

            const email = customer.email?.toLowerCase(); // Case insensitive
            if (email) {
                const currentStatus = sub.status;
                const existingEntry = subMap.get(email);

                const isActiveLike = (s: string) => ['active', 'trialing'].includes(s);

                let shouldUpdate = true;
                if (existingEntry) {
                    if (isActiveLike(existingEntry.status)) {
                        shouldUpdate = false;
                    } else if (isActiveLike(currentStatus)) {
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate) {
                    subMap.set(email, {
                        stripeCustomerId: customer.id,
                        stripeSubscriptionId: sub.id,
                        status: currentStatus,
                        cancelAtPeriodEnd: sub.cancel_at_period_end
                    });
                }

                if (debugEmail && email === debugEmail) {
                    debugLog.push(`Found Stripe Sub: ${sub.id}, Status: ${currentStatus}, CancelAtPeriodEnd: ${sub.cancel_at_period_end}`);
                }
            }
        }

        // 2. Fetch all DB Users
        const users = await prisma.user.findMany();
        let updatedCount = 0;

        for (const user of users) {
            const userEmail = user.email.toLowerCase();
            const stripeData = subMap.get(userEmail);

            let newStatus = 'inactive';
            let newSubStatus = 'none';
            const u = user as any;
            let stripeCustId = u.stripeCustomerId;
            let stripeSubId = u.stripeSubscriptionId;

            if (stripeData) {
                stripeCustId = stripeData.stripeCustomerId;
                stripeSubId = stripeData.stripeSubscriptionId;
                newSubStatus = stripeData.status;

                // Priority Logic
                if (newSubStatus === 'active' || newSubStatus === 'trialing') {
                    newStatus = 'active';
                } else {
                    newStatus = 'inactive';
                }

                if (debugEmail && userEmail === debugEmail) {
                    debugLog.push(`Match Found. StripeStatus: ${newSubStatus} -> DB Status: ${newStatus}`);
                }
            } else {
                if (user.role === 'admin' || user.role === 'staff') {
                    newStatus = 'active';
                    newSubStatus = 'active';
                    if (debugEmail && userEmail === debugEmail) debugLog.push(`No Stripe, but Admin/Staff -> Active`);
                } else {
                    newStatus = 'inactive';
                    newSubStatus = 'none';
                    if (debugEmail && userEmail === debugEmail) debugLog.push(`No Stripe, Student -> Inactive`);
                }
            }

            // Cast to any to avoid TS errors if types are stale
            // const u = user as any; // Removed duplicate
            if (u.status !== newStatus || u.subscriptionStatus !== newSubStatus || u.stripeSubscriptionId !== stripeSubId) {
                // Update Prisma DB
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: newStatus,
                        subscriptionStatus: newSubStatus,
                        stripeCustomerId: stripeCustId,
                        stripeSubscriptionId: stripeSubId
                    } as any
                });
                updatedCount++;
                if (debugEmail && userEmail === debugEmail) debugLog.push(`UPDATED DB to: ${newStatus} / ${newSubStatus}`);

                // SYNC TO AUTH METADATA (Critical for Login Protection)
                // We need Supabase Admin Client here
                const { createClient } = await import('@supabase/supabase-js');
                if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    const supabaseAdmin = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL,
                        process.env.SUPABASE_SERVICE_ROLE_KEY,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    // Supabase User ID might differ from Prisma ID if they were created differently?
                    // Usually Prisma ID IS Supabase ID.
                    try {
                        await supabaseAdmin.auth.admin.updateUserById(user.id, {
                            user_metadata: { subscriptionStatus: newSubStatus }
                        });
                        console.log(`[Sync] Updated Auth Metadata for ${user.email}`);
                    } catch (authErr) {
                        console.error(`[Sync] Auth Update Failed for ${user.email}`, authErr);
                    }
                }

            } else {
                if (debugEmail && userEmail === debugEmail) debugLog.push(`No DB Change Needed. Current: ${user.status} / ${user.subscriptionStatus}`);
                // SKIP FORCE SYNC to prevent Timeout with large userbase
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${users.length} users. Updated ${updatedCount}.`,
            debugLog: debugLog
        });

    } catch (e: any) {
        console.error("[Sync] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
