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
            {/* Standard Web Layout: min-h-screen, natural scroll */}
            <div className="flex flex-col min-h-screen bg-[#313338]">
                {/* Channel List is usually a sidebar, on mobile it's hidden/drawer. 
                    On Desktop, we might want it side-by-side. 
                    Let's keep flex-row for desktop, but column/hidden for mobile.
                */}
                <div className="flex flex-1">
                    <ChannelList
                        channels={channels}
                        user={user}
                        currentChannelId={currentChannelId}
                    />
                    <main className="flex-1 flex flex-col min-w-0 bg-[#313338]">
                        {children}
                    </main>
                </div>
            </div>
        </CommunityProvider>
    );
}
