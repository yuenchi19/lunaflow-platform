import { STRIPE_PRICES } from "./data";

/**
 * LunaFlow x PromoteKit Integration
 * This helper simulates the server-side or client-side logic required to pass
 * the PromoteKit referral ID to Stripe during checkout creation.
 */

// 1. Get the global PromoteKit referral ID from cookies
// In a real Next.js Server Action or API Route, you would parse cookies.
// Here we simulate checking the client-side cookie or window object.
export function getPromoteKitReferralId(): string | null {
    if (typeof window === "undefined") return null;

    // Check window object first (PromoteKit implementation detail)
    // @ts-ignore
    if (typeof window.promotekit_referral === "string") {
        // @ts-ignore
        return window.promotekit_referral;
    }

    // Fallback to reading cookie manually
    const match = document.cookie.match(new RegExp('(^| )promotekit_referral=([^;]+)'));
    if (match) return match[2];

    return null;
}

/**
 * Mock function to Simulate creating a Stripe Checkout Session.
 * This demonstrates the Metadata payload requirement.
 */
export async function createMockStripeSession(plan: 'light' | 'standard' | 'premium' | 'partner') {
    const referralId = getPromoteKitReferralId();
    const priceId = STRIPE_PRICES[plan];

    console.log("Creating Stripe Checkout Session...");
    console.log("Plan:", plan);
    console.log("Price ID:", priceId);
    console.log("Referral ID found:", referralId);

    // This is the payload structure you MUST send to Stripe API
    const sessionPayload = {
        mode: 'subscription',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        // CRITICAL: Pass referral ID to Stripe Metadata
        metadata: {
            promotekit_referral: referralId || ""
        },
        // Alternatively, use client_reference_id if preferred/supported
        client_reference_id: referralId || undefined,

        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`,
    };

    console.log("PAYLOAD TO STRIPE:", JSON.stringify(sessionPayload, null, 2));

    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real app, redirect to session.url
    alert(`Stripe Checkout Created!\n\nReferral ID: ${referralId || "None"}\nPK Pass Strategy: metadata.promotekit_referral`);

    return {
        id: "cs_test_mock_123",
        url: "https://checkout.stripe.com/test/..."
    };
}
