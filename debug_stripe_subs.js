
const { Stripe } = require('stripe');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
    console.log('Fetching ALL subscriptions...');
    let hasMore = true;
    let startingAfter = undefined;
    const allSubs = [];

    while (hasMore) {
        const response = await stripe.subscriptions.list({
            limit: 100,
            status: 'all', // The user was concerned about this
            expand: ['data.customer'],
            starting_after: startingAfter
        });
        allSubs.push(...response.data);
        if (response.has_more) {
            startingAfter = response.data[response.data.length - 1].id;
        } else {
            hasMore = false;
        }
    }

    console.log(`Total Subs Fetched: ${allSubs.length}`);

    // Filter for known emails
    const targetEmails = ['yuenchi1991+rite4@gmail.com', 'yuenchi1991+light@gmail.com'];

    // Print summary
    allSubs.forEach(sub => {
        const cust = sub.customer;
        const email = cust.email || 'NO_EMAIL';
        const address = cust.address;
        const shipping = cust.shipping;

        console.log(`[${sub.status}] ${email} (${sub.id})`);
        console.log(`   Plan Amount: ${sub.plan?.amount || sub.items?.data[0]?.price?.unit_amount}`);
        console.log(`   Customer Address: ${JSON.stringify(address)}`);
        console.log(`   Shipping Address: ${JSON.stringify(shipping?.address)}`);
        console.log('---');
    });
}

main().catch(console.error);
