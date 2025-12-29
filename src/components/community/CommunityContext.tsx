"use client";


import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { hasAgreedToRules, setAgreedToRules, hasReadIntro2, setReadIntro2 } from "@/lib/data";

interface CommunityContextType {
    isRulesAgreed: boolean;
    isIntroRead: boolean;
    agreeToRules: () => void;
    readIntro: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children, user }: { children: React.ReactNode, user: User }) {
    const [isRulesAgreed, setIsRulesAgreed] = useState(false);
    const [isIntroRead, setIsIntroRead] = useState(false);

    useEffect(() => {
        if (user) {
            setIsRulesAgreed(hasAgreedToRules(user.id));
            setIsIntroRead(hasReadIntro2(user.id));
        }
    }, [user]);

    const agreeToRules = () => {
        if (user) {
            setAgreedToRules(user.id);
            setIsRulesAgreed(true);
        }
    };

    const readIntro = () => {
        if (user) {
            setReadIntro2(user.id);
            setIsIntroRead(true);
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <CommunityContext.Provider value={{ isRulesAgreed, isIntroRead, agreeToRules, readIntro, isMobileMenuOpen, setIsMobileMenuOpen }}>
            {children}
        </CommunityContext.Provider>
    );
}

export function useCommunity() {
    const context = useContext(CommunityContext);
    if (!context) {
        throw new Error("useCommunity must be used within a CommunityProvider");
    }
    return context;
}
