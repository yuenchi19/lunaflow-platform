"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calculateStudentStatus } from "@/lib/utils"; // Might need for target calculation if sophisticated, else simple

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/student/analytics');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">読み込み中...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">データの取得に失敗しました</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-20">
            <header className="bg-white border-b border-[var(--color-border)] p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/student/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-slate-800">収支分析・レポート</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">今月の利益</p>
                        <p className="text-2xl font-bold text-emerald-600">¥{data.summary.currentMonthProfit.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">累計利益</p>
                        <p className="text-2xl font-bold text-slate-800">¥{data.summary.totalProfit.toLocaleString()}</p>
                    </div>
                </div>

                {/* Monthly Profit Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-bold text-slate-800">月別利益推移 (直近6ヶ月)</h2>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthlyProfit}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip
                                    formatter={(value: any) => [`¥${(value || 0).toLocaleString()}`, '利益']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <PieIcon className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-bold text-slate-800">プラットフォーム別 利益内訳</h2>
                    </div>
                    <div className="h-64 w-full flex flex-col md:flex-row items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.platformDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.platformDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`¥${(value || 0).toLocaleString()}`, '利益']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        {data.platformDistribution.length === 0 && (
                            <div className="absolute text-sm text-slate-400">データがありません</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
