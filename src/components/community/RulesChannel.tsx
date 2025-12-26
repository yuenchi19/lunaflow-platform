
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { hasAgreedToRules, setAgreedToRules } from "@/lib/data";

interface RulesChannelProps {
    userId: string;
    onAgree: () => void;
}

export function RulesChannel({ userId, onAgree }: RulesChannelProps) {
    const [hasAgreed, setHasAgreed] = useState(false);

    useEffect(() => {
        setHasAgreed(hasAgreedToRules(userId));
    }, [userId]);

    const handleAgree = () => {
        setAgreedToRules(userId);
        setHasAgreed(true);
        onAgree();
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#313338] text-gray-100">
            <div className="max-w-2xl w-full bg-[#2b2d31] rounded-lg shadow-xl overflow-hidden border border-[#1e1f22]">
                <div className="p-6 border-b border-[#1e1f22] bg-[#2b2d31]">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-100 mb-4">
                        <ShieldCheck className="w-8 h-8 text-blue-400" />
                        コミュニティルール
                    </h2>
                    <p className="text-lg font-medium text-white">
                        まずはこのコミュニティの参加ルールと操作方法 を確認してください。
                    </p>
                </div>

                <div className="p-8 text-gray-300 space-y-6">
                    <div className="bg-[#1e1f22] p-6 rounded-lg border border-[#3f4147]">
                        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                            📘 ルール
                        </h3>
                        <div className="space-y-4 text-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">1️⃣</span>
                                <span className="pt-1">仲間へのリスペクトを忘れないこと</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">2️⃣</span>
                                <span className="pt-1">スパム・勧誘・外部リンクは禁止</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">3️⃣</span>
                                <span className="pt-1">売れた人を祝おう！</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center bg-[#35373c] p-4 rounded-lg">
                        <p className="text-yellow-400 font-medium mb-1">
                            確認してお約束できる人は、
                        </p>
                        <p className="text-white font-bold text-lg mb-2">
                            【約束します】を押してください。
                        </p>
                        <p className="text-gray-400 text-sm">
                            次の【はじめに②】が解放されます
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1e1f22] bg-[#2b2d31] flex justify-center">
                    <button
                        onClick={handleAgree}
                        disabled={hasAgreed}
                        className={`
                            ${hasAgreed
                                ? "bg-green-600 hover:bg-green-700 text-white cursor-default opacity-50"
                                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg transform hover:scale-105 transition-all"}
                            px-12 py-4 text-xl font-bold rounded-lg
                        `}
                    >
                        {hasAgreed ? "同意済み" : "約束します"}
                    </button>
                </div>
            </div>
        </div>
    );
}
