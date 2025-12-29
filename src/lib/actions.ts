"use server";

import { createClient } from "@/lib/supabase/server";
import { User, ProgressDetail, Payment } from "@/types";
import { MOCK_USERS } from "./data"; // Fallback for now

export async function getUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch Profile from DB
    const { data: profile } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();

    // Map DB profile to User type
    if (profile) {
        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            plan: profile.plan,
            // phoneNumber: profile.phone_number, // Not in schema currently? or use metadata? Sticking to schema.
            address: profile.address,
            zipCode: profile.zipCode, // camelCase in schema
            communityNickname: profile.communityNickname, // camelCase
            avatarUrl: profile.avatarUrl, // Assuming consistency if it existed, skipping if not in schema.
            // stripeCustomerId: profile.stripeCustomerId, // Not in schema shown
            affiliateCode: profile.affiliateCode,
            payoutPreference: profile.payoutPreference,
            // Defaults/Calculated
            registrationDate: profile.createdAt,
            subscriptionStatus: 'active',
        } as User;
    }

    return null;
}

export async function getUserProgress(userId: string) {
    const supabase = createClient();

    // Fetch detailed progress
    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

    return progress || [];
}

export async function updateProgress(courseId: string, categoryId: string, blockId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            course_id: courseId,
            category_id: categoryId,
            block_id: blockId,
            status: 'completed',
            completed_at: new Date().toISOString()
        });

    if (error) throw error;
    return { success: true };
}
