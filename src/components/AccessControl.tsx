"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isUserSubscriptionActive, MOCK_USERS } from "@/lib/data";
import { User } from "@/types";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AccessControl({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            // Allow Public Routes
            if (pathname === '/' || pathname === '/login') {
                setIsBlocked(false);
                setIsLoading(false);
                return;
            }

            try {
                // 1. Check Auth Session
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    setIsBlocked(true); // Should be handled by middleware, but safe fallback
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch Profile from 'User' table
                const { data: profile, error } = await supabase
                    .from('User')
                    .select('plan, role, subscriptionStatus')
                    .eq('id', authUser.id)
                    .single();

                if (error || !profile) {
                    // Profile missing or error -> Block
                    console.error("Profile fetch error:", error);
                    setIsBlocked(true);
                    setIsLoading(false);
                    return;
                }

                // 3. Check Status
                // Admin always allowed
                if (profile.role === 'admin') {
                    setIsBlocked(false);
                    setIsLoading(false);
                    return;
                }

                // Plan Check (Premium/Standard allowed, or active subscription status)
                const isPaidPlan = profile.plan === 'premium' || profile.plan === 'standard';
                const isSubscriptionActive = profile.subscriptionStatus === 'active';

                if (isPaidPlan || isSubscriptionActive) {
                    setIsBlocked(false);
                } else {
                    setIsBlocked(true);
                }
            } catch (e) {
                console.error("Access Control Error:", e);
                setIsBlocked(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const handlePortal = async () => {
        try {
            const res = await fetch('/api/create-portal-session', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("請求情報の取得に失敗しました。サポートまでお問い合わせください。");
            }
        } catch (e) {
            alert("通信エラーが発生しました。");
        }
    };

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-[#FDFCFB] text-slate-400">Loading...</div>;
    }

    if (isBlocked) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white p-4">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">利用制限のお知らせ</h1>
                    <p className="text-slate-400 mb-8">
                        お客様のアカウント（メールアドレス）では有効なサブスクリプションが確認できませんでした。<br />
                        お支払いが完了している場合でも、システムの反映に時間がかかることがあります。
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handlePortal}
                            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                            お支払い情報を確認 (Stripe)
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4"
                        >
                            ログアウトして別のアカウントで試す
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
