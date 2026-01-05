
import { NextResponse, NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const debugEmail = searchParams.get('debug_email')?.toLowerCase();
        const debugLog: string[] = [];

        console.log("[Sync] Starting ROBUST Stripe Subscription Sync...");
        if (debugEmail) debugLog.push(`Debug Mode for: ${debugEmail}`);

        // --- STEP 1: Fetch ALL Subscriptions ---
        console.log("[Sync] Fetching ALL Subscriptions...");
        let hasMoreSubs = true;
        let startingAfterSub = undefined;
        const allSubs: any[] = [];

        while (hasMoreSubs) {
            const response: any = await stripe.subscriptions.list({
                limit: 100,
                status: 'all', // status: 'all' is CRITICAL
                expand: ['data.items.data.price'], // Dropped customer expand (reliable link via ID)
                starting_after: startingAfterSub
            });
            allSubs.push(...response.data);
            if (response.has_more && response.data.length > 0) {
                startingAfterSub = response.data[response.data.length - 1].id;
            } else {
                hasMoreSubs = false;
            }
        }
        console.log(`[Sync] Fetched ${allSubs.length} subscriptions.`);

        // --- STEP 2: Fetch ALL Customers ---
        // Crucial to avoid N+1 queries and ensure we find everyone (Ghosts included)
        console.log("[Sync] Fetching ALL Customers...");
        let hasMoreCust = true;
        let startingAfterCust = undefined;
        const customerMap = new Map<string, any>(); // Map<id, Customer>
        const customerEmailMap = new Map<string, any>(); // Map<email, Customer>

        while (hasMoreCust) {
            const response: any = await stripe.customers.list({
                limit: 100,
                starting_after: startingAfterCust
            });

            for (const cust of response.data) {
                customerMap.set(cust.id, cust);
                if (cust.email) {
                    customerEmailMap.set(cust.email.toLowerCase(), cust);
                }
            }

            if (response.has_more && response.data.length > 0) {
                startingAfterCust = response.data[response.data.length - 1].id;
            } else {
                hasMoreCust = false;
            }
        }
        console.log(`[Sync] Fetched and Mapped ${customerMap.size} customers.`);

        // --- STEP 3: Build Subscription Map by Email ---
        const subMap = new Map<string, any>();

        for (const sub of allSubs) {
            // Resolve Customer
            let customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
            const customer = customerMap.get(customerId);

            if (!customer || customer.deleted) continue;

            const email = customer.email?.toLowerCase();
            if (email) {
                const currentStatus = sub.status;
                const existingEntry = subMap.get(email);

                // Logic: Prioritize ACTIVE status
                const isActiveLike = (s: string) => ['active', 'trialing'].includes(s);
                let shouldUpdate = true;

                // If existing is active and new is not, Keep existing.
                // If existing is not active and new IS, Update.
                if (existingEntry) {
                    if (isActiveLike(existingEntry.status) && !isActiveLike(currentStatus)) {
                        shouldUpdate = false; // Don't downgrade status if we found an active one earlier
                    }
                }

                if (shouldUpdate) {
                    const amount = sub.items?.data[0]?.price?.unit_amount || 0;
                    const PLAN_MAP: Record<number, string> = {
                        29800: 'premium', 25780: 'premium', 19800: 'premium',
                        9800: 'standard', 18960: 'standard', 12980: 'standard',
                        2980: 'light', 11960: 'light', 5980: 'light',
                        1980: 'partner', 7960: 'partner'
                    };
                    const detectedPlan = PLAN_MAP[amount] || 'student';

                    // Address Logic (Customer -> Shipping -> Empty)
                    const shipping = customer.shipping;
                    let addrObj = customer.address;
                    if (!addrObj || (!addrObj.line1 && !addrObj.city)) {
                        if (shipping?.address) addrObj = shipping.address;
                    }
                    const address = addrObj ?
                        `${addrObj.state || ''}${addrObj.city || ''}${addrObj.line1 || ''}${addrObj.line2 || ''}`
                        : '';
                    const zipCode = addrObj?.postal_code || '';

                    subMap.set(email, {
                        stripeCustomerId: customer.id,
                        stripeSubscriptionId: sub.id,
                        status: currentStatus,
                        plan: detectedPlan,
                        address: address,
                        zipCode: zipCode
                    });
                }
            }
        }
        console.log(`[Sync] Built SubMap with ${subMap.size} unique emails.`);

        // --- STEP 4: Update DB Users ---
        const users = await prisma.user.findMany();
        let updatedCount = 0;

        for (const user of users) {
            const userEmail = user.email.toLowerCase();

            // Default: Inactive
            let newStatus = 'inactive';
            let newSubStatus = 'none';
            let stripeCustId = user.stripeCustomerId;
            let stripeSubId = user.stripeSubscriptionId;
            let detectedPlan = user.plan;
            let newAddress = user.address;
            let newZip = user.zipCode;

            // 1. Check SubMap (Active/Trialing or recent sub)
            const subEntry = subMap.get(userEmail);

            if (subEntry) {
                // Found Subscription!
                newStatus = ['active', 'trialing'].includes(subEntry.status) ? 'active' : 'inactive';
                newSubStatus = subEntry.status;
                stripeCustId = subEntry.stripeCustomerId;
                stripeSubId = subEntry.stripeSubscriptionId;
                detectedPlan = subEntry.plan;

                // Only update address if we found one (don't clear existing DB addy purely on null, unless strictly required?)
                // User wants strict sync, so we overwrite.
                if (subEntry.address) newAddress = subEntry.address;
                if (subEntry.zipCode) newZip = subEntry.zipCode;

                if (debugEmail && userEmail === debugEmail) debugLog.push(`[Sync] Match via Sub: ${newStatus} (${detectedPlan})`);
            } else {
                // 2. Check Customer Map (No Sub, but Customer exists?)
                // This handles "Ghost" (Customer exists but no sub)
                const custEntry = customerEmailMap.get(userEmail);
                if (custEntry) {
                    stripeCustId = custEntry.id;
                    newSubStatus = 'none';
                    newStatus = 'inactive';

                    // Try to recover address from customer even if no sub
                    const shipping = custEntry.shipping;
                    let addrObj = custEntry.address;
                    if (!addrObj || (!addrObj.line1 && !addrObj.city)) {
                        if (shipping?.address) addrObj = shipping.address;
                    }
                    if (addrObj) {
                        const addrStr = `${addrObj.state || ''}${addrObj.city || ''}${addrObj.line1 || ''}${addrObj.line2 || ''}`;
                        if (addrStr) newAddress = addrStr;
                        if (addrObj.postal_code) newZip = addrObj.postal_code;
                    } // If invalid address, keep existing DB address to be safe? 
                    // Or sync empty? User wants "Correct Address".
                    // If Stripe has no address, and DB has one, maybe DB is better? 
                    // But user said "Address sync ... default value remains".
                    // Let's assume Stripe is source of truth.

                    if (debugEmail && userEmail === debugEmail) debugLog.push(`[Sync] Match via Customer (No Sub): Inactive`);
                } else {
                    // 3. Ghost (No Customer, No Sub)
                    newStatus = 'inactive';
                    newSubStatus = 'none';
                    if (debugEmail && userEmail === debugEmail) debugLog.push(`[Sync] No Match: Inactive`);
                }
            }

            // Exceptions
            if (user.role === 'admin' || user.role === 'staff') {
                newStatus = 'active';
            }

            // Update DB
            const u = user as any;
            if (u.status !== newStatus || u.subscriptionStatus !== newSubStatus || u.stripeSubscriptionId !== stripeSubId || u.stripeCustomerId !== stripeCustId || u.plan !== detectedPlan || u.address !== newAddress) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: newStatus,
                        subscriptionStatus: newSubStatus,
                        stripeCustomerId: stripeCustId,
                        stripeSubscriptionId: stripeSubId,
                        plan: detectedPlan,
                        address: newAddress,
                        zipCode: newZip
                    } as any
                });
                updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Robust Sync Completed. Processed ${users.length} users. Updated ${updatedCount}.`,
            debugLog: debugLog
        });

    } catch (e: any) {
        console.error("[Sync] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
