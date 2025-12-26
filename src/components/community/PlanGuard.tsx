"use client";

import { Plan, User } from "@/types";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PlanGuardProps {
    user: User;
    allowedPlans: Plan[];
    children: React.ReactNode;
}

export function PlanGuard({ user, allowedPlans, children }: PlanGuardProps) {
    const router = useRouter();

    // Admin always has access
    if (user.role === 'admin') {
        return <div className="h-full flex flex-col">{children}</div>;
    }

    const isAllowed = allowedPlans.includes(user.plan);

    if (isAllowed) {
        return <div className="h-full flex flex-col">{children}</div>;
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col items-center max-w-md text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="mb-6">
                    This channel is available for <span className="font-semibold text-white">{allowedPlans.join(" / ")}</span> plan members only.
                </p>
                <Link
                    href="/plans"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors"
                >
                    Upgrade Plan
                </Link>
            </div>
        </div>
    );
}
