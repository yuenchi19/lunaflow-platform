"use client";

import { useState, useEffect } from "react";
// import { getAllAffiliateStats } from "@/lib/data";
import { User, AffiliateEarnings } from "@/types";

interface AffiliateUser extends User {
    earnings: AffiliateEarnings;
}

export default function AdminAffiliatesPage() {
    const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
    const [totalPayout, setTotalPayout] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAffiliates = async () => {
            try {
                const res = await fetch('/api/admin/affiliates');
                if (res.ok) {
                    const data = await res.json();
                    setAffiliates(data);

                    // Calculate total payout from data
                    const total = data.reduce((sum: number, u: AffiliateUser) => sum + u.earnings.monthlyEarnings, 0);
                    setTotalPayout(total);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAffiliates();
    }, []);

    const handleMarkAsPaid = async (userId: string) => {
        if (confirm("このユーザーの未払い分を支払い済みにしますか？（未実装の実処理 - UIのみ更新）")) {
            // NOTE: In real world, we should call an API to create a 'Payout' RewardTransaction
            setAffiliates(prev => prev.map(a => {
                if (a.id === userId) {
                    return {
                        ...a,
                        earnings: { ...a.earnings, monthlyEarnings: 0 } // Reset just the payout
                    };
                }
                return a;
            }));

            // Re-calc total local
            setTotalPayout(prev => {
                const user = affiliates.find(u => u.id === userId);
                return user ? prev - user.earnings.monthlyEarnings : prev;
            });
        }
    };

    if (loading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="p-8 bg-[#FDFCFB] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">アフィリエイト管理</h1>
                    <p className="text-sm text-slate-500 mt-1">パートナー（紹介者）の成果と支払い状況を管理します。</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-xl border border-rose-100 shadow-sm flex items-center gap-4">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">未払い総額</span>
                    <span className="text-2xl font-bold text-rose-600">¥{totalPayout.toLocaleString()}</span>
                </div>
            </div>

            {/* Bank Transfer Alerts */}
            {affiliates.filter(a => a.payoutPreference === 'bank_transfer' && a.earnings.monthlyEarnings >= 1000).length > 0 && (
                <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4 animate-pulse-slow">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-800 mb-1">銀行振込の支払い指示 (要対応)</h3>
                        <p className="text-xs text-red-600 mb-2">
                            以下のパートナーが銀行振込を希望しており、支払基準額(¥1,000)を超えています。
                            <br />
                            月末締め、翌月末払いルールに従い、振込手続きを行ってください。
                        </p>
                        <ul className="list-disc list-inside text-xs text-red-700 font-bold">
                            {affiliates
                                .filter(a => a.payoutPreference === 'bank_transfer' && a.earnings.monthlyEarnings >= 1000)
                                .map(a => (
                                    <li key={a.id}>
                                        {a.name}: ¥{a.earnings.monthlyEarnings.toLocaleString()}
                                        (手数料引後: ¥{(a.earnings.monthlyEarnings - 1000).toLocaleString()})
                                    </li>
                                ))}
                        </ul>
                    </div>
                    <button className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm whitespace-nowrap">
                        全件の振込データをDL
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">パートナー</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">紹介コード</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">直紹介</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">2次紹介</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">今月の報酬額</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">報酬受取</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {affiliates.length > 0 ? (
                            affiliates.map((affiliate) => (
                                <tr key={affiliate.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                                <img src={affiliate.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{affiliate.name}</div>
                                                <div className="text-xs text-slate-400">{affiliate.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-100 font-mono">
                                            {affiliate.affiliateCode}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-slate-600">{affiliate.earnings.directReferrals}名</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-slate-400">{affiliate.earnings.indirectReferrals}名</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-bold ${affiliate.earnings.monthlyEarnings > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                            ¥{affiliate.earnings.monthlyEarnings.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${affiliate.payoutPreference === 'bank_transfer' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {affiliate.payoutPreference === 'bank_transfer' ? '銀行振込' : '相殺(推奨)'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            disabled={affiliate.earnings.monthlyEarnings === 0}
                                            onClick={() => handleMarkAsPaid(affiliate.id)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${affiliate.earnings.monthlyEarnings > 0
                                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                }`}
                                        >
                                            {affiliate.earnings.monthlyEarnings > 0 ? '支払済にする' : '支払い不要'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                                    アフィリエイトパートナーはまだいません。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-xs text-indigo-800">
                    <p className="font-bold mb-1">アフィリエイト仕様メモ</p>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li>直紹介報酬: 7% / 2次紹介報酬: 3%</li>
                        <li>月ごとの締め日は毎月末日です。</li>
                        <li>支払いは翌月15日です。</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
