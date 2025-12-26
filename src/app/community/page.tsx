"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect immediately to the Rules channel (#はじめに①)
        router.replace("/community/c1");
    }, [router]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#313338]">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading community...</p>
            </div>
        </div>
    );
}
