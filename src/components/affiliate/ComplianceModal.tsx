"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { setComplianceAgreement } from "@/lib/data";

interface ComplianceModalProps {
    isOpen: boolean;
    onAgree: () => void;
    userId: string;
}

export default function ComplianceModal({ isOpen, onAgree, userId }: ComplianceModalProps) {
    const [checked, setChecked] = useState(false);

    if (!isOpen) return null;

    const handleAgree = () => {
        if (!checked) return;
        setComplianceAgreement(userId);
        onAgree();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="bg-rose-50 p-6 border-b border-rose-100 flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-full text-rose-600 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-rose-900 mb-1">コンプライアンス順守のお願い</h2>
                        <p className="text-sm text-rose-800">
                            パートナー（アフィリエイト）活動を行うにあたり、以下の事項に同意いただく必要があります。
                        </p>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-slate-600 text-sm leading-relaxed">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-2">1. 禁止事項</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>虚偽の情報を伝えて勧誘すること</li>
                            <li>「絶対に稼げる」等の断定的な表現を使用すること</li>
                            <li>スパム行為や迷惑メールの送信</li>
                            <li>本サービスの著作権を侵害する行為</li>
                            <li>公序良俗に反する媒体での掲載</li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-2">2. 遵守事項</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>特定商取引法および関連法規の遵守</li>
                            <li>誠実かつ公正な活動の実施</li>
                            <li>運営事務局からの連絡への速やかな対応</li>
                        </ul>
                    </div>
                    <p className="text-xs text-slate-400">
                        ※違反が発覚した場合、アカウントの停止および報酬の没収等の措置をとる場合があります。
                    </p>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors mb-4">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-slate-50'}`}>
                            {checked && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                        />
                        <span className={`text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-500'}`}>
                            上記の内容を確認し、同意します
                        </span>
                    </label>

                    <button
                        onClick={handleAgree}
                        disabled={!checked}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${checked
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        同意してダッシュボードへ進む
                    </button>
                </div>
            </div>
        </div>
    );
}
