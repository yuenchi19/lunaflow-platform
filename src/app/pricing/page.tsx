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
            description: "手軽に始めたい方向け",
            features: [
                "学習サイトボリューム：100本",
                "サポート：専用学習サイトのみ",
                "お任せ仕入れ購入金額：最低80,000円〜"
            ],
            color: "bg-teal-500",
            link: "https://buy.stripe.com/00wdR90j8fprfVo7pjc7u01"
        },
        {
            id: "standard",
            name: "スタンダードプラン",
            price: 12980,
            description: "本格的に学びたい方へ",
            features: [
                "学習サイト：150本 ＋ Zoomサポート",
                "対面実技指導・アフィリエイト参加権",
                "お任せ仕入れ購入金額：最低60,000円〜"
            ],
            color: "bg-blue-600",
            featured: true,
            link: "https://buy.stripe.com/9B6aEXc1Q6SVbF810Vc7u02"
        },
        {
            id: "premium",
            name: "プレミアムプラン",
            price: 19800,
            description: "最短で収益化を目指す",
            features: [
                "学習サイト：200本 ＋ 対面講習",
                "ハイスペック塗料伝授・還元祭無料招待",
                "お任せ仕入れ購入金額：最低30,000円〜"
            ],
            color: "bg-indigo-700",
            link: "https://buy.stripe.com/eVqfZhd5UcdfeRkdNHc7u03"
        }
    ];

    const SYSTEM_FEE = 5980;

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Header */}
            <header className="border-b border-slate-200 px-6 py-4 flex items-center gap-4 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <span className="font-bold text-slate-800">トップへ戻る</span>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800">
                        プランを選択して<br className="md:hidden" />決済へ進む
                    </h1>
                    <p className="text-slate-500">
                        あなたの目標に合わせて最適なプランをお選びください。
                    </p>
                </div>

                {/* Initial Cost Info Box */}
                <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-6 mb-16 flex items-start gap-4">
                    <Info className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div className="space-y-2">
                        <h3 className="font-bold text-amber-900">お支払いについて（初回のみ）</h3>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            初回決済時のみ、システム使用料 <strong>¥{SYSTEM_FEE.toLocaleString()}</strong> が別途発生します。<br />
                            （例：ライトプランの場合、初回 ¥{(5980 + SYSTEM_FEE).toLocaleString()}、2ヶ月目以降 ¥5,980）
                        </p>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                        relative bg-white rounded-2xl border transition-all duration-300
                        ${plan.featured
                                    ? "border-blue-500 shadow-xl scale-105 z-10"
                                    : "border-slate-200 shadow-sm hover:shadow-md"
                                }
                    `}
                        >
                            {plan.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                    人気No.1
                                </div>
                            )}

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-xl text-slate-800">{plan.name}</h3>
                                    <p className="text-slate-500 text-xs">{plan.description}</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-900">¥{plan.price.toLocaleString()}</span>
                                        <span className="text-xs text-slate-500">/ 月</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        + 初回システム料 ¥{SYSTEM_FEE.toLocaleString()}
                                    </div>
                                </div>

                                <ul className="space-y-3 pt-4 border-t border-slate-100">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href={plan.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]
                                ${plan.color}
                            `}
                                >
                                    このプランで申し込む
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
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
