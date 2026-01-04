"use client";

import { Check, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../page.module.css"; // Reuse if needed, or just utility classes

export default function PricingPage() {
    const plans = [
        {
            id: "light",
            name: "ライトプラン",
            price: 5980,
            description: "物販経験者の方向けのサポートサービス",
            features: [
                "学習サイトボリューム：100本",
                "サポート：専用学習サイトのみ"
            ],
            color: "bg-teal-500",
            link: "https://buy.stripe.com/00wdR90j8fprfVo7pjc7u01"
        },
        {
            id: "standard",
            name: "スタンダードプラン",
            price: 12980,
            description: "物販を1年ほど経験した方向けのサポートプラン",
            features: [
                "学習サイト：150本 ＋ Zoomサポート",
                "対面実技指導・アフィリエイト参加権"
            ],
            color: "bg-blue-600",
            featured: true,
            link: "https://buy.stripe.com/9B6aEXc1Q6SVbF810Vc7u02"
        },
        {
            id: "premium",
            name: "プレミアムプラン",
            price: 19800,
            description: "物販ビジネス初心者向けの充実のサポート",
            features: [
                "学習サイト：200本 ＋ 対面講習",
                "ハイスペック塗料伝授・還元祭無料招待"
            ],
            color: "bg-indigo-700",
            initialFee: 5980,
            link: "https://buy.stripe.com/eVqfZhd5UcdfeRkdNHc7u03"
        },
        {
            id: "partner",
            name: "パートナープラン",
            price: 1980,
            description: "アフィリエイト活動を中心に行いたい方向けのプラン",
            features: [
                "学習サイト：アフィリエイト・マインドセットのみ", // Only affiliate/mindset
                "参加権利：アフィリエイト活動"
            ],
            color: "bg-purple-600",
            initialFee: 5000,
            link: "https://buy.stripe.com/7sY4gzfe2b9bcJceRLc7u04"
        }
    ];

    const DEFAULT_SYSTEM_FEE = 5980;

    // Placeholder for handleSelectPlan to avoid errors, as it's not defined in the original context
    const handleSelectPlan = (planId) => {
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan && selectedPlan.link) {
            window.open(selectedPlan.link, '_blank');
        } else {
            console.warn(`No link found for plan: ${planId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Header */}
            <header className="border-b border-slate-200 px-6 py-4 flex items-center gap-4 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <span className="font-bold text-slate-800">トップへ戻る</span>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800">
                        プランを選択して<br className="md:hidden" />決済へ進む
                    </h1>
                    <p className="text-slate-500">
                        あなたの目標に合わせて最適なプランをお選びください。
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12 max-w-3xl mx-auto flex items-start gap-4 shadow-sm">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0 mt-1">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-900 mb-2">お支払いについて（初回のみ）</h3>
                        <p className="text-amber-800 leading-relaxed font-medium">
                            初回決済時のみ、システム使用料 <span className="font-bold text-amber-900">¥5,980</span> が別途発生します。
                            <br />
                            <span className="text-sm opacity-80">（例：ライトプランの場合、初回 ¥11,960、2ヶ月目以降 ¥5,980）</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                    {/* Light Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all hover:shadow-md flex flex-col relative overflow-hidden group">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">ライトプラン</h3>
                            <p className="text-xs text-slate-500 h-8">物販経験者の方向けのサポートサービス</p>
                        </div>
                        <div className="mb-8">
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-4xl font-black text-slate-900 tracking-tight">¥5,980</span>
                                <span className="text-sm font-bold text-slate-500 mb-1.5">/ 月</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">+ 初回システム料 ¥5,980</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['学習サイトボリューム：100本', 'サポート：専用学習サイトのみ'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('light')}
                            className="w-full py-4 rounded-xl font-bold text-white bg-[#1abe9e] hover:bg-[#16a58a] transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] whitespace-nowrap"
                        >
                            このプランで申し込む
                        </button>
                    </div>

                    {/* Standard Plan */}
                    <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl shadow-indigo-100 flex flex-col relative overflow-hidden transform md:-translate-y-4">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-200">
                            人気No.1
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">スタンダードプラン</h3>
                            <p className="text-xs text-slate-500 h-8">物販を1年ほど経験した方向けのサポートプラン</p>
                        </div>
                        <div className="mb-8">
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-4xl font-black text-slate-900 tracking-tight">¥12,980</span>
                                <span className="text-sm font-bold text-slate-500 mb-1.5">/ 月</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">+ 初回システム料 ¥5,980</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['学習サイト：150本 ＋ Zoomサポート', '対面実技指導・アフィリエイト参加権'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('standard')}
                            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] whitespace-nowrap"
                        >
                            このプランで申し込む &rarr;
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all hover:shadow-md flex flex-col relative overflow-hidden group">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">プレミアムプラン</h3>
                            <p className="text-xs text-slate-500 h-8">物販ビジネス初心者向けの充実のサポート</p>
                        </div>
                        <div className="mb-8">
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-4xl font-black text-slate-900 tracking-tight">¥19,800</span>
                                <span className="text-sm font-bold text-slate-500 mb-1.5">/ 月</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">+ 初回システム料 ¥5,980</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['学習サイト：200本 ＋ 対面講習', 'ハイスペック塗料伝授・還元祭無料招待'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('premium')}
                            className="w-full py-4 rounded-xl font-bold text-white bg-[#5548c7] hover:bg-[#463aa6] transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] whitespace-nowrap"
                        >
                            このプランで申し込む &rarr;
                        </button>
                    </div>

                    {/* Partner Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all hover:shadow-md flex flex-col relative overflow-hidden group">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">パートナープラン</h3>
                            <p className="text-xs text-slate-500 h-8">アフィリエイト活動を中心に行いたい方向けのプラン</p>
                        </div>
                        <div className="mb-8">
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-4xl font-black text-slate-900 tracking-tight">¥1,980</span>
                                <span className="text-sm font-bold text-slate-500 mb-1.5">/ 月</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">+ 初回システム料 ¥5,980</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['学習サイト：アフィリエイト・マインドセットのみ', '参加権利：アフィリエイト活動'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('partner')}
                            className="w-full py-4 rounded-xl font-bold text-white bg-[#9333ea] hover:bg-[#7e22ce] transition-all shadow-lg shadow-purple-100 active:scale-[0.98] whitespace-nowrap"
                        >
                            このプランで申し込む &rarr;
                        </button>
                    </div>
                </div>

                <div className="mt-16 text-center text-xs text-slate-400 leading-relaxed">
                    <p>※ 表示価格はすべて税込です。</p>
                    <p>※ クレジットカード決済に対応しています。</p>
                    <p>※ 解約は設定ページよりいつでも可能です。</p>
                </div>

            </main>
        </div>
    );
}
```
