import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is missing in environment variables. Stripe features will default to mock or fail safely.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build', {
    apiVersion: '2025-12-15.clover' as any, // Using latest/beta version or casting to any to bypass strict type check if needed
    typescript: true,
});
