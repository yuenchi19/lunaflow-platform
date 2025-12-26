
import { Flag, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CHANNEL_INTRO_CONTENT } from "@/lib/channelContent";
import { hasReadIntro2, setReadIntro2 } from "@/lib/data";
import ReactMarkdown from 'react-markdown';

interface IntroChannelTwoProps {
    userId: string;
    onRead: () => void;
}

export function IntroductionChannelTwo({ userId, onRead }: IntroChannelTwoProps) {
    const [hasRead, setHasRead] = useState(false);

    useEffect(() => {
        setHasRead(hasReadIntro2(userId));
    }, [userId]);

    const handleRead = () => {
        setReadIntro2(userId);
        setHasRead(true);
        onRead();
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#313338] text-gray-100 overflow-y-auto">
            <div className="max-w-3xl w-full bg-[#2b2d31] rounded-lg shadow-xl overflow-hidden border border-[#1e1f22]">
                <div className="p-6 border-b border-[#1e1f22] bg-[#2b2d31]">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-100 mb-2">
                        <Flag className="w-8 h-8 text-yellow-400" />
                        はじめに②：学習の進め方
                    </h2>
                </div>

                <div className="p-8 text-gray-300 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent">
                    <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>
                            {CHANNEL_INTRO_CONTENT["c2"]}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1e1f22] bg-[#2b2d31] flex justify-center">
                    <button
                        onClick={handleRead}
                        disabled={hasRead}
                        className={`
                            ${hasRead
                                ? "bg-green-600 hover:bg-green-700 text-white cursor-default opacity-50"
                                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg transform hover:scale-105 transition-all"}
                            px-12 py-4 text-xl font-bold rounded-lg flex items-center gap-2
                        `}
                    >
                        {hasRead ? (
                            <>
                                <CheckCircle2 className="w-6 h-6" />
                                理解しました
                            </>
                        ) : "理解しました"}
                    </button>
                </div>
            </div>
        </div>
    );
}
