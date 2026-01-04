const { Stripe } = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_****', {
    apiVersion: '2023-10-16',
});

async function main() {
    const email = 'yuenchi1991+light@gmail.com';
    console.log(`Checking Stripe for ${email}...`);

    // 1. Search for Customer
    const customers = await stripe.customers.search({
        query: `email:'${email}'`,
    });

    if (customers.data.length === 0) {
        console.log("No customer found in Stripe.");
    } else {
        console.log(`Found ${customers.data.length} customer(s).`);
        for (const cust of customers.data) {
            console.log(`- Customer ID: ${cust.id}, Deleted: ${cust.deleted}`);

            // 2. Fetch Subscriptions
            const subs = await stripe.subscriptions.list({
                customer: cust.id,
                status: 'all',
                limit: 10
            });
            console.log(`  Subscriptions (${subs.data.length}):`);
            for (const sub of subs.data) {
                console.log(`    - ID: ${sub.id}, Status: ${sub.status}, CancelAtPeriodEnd: ${sub.cancel_at_period_end}, CurrentPeriodEnd: ${new Date(sub.current_period_end * 1000).toISOString()}`);
            }
        }
    }
}

main().catch(console.error);
