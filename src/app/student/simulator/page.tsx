"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, Info, ArrowRight } from 'lucide-react';

type PlatformString = 'mercari' | 'rakuma' | 'yahoo';

interface PlatformResult {
    id: PlatformString;
    name: string;
    feeRate: number;
    fee: number;
    profit: number;
    margin: number;
    color: string;
}

export default function ProfitSimulatorPage() {
    const [cost, setCost] = useState<number | ''>('');
    const [sellPrice, setSellPrice] = useState<number | ''>('');
    const [shipping, setShipping] = useState<number>(750); // Default to generic box size (e.g. 60 size)
    const [isYahooPremium, setIsYahooPremium] = useState(false);

    const results: PlatformResult[] = useMemo(() => {
        const c = Number(cost) || 0;
        const s = Number(sellPrice) || 0;
        const sh = Number(shipping) || 0;

        if (s === 0) return [];

        const platforms: { id: PlatformString; name: string; feeRate: number; color: string }[] = [
            { id: 'mercari', name: 'メルカリ', feeRate: 0.10, color: 'text-red-500 bg-red-50 border-red-100' },
            { id: 'rakuma', name: 'ラクマ', feeRate: 0.066, color: 'text-blue-500 bg-blue-50 border-blue-100' },
            { id: 'yahoo', name: 'ヤフオク!', feeRate: isYahooPremium ? 0.088 : 0.10, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
        ];

        const calculated = platforms.map(p => {
            const fee = Math.floor(s * p.feeRate);
            const profit = s - c - sh - fee;
            const margin = s > 0 ? (profit / s) * 100 : 0;
            return {
                ...p,
                fee,
                profit,
                margin
            };
        });

        // Sort by Profit Descending
        return calculated.sort((a, b) => b.profit - a.profit);
    }, [cost, sellPrice, shipping, isYahooPremium]);

    const bestPlatform = results.length > 0 ? results[0] : null;

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] pb-32 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[var(--color-surface)] rounded-2xl flex items-center justify-center text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-serif text-[var(--color-text-main)]">利益シミュレーター</h1>
                        <p className="text-xs text-[var(--color-text-secondary)]">仕入れ・販売価格から各プラットフォームの利益を自動計算</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Inputs */}
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)] space-y-4">
                        <h2 className="font-bold text-[var(--color-text-main)] flex items-center gap-2 border-b border-[var(--color-border)] pb-2 mb-4 font-serif">
                            <span className="w-2 h-6 bg-[var(--color-primary)] rounded-full text-[var(--color-surface)]"></span>
                            条件入力
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">仕入れ価格 (円)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all font-mono text-lg font-bold"
                                placeholder="例: 1000"
                                value={cost}
                                onChange={(e) => setCost(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">予想販売価格 (円)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all font-mono text-lg font-bold"
                                placeholder="例: 5000"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">予想送料 (円)</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all font-medium"
                                value={shipping}
                                onChange={(e) => setShipping(Number(e.target.value))}
                            >
                                <option value="175">ネコポス/ゆうパケット (¥175~)</option>
                                <option value="450">宅急便コンパクト (¥450+箱)</option>
                                <option value="750">宅急便 60サイズ (¥750)</option>
                                <option value="850">宅急便 80サイズ (¥850)</option>
                                <option value="1050">宅急便 100サイズ (¥1050)</option>
                                <option value="1200">宅急便 120サイズ (¥1200)</option>
                                <option value="0">送料なし (着払い/手渡し)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-[var(--color-border)]">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isYahooPremium ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--color-background)] border-[var(--color-border)]'}`}>
                                    {isYahooPremium && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={isYahooPremium} onChange={e => setIsYahooPremium(e.target.checked)} />
                                <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-main)] transition-colors">
                                    Yahoo!プレミアム会員 (手数料 8.8%)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Best Result */}
                    <div className="space-y-6">
                        <div className={`rounded-2xl p-6 shadow-sm border transition-all relative overflow-hidden ${bestPlatform && bestPlatform.profit > 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                            {bestPlatform && bestPlatform.profit > 0 ? (
                                <>
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <TrendingUp className="w-32 h-32 text-emerald-900" />
                                    </div>
                                    <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                        <span className="bg-emerald-100 p-1 rounded">🏆</span>
                                        最高利益プラットフォーム
                                    </h3>
                                    <div className="text-3xl font-bold text-emerald-600 mb-1 font-serif">
                                        {bestPlatform.name}
                                    </div>
                                    <div className="text-4xl font-bold text-emerald-700 font-mono mb-4">
                                        +¥{bestPlatform.profit.toLocaleString()}
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-3 flex justify-between items-center text-sm font-medium text-emerald-800">
                                        <span>利益率</span>
                                        <span className="font-bold text-lg">{bestPlatform.margin.toFixed(1)}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                    <Info className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
                                    <p className="text-sm font-bold text-[var(--color-text-secondary)]">数値を入力すると<br />ランキングが表示されます</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ranking Table */}
                {results.length > 0 && (
                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                        <div className="p-4 bg-[var(--color-background)]/50 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h3 className="font-bold text-[var(--color-text-main)] font-serif">利益ランキング</h3>
                            <span className="text-xs font-bold bg-[var(--color-background)] text-[var(--color-text-muted)] px-2 py-1 rounded">手数料・送料控除後</span>
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                            {results.map((r, idx) => (
                                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' : 'bg-[var(--color-background)] text-[var(--color-text-muted)]'}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[var(--color-text-main)]">{r.name}</div>
                                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                手数料: ¥{r.fee.toLocaleString()} ({r.feeRate * 100}%)
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-bold font-mono ${r.profit > 0 ? 'text-[var(--color-primary)]' : 'text-red-500'}`}>
                                            ¥{r.profit.toLocaleString()}
                                        </div>
                                        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                                            利益率: {r.margin.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors group">
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
