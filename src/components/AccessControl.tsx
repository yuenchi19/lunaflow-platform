"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isUserSubscriptionActive, MOCK_USERS } from "@/lib/data";
import { User } from "@/types";
import { Lock } from "lucide-react";

export function AccessControl({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        // Mock User Logic
        // In a real app, we get this from a hook like useAuth()
        // Here we simulate checking the current user from localStorage or defaulting
        const storedUserId = localStorage.getItem("currentUserId");
        const currentUser = MOCK_USERS.find(u => u.id === storedUserId) || MOCK_USERS[0]; // Default User

        // Check subscription
        const isActive = isUserSubscriptionActive(currentUser);

        // Define paths that should be protected
        // Basically everything except login/lp, but let's assume everything under / is protected for this demo
        // except maybe admin routes if the user is admin (logic handled in isUserSubscriptionActive for admins)

        // If inactive, block
        if (!isActive) {
            setIsBlocked(true);
        } else {
            setIsBlocked(false);
        }
    }, [pathname]);

    if (isBlocked) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white p-4">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">利用制限のお知らせ</h1>
                    <p className="text-slate-400 mb-8">
                        お客様のサブスクリプションのお支払いが確認できませんでした。
                        コンテンツの利用を再開するには、お支払い情報の更新をお願いいたします。
                    </p>
                    <button
                        onClick={() => window.location.reload()} // In real app, redirect to Stripe portal
                        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold"
                    >
                        お支払い情報を確認
                    </button>
                    <p className="mt-8 text-xs text-slate-600">
                        管理者の設定によりアクセスが制限されています。
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
