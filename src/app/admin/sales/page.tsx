"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, TrendingUp, ShoppingBag, LayoutGrid } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function AdminSalesPage() {
    const [salesData, setSalesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const res = await fetch('/api/admin/sales');
                if (res.ok) {
                    const data = await res.json();
                    setSalesData(data);
                }
            } catch (e) {
                console.error("Failed to fetch sales data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, []);

    if (loading) return <div className="p-10 text-center flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!salesData) return <div className="p-10 text-center">データがありません</div>;

    // Transform Data for Charts
    const monthlyData = Object.entries(salesData.monthlyStats || {}).map(([key, val]: any) => ({
        month: key,
        profit: val.profit,
        revenue: val.revenue
    })).sort((a, b) => a.month.localeCompare(b.month));

    const platformData = Object.entries(salesData.platformStats || {}).map(([key, val]: any) => ({
        name: key === 'Unspecified' ? '未指定' : key,
        value: val.profit,
        count: val.count
    }));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">売上管理・分析</h1>
            <p className="text-slate-500 mb-8">受講生全体の販売実績と収益分析（プラットフォーム別・月別）</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">総売上高</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        ¥{monthlyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">総粗利益 (受講生計)</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                        ¥{monthlyData.reduce((sum, d) => sum + d.profit, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">総販売数</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        {salesData.sales.length.toLocaleString()} <span className="text-sm font-normal text-slate-400">点</span>
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">最多PF</p>
                    </div>
                    <p className="text-xl font-bold text-slate-800 truncate">
                        {platformData.length > 0 ? platformData.sort((a, b) => b.count - a.count)[0].name : '-'}
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Monthly Profit */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">月別 総利益推移</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <Tooltip
                                    formatter={(value: any) => `¥${Number(value).toLocaleString()}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="利益" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Share */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">プラットフォーム別 利益構成</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {platformData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `¥${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Sales Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">最新の販売履歴</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">販売日</th>
                                <th className="px-6 py-3">受講生</th>
                                <th className="px-6 py-3">商品</th>
                                <th className="px-6 py-3">PF</th>
                                <th className="px-6 py-3 text-right">売上</th>
                                <th className="px-6 py-3 text-right">利益</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {salesData.sales.map((sale: any) => (
                                <tr key={sale.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-500">{new Date(sale.sellDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 font-bold text-slate-700">{sale.user?.name || '-'}</td>
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-slate-800">{sale.brand}</div>
                                        {/* <div className="text-xs text-slate-400">{sale.id}</div> */}
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">{sale.salePlatform || '-'}</td>
                                    <td className="px-6 py-3 text-right font-mono">¥{sale.sellPrice?.toLocaleString() ?? 0}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600">¥{sale.profit?.toLocaleString() ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
