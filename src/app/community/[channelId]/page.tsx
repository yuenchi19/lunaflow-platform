"use client";

import { ChatArea } from "@/components/community/ChatArea";
import { PlanGuard } from "@/components/community/PlanGuard";
import { RulesChannel } from "@/components/community/RulesChannel";
import { getChannels, MOCK_USERS, hasAgreedToRules } from "@/lib/data";
import { IntroductionChannelTwo } from "@/components/community/IntroductionChannelTwo";
import { CHANNEL_INTRO_CONTENT } from "@/lib/channelContent";
import { useState, useEffect } from "react";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { useCommunity } from "@/components/community/CommunityContext";

export default function ChannelPage({ params }: { params: { channelId: string } }) {
    const { user, agreeToRules, readIntro } = useCommunity(); // Use context user
    const [hasAgreed, setHasAgreed] = useState(false);
    const router = useRouter();

    // Synchronously resolve channel to avoid render flash
    const channels = getChannels();
    const channel = channels.find(c => c.id === params.channelId);

    // Remove legacy local storage user fetch
    // useEffect(() => { ... }, []);

    // Check agreement status
    useEffect(() => {
        if (user) {
            setHasAgreed(hasAgreedToRules(user.id));
        }
    }, [user, params.channelId]);

    if (!channel) return <div className="p-8 text-slate-400">Channel not found</div>;

    // Special handling for the Rules Channel
    if (channel.id === "c1") {
        return (
            <RulesChannel
                userId={user.id}
                onAgree={() => {
                    agreeToRules();
                    setHasAgreed(true);
                    router.refresh();
                }}
            />
        );
    }

    // Special handling for Intro Channel 2
    if (channel.id === "c2") {
        return (
            <IntroductionChannelTwo
                userId={user.id}
                onRead={() => {
                    readIntro();
                    router.refresh();
                }}
            />
        );
    }

    // Lock other channels if not agreed (though ChannelList should also prevent navigation)
    // ADMIN BYPASS
    const isAdminOrStaff = user.role === 'admin' || user.role === 'staff';

    // TEMPORARY RELAXATION: Always allow access to test UI
    // if (!hasAgreed && !isAdminOrStaff) { ... }
    /* 
    if (!hasAgreed && !isAdminOrStaff) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-[#313338]">
                ... locked screen ...
            </div>
        );
    }
    */

    return (
        <PlanGuard user={user} allowedPlans={channel.allowedPlans}>
            <ChatArea
                channelId={channel.id}
                currentUser={user}
                channelName={channel.name}
                introContent={CHANNEL_INTRO_CONTENT[channel.id]}
            />
        </PlanGuard>
    );
}

