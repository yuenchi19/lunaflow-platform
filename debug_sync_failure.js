
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    console.log("--- STARTING DEBUG SYNC ---");

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("CRITICAL: STRIPE_SECRET_KEY is missing!");
        return;
    }

    // 1. Fetch ALL subscriptions
    console.log("Fetching Stripe Subscriptions...");
    let hasMore = true;
    let startingAfter = undefined;
    const allSubs = [];

    while (hasMore) {
        const response = await stripe.subscriptions.list({
            limit: 100,
            status: 'all',
            expand: ['data.customer', 'data.items.data.price'],
            starting_after: startingAfter
        });
        allSubs.push(...response.data);
        if (response.has_more) {
            startingAfter = response.data[response.data.length - 1].id;
        } else {
            hasMore = false;
        }
    }
    console.log(`Fetched ${allSubs.length} subscriptions.`);

    // 2. Build Map
    const subMap = new Map();
    for (const sub of allSubs) {
        const customer = sub.customer;
        const email = customer.email ? customer.email.toLowerCase() : null;
        if (email) {
            // Priority: keep Active ones
            const existing = subMap.get(email);
            if (existing && existing.status === 'active' && sub.status !== 'active') continue;

            subMap.set(email, {
                id: sub.id,
                status: sub.status,
                plan: sub.items.data[0].price.unit_amount,
                customerId: customer.id
            });
        }
    }
    console.log(`Map built with ${subMap.size} unique emails.`);

    // 3. Check specific user
    const targetEmail = 'yuenchi1991+rite4@gmail.com'.toLowerCase();
    const mapEntry = subMap.get(targetEmail);
    console.log(`\nChecking Map for ${targetEmail}:`, mapEntry || "NOT FOUND IN MAP");

    // 4. Simulate Sync Loop for Users
    const users = await prisma.user.findMany();
    console.log(`\nChecking DB Users (${users.length} found):`);

    for (const user of users) {
        const email = user.email.toLowerCase();
        const entry = subMap.get(email);

        let status = 'inactive';
        let reason = 'Not in Map';

        if (entry) {
            status = entry.status === 'active' || entry.status === 'trialing' ? 'active' : 'inactive';
            reason = `Found in Map (${entry.status})`;
        } else {
            // Simulate Search Fallback
            // (Only for target user to save time/API calls)
            if (email.includes('yuenchi1991')) {
                console.log(`\n[Search Fallback] Searching Stripe for ${email}...`);
                const customers = await stripe.customers.list({ email: email, expand: ['data.subscriptions'] });
                if (customers.data.length > 0) {
                    const cust = customers.data[0];
                    const subs = cust.subscriptions.data;
                    const activeSub = subs.find(s => s.status === 'active' || s.status === 'trialing');
                    if (activeSub) {
                        status = 'active';
                        reason = 'Found via Search (Active Sub)';
                    } else {
                        reason = 'Found Customer but No Active Sub';
                    }
                } else {
                    reason = 'Customer Not Found';
                }
            }
        }

        if (user.status === 'active' && status === 'inactive') {
            console.log(`[ALERT] User ${email} would be DEACTIVATED. Reason: ${reason}`);
        } else if (email.includes('yuenchi1991')) {
            console.log(`User ${email}: DB=${user.status} -> New=${status}. Reason: ${reason}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
