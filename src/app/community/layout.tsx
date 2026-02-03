
"use client";

import { ChannelList } from "@/components/community/ChannelList";
import { getChannels, MOCK_USERS } from "@/lib/data";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { CommunityProvider, useCommunity } from "@/components/community/CommunityContext"; // Import useCommunity
import { User } from "@/types";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    // Determine current channel from URL path
    const pathname = usePathname();
    const currentChannelId = pathname.split("/community/")[1];

    // Simulate current user
    const [user, setUser] = useState<User>(MOCK_USERS[0]); // Default to Alice (Free)

    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const profile = await res.json();
                    setUser(profile);
                }
            } else {
                // Handle unauth or just keep mock/redirect? 
                // Middleware handles redirect.
            }
        };
        fetchUser();
    }, []);

    const channels = getChannels();

    return (
        <CommunityProvider user={user}>
            <CommunityLayoutInner
                channels={channels}
                user={user}
                currentChannelId={currentChannelId}
            >
                {children}
            </CommunityLayoutInner>
        </CommunityProvider>
    );
}

// Inner component that can use useCommunity()
function CommunityLayoutInner({
    children,
    channels,
    user,
    currentChannelId
}: {
    children: React.ReactNode,
    channels: any[],
    user: User,
    currentChannelId: string
}) {
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useCommunity();

    return (
        <div className="flex flex-col min-h-screen bg-[#313338]">
            {/* Mobile Header with Hamburger */}
            <div className="md:hidden bg-[#313338] p-4 flex items-center justify-between border-b border-[#1E1F22]">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-slate-200 hover:text-white"
                    >
                        <Menu size={28} />
                    </button>
                    <span className="ml-4 font-bold text-white text-lg">Community</span>
                </div>
                <div className="flex items-center">
                    <NotificationBell userId={user.id} />
                </div>
            </div>

            <div className="flex flex-1 relative">
                {/* Channel List Sidebar */}
                <div className={`
                        fixed inset-y-0 left-0 z-40 w-64 bg-[#2B2D31] transform transition-transform duration-200 ease-in-out
                        md:relative md:translate-x-0
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}>
                    <ChannelList
                        channels={channels}
                        user={user}
                        currentChannelId={currentChannelId}
                    // No need for onChannelSelect as ChannelList uses context directly
                    />
                </div>

                {/* Overlay for mobile */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                <main className="flex-1 flex flex-col min-w-0 bg-[#313338] md:ml-0 overflow-y-auto h-[calc(100vh-60px)] md:h-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
