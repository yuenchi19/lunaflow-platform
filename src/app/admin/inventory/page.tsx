"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package, Search, Filter } from "lucide-react";

interface InventoryItem {
    id: string;
    brand: string;
    name?: string;
    category?: string;
    costPrice: number;
    images: string[];
    status: 'IN_STOCK' | 'ASSIGNED' | 'SOLD' | 'SHIPPED' | 'RECEIVED' | 'RETURNED';
    assignedToUser?: { id: string; name: string; email?: string };
    assignedToUserId?: string;
    createdAt: string;
    isSelfSourced?: boolean;
    supplier?: string;
}

interface LedgerEntry {
    id: string;
    user: { name: string, email: string };
    brand: string;
    purchasePrice: number;
    sellPrice?: number;
    profit?: number;
    salePlatform?: string;
    sellDate?: string;
    updatedAt: string;
    status: string;
    saleNote?: string;
}

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stock' | 'sold'>('stock');

    // Sort & Search
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/admin/inventory');
            const data = await res.json();
            setItems(data.items || []);
            setLedger(data.ledger || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtering
    const displayedItems = items.filter(item => {
        if (activeTab === 'sold') return false;
        const match = (item.brand + item.name + (item.assignedToUser?.name || ''))
            .toLowerCase().includes(searchQuery.toLowerCase());
        // Show all non-sold in stock tab (or just follow status)
        // Actually ledger has the Sold ones, so Stock tab should exclude Sold?
        // But backend sends all items.
        // Let's hide 'SOLD' from Stock Tab if likely in Ledger Tab.
        // But some 'SOLD' items might not be in Ledger if legacy.
        // For clarity: Stock Tab = Not Sold. Sold Tab = Ledger.
        return match && item.status !== 'SOLD';
    });

    const displayedLedger = ledger.filter(entry => {
        if (activeTab === 'stock') return false;
        const match = (entry.brand + (entry.user.name || ''))
            .toLowerCase().includes(searchQuery.toLowerCase());
        return match;
    });

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">商品管理台帳 (Admin)</h1>
                    <p className="text-slate-500 text-sm">在庫商品および販売実績の管理</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`pb-2 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'stock' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    在庫一覧 ({items.filter(i => i.status !== 'SOLD').length})
                </button>
                <button
                    onClick={() => setActiveTab('sold')}
                    className={`pb-2 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'sold' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    完売済み ({ledger.length})
                </button>
            </div>

            <div className="flex justify-between mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">日付</th>
                            <th className="px-6 py-4">担当ユーザー</th>
                            <th className="px-6 py-4">ブランド/商品</th>
                            <th className="px-6 py-4 text-right">仕入れ (¥)</th>
                            {activeTab === 'sold' ? (
                                <>
                                    <th className="px-6 py-4 text-right">販売価格 (¥)</th>
                                    <th className="px-6 py-4 text-right">粗利益 (¥)</th>
                                    <th className="px-6 py-4">PF / 備考</th>
                                </>
                            ) : (
                                <th className="px-6 py-4 text-center">ステータス</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {activeTab === 'stock' ? (
                            displayedItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.assignedToUser ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {(item.assignedToUser.name || 'U').substring(0, 1)}
                                                </div>
                                                <span className="font-bold text-slate-600">{item.assignedToUser.name || 'No Name'}</span>
                                            </div>
                                        ) : item.isSelfSourced && item.assignedToUserId ? (
                                            <span className="text-slate-400 italic text-xs">ID: {item.assignedToUserId.slice(0, 6)}...</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {item.brand}
                                            {item.isSelfSourced && (
                                                <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold border border-sky-200 whitespace-nowrap">
                                                    受講生仕入れ
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">{item.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        ¥{item.costPrice.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'SHIPPED' ? 'bg-amber-100 text-amber-700' :
                                                    item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                            }`}>
                                            {item.status === 'IN_STOCK' ? '在庫あり' :
                                                item.status === 'SHIPPED' ? '発送済み' :
                                                    item.status === 'ASSIGNED' ? '割当済' :
                                                        item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            displayedLedger.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(entry.sellDate || entry.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                                {(entry.user?.name || 'U').substring(0, 1)}
                                            </div>
                                            <span className="font-bold text-slate-600">{entry.user?.name || 'No Name'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-800">
                                        {entry.brand}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">
                                        ¥{entry.purchasePrice.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-indigo-700">
                                        ¥{entry.sellPrice?.toLocaleString() || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                        ¥{entry.profit?.toLocaleString() || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        <div className="font-bold">{entry.salePlatform || '-'}</div>
                                        <div className="truncate w-32" title={entry.saleNote || ''}>{entry.saleNote}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
