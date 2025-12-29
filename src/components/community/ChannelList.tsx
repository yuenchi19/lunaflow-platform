"use client";

import Link from "next/link";
import { useState } from "react";
import { Channel, User } from "@/types";
import { Lock, Hash, X, ChevronDown, ChevronRight, Plus, Settings } from "lucide-react";
import { useCommunity } from "@/components/community/CommunityContext";

interface ChannelListProps {
    channels: Channel[];
    user: User;
    currentChannelId?: string;
}

export function ChannelList({ channels, user, currentChannelId }: ChannelListProps) {
    const { isRulesAgreed, isIntroRead, isMobileMenuOpen, setIsMobileMenuOpen } = useCommunity();

    // Group channels by category
    const groupedChannels = channels.reduce((acc, channel) => {
        const category = channel.category || "その他";
        if (!acc[category]) acc[category] = [];
        acc[category].push(channel);
        return acc;
    }, {} as Record<string, Channel[]>);

    // Default open all categories
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
        Object.keys(groupedChannels).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    const toggleCategory = (cat: string) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const checkAccess = (channel: Channel) => {
        // ALWAYS ALLOW ACCESS TO RULES CHANNEL "c1" or "はじめに①"
        if (channel.id === 'c1' || channel.name.includes("はじめに①")) return true;

        // Admins and Staff always have access
        if (user.role === 'admin' || user.role === 'staff') return true;

        // Strict Logic:
        // 1. "はじめに①" (c1) is accessible to EVERYONE (checked above)

        // 2. If rules not agreed, block everything else
        if (!isRulesAgreed) {
            return false;
        }

        // 3. "はじめに②" (c2) is accessible if rules are agreed
        if (channel.id === 'c2' || channel.name.includes("はじめに②")) return true;

        // 4. For ALL other channels, require Intro (c2) to be read
        if (!isIntroRead) {
            return false;
        }


        return channel.allowedPlans.includes(user.plan);
    };

    return (
        <>
            <div className={`
                fixed inset-y-0 left-0 z-40 w-60 bg-[#2B2D31] text-[#949BA4] flex flex-col h-full transition-transform
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                {/* Header: Server Name */}
                <div className="h-12 border-b border-[#1F2023] hover:bg-[#35373C] transition-colors cursor-pointer flex items-center px-4 shadow-sm flex-shrink-0">
                    <h2 className="font-bold text-[15px] flex items-center justify-between w-full text-[#F2F3F5]">
                        LunaFlow Community
                        <ChevronDown className="w-4 h-4" />
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin scrollbar-thumb-[#1A1B1E] scrollbar-track-transparent">
                    {/* Removed Static 'Event' / 'Member' items as requested */}

                    {Object.entries(groupedChannels).map(([category, channelList]) => (
                        <div key={category} className="mb-5">
                            <div className="flex items-center justify-between pr-2 group/cat mb-1 hover:text-[#DBDEE1] cursor-pointer" onClick={() => toggleCategory(category)}>
                                <button
                                    className="flex items-center gap-0.5 text-[12px] font-bold uppercase transition-colors px-0.5"
                                >
                                    <ChevronDown className={`w-3 h-3 transition-transform ${openCategories[category] ? "" : "-rotate-90"}`} />
                                    {category}
                                </button>
                                {user.role === 'admin' && (
                                    <button className="text-current opacity-0 group-hover/cat:opacity-100 transition-opacity" title="カテゴリー編集">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {openCategories[category] && (
                                <div className="space-y-0.5">
                                    {channelList.map(channel => {
                                        const allowed = checkAccess(channel);
                                        const isActive = currentChannelId === channel.id;

                                        // Special check for lock icon
                                        // If !isRulesAgreed and channel is NOT c1, show lock
                                        const showLock = !allowed;

                                        const content = (
                                            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded mx-0 transition-colors group relative ${isActive
                                                ? "bg-[#404249] text-white"
                                                : allowed
                                                    ? "hover:bg-[#35373C] text-[#949BA4] hover:text-[#DBDEE1] cursor-pointer"
                                                    : "opacity-50 cursor-not-allowed text-[#949BA4]"
                                                // Used opacity-50 for locked channels
                                                }`}>
                                                <Hash className="w-5 h-5 opacity-60 flex-shrink-0" />
                                                <span className={`truncate flex-1 text-sm ${isActive ? "font-medium" : "font-medium"}`}>{channel.name}</span>
                                                {allowed && user.role === 'admin' && (
                                                    <Settings className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 absolute right-2 text-[#B5BAC1]" />
                                                )}
                                                {showLock && <Lock className="w-3.5 h-3.5" />}
                                                {/* Notification Badge Example */}
                                                {!isActive && allowed && Math.random() > 0.8 && (
                                                    <span className="w-2 h-2 rounded-full bg-white ml-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        );

                                        if (!allowed) {
                                            // Make locked channels unclickable div instead of Link (or Link that goes nowhere)
                                            let tooltip = "アクセス権限がありません";
                                            if (!isRulesAgreed) tooltip = "まずは「はじめに①」で確認を完了してください";
                                            else if (!isIntroRead && channel.id !== 'c2') tooltip = "次は「はじめに②」を確認してください";

                                            return <div key={channel.id} title={tooltip}>{content}</div>;
                                        }

                                        return (
                                            <Link key={channel.id} href={`/community/${channel.id}`} onClick={() => setIsMobileMenuOpen(false)}>
                                                {content}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* User Status Bar (Bottom) REMOVED as requested */}
            </div>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
