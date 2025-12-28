"use client";

import { STRIPE_PRICES } from '@/lib/data';
import { useState } from 'react';

export default function PlansPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (priceId: string) => {
        setLoading(priceId);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    includeInitialFee: true // Always add initial fee for new signups
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("支払いセッションの作成に失敗しました (環境変数が設定されていない可能性があります)");
            }
        } catch (error) {
            console.error(error);
            alert("エラーが発生しました");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#313338] text-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl">
                        料金プラン
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-400">
                        あなたの目標に合わせた最適なプランをお選びください。
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Light Plan */}
                    <div className="bg-[#2b2d31] rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300">
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-gray-200">Light Plan</h3>
                            <p className="mt-4 text-gray-400">気軽に参加したい方向け</p>
                            <div className="mt-8 flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight">¥2,980</span>
                                <span className="ml-1 text-xl font-medium text-gray-400">/月</span>
                            </div>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>コミュニティ参加 (閲覧のみ)</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>一部動画コンテンツの視聴</span>
                                </li>
                                <li className="flex items-center text-gray-500">
                                    <span className="mr-2">-</span>
                                    <span>個別サポートなし</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-[#232428]">
                            <button
                                onClick={() => handleSubscribe(STRIPE_PRICES.light)}
                                disabled={!!loading}
                                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading === STRIPE_PRICES.light ? '処理中...' : '申し込む'}
                            </button>
                        </div>
                    </div>

                    {/* Standard Plan */}
                    <div className="bg-[#2b2d31] rounded-2xl shadow-xl overflow-hidden border-2 border-blue-500 scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            人気 No.1
                        </div>
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-blue-400">Standard Plan</h3>
                            <p className="mt-4 text-gray-400">本格的に学びたい方向け</p>
                            <div className="mt-8 flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight">¥9,800</span>
                                <span className="ml-1 text-xl font-medium text-gray-400">/月</span>
                            </div>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>全ての動画コンテンツ視聴</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>コミュニティフル参加</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>月1回のグループ相談</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-[#232428]">
                            <button
                                onClick={() => handleSubscribe(STRIPE_PRICES.standard)}
                                disabled={!!loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50"
                            >
                                {loading === STRIPE_PRICES.standard ? '処理中...' : '今すぐ始める'}
                            </button>
                        </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-[#2b2d31] rounded-2xl shadow-xl overflow-hidden border border-amber-500 hover:border-amber-400 transition-all duration-300">
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-amber-400">Premium Plan</h3>
                            <p className="mt-4 text-gray-400">プロを目指す本気の方へ</p>
                            <div className="mt-8 flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight">¥29,800</span>
                                <span className="ml-1 text-xl font-medium text-gray-400">/月</span>
                            </div>
                            <ul className="mt-8 space-y-4">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Standardの全機能</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>無制限の個別チャットサポート</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>専属メンターによるコードレビュー</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-[#232428]">
                            <button
                                onClick={() => handleSubscribe(STRIPE_PRICES.premium)}
                                disabled={!!loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading === STRIPE_PRICES.premium ? '処理中...' : '申し込む'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
