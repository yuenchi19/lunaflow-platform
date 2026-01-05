"use server";

import { createClient } from "@/lib/supabase/server";
import { User, ProgressDetail, Payment } from "@/types";
import { MOCK_USERS } from "./data"; // Fallback for now

import { prisma } from "@/lib/prisma";

export async function getUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Use Prisma for direct DB access (Bypassing Supabase RLS/Cache)
    const profile = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (profile) {
        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            plan: profile.plan,
            address: profile.address || "",
            zipCode: profile.zipCode || "",
            communityNickname: profile.communityNickname || "",
            // avatarUrl: profile.avatarUrl || "", // Not in Prisma Schema
            affiliateCode: profile.affiliateCode || "",
            payoutPreference: profile.payoutPreference,
            registrationDate: profile.createdAt.toISOString(),
            subscriptionStatus: profile.subscriptionStatus || 'active',
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
