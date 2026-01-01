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
    status: 'IN_STOCK' | 'ASSIGNED' | 'SOLD';
    assignedToUser?: { name: string };
    createdAt: string;
}

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/admin/inventory');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'in_stock') return item.status === 'IN_STOCK';
        if (filter === 'assigned') return item.status === 'ASSIGNED';
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-600" />
                        在庫管理 (Warehouse)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        商品の登録、生徒への割り当て管理を行います
                    </p>
                </div>
                <Link
                    href="/admin/inventory/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    商品登録
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex gap-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    すべて ({items.length})
                </button>
                <button
                    onClick={() => setFilter('in_stock')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                    在庫あり ({items.filter(i => i.status === 'IN_STOCK').length})
                </button>
                <button
                    onClick={() => setFilter('assigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'assigned' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                >
                    割当済み ({items.filter(i => i.status === 'ASSIGNED').length})
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">商品情報</th>
                            <th className="px-6 py-4">カテゴリ</th>
                            <th className="px-6 py-4 text-right">仕入れ価格</th>
                            <th className="px-6 py-4 text-center">ステータス</th>
                            <th className="px-6 py-4">割当先</th>
                            <th className="px-6 py-4">登録日</th>
                            <th className="px-6 py-4 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-400">読み込み中...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-400">データがありません</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200">
                                                {item.images[0] ? (
                                                    <img src={item.images[0]} alt={item.brand} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{item.brand}</div>
                                                <div className="text-xs text-slate-500">{item.name || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{item.category || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono">¥{item.costPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {item.status === 'IN_STOCK' ? '在庫あり' :
                                                item.status === 'ASSIGNED' ? '割当済' : item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.assignedToUser ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {item.assignedToUser.name.substring(0, 1)}
                                                </div>
                                                <span className="text-slate-600">{item.assignedToUser.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 px-2 py-1 rounded">
                                            詳細
                                        </button>
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
