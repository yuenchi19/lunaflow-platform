"use client";

import { ChannelList } from "@/components/community/ChannelList";
import { getChannels, MOCK_USERS } from "@/lib/data";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { CommunityProvider } from "@/components/community/CommunityContext";
import { User } from "@/types";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    // Determine current channel from URL path
    const pathname = usePathname();
    const currentChannelId = pathname.split("/community/")[1];

    // Simulate current user
    const [user, setUser] = useState<User>(MOCK_USERS[0]); // Default to Alice (Free)

    useEffect(() => {
        const storedUserId = localStorage.getItem("currentUserId");
        if (storedUserId) {
            const found = MOCK_USERS.find(u => u.id === storedUserId);
            if (found) setUser(found);
        }
    }, []);

    const channels = getChannels();

    return (
        <CommunityProvider user={user}>
            <div className="flex h-[100dvh] overflow-hidden bg-[#313338]">
                {/* Server List REMOVED as requested */}

                <ChannelList
                    channels={channels}
                    user={user}
                    currentChannelId={currentChannelId}
                />
                <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#313338] overflow-hidden">
                    {children}
                </main>
            </div>
        </CommunityProvider>
    );
}
