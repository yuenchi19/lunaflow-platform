import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2025-12-15.cloverType', // The type definition might be slightly different key, but usually 'apiVersion'. 
    // Wait, the error said "2025-12-15.clover" is required type.
    // If I put it here, it will be globally fixed.
    apiVersion: '2025-12-15.clover',
    typescript: true,
});
