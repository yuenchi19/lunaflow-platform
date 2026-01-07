"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus, Package, CheckCircle, AlertCircle } from "lucide-react";

interface InventoryItem {
    id: string;
    brand: string;
    name?: string;
    category?: string;
    costPrice: number;
    images: string[];
    status: string;
    assignedToUser?: { id: string; name: string; email?: string };
    assignedToUserId?: string;
    createdAt: string;
    isSelfSourced?: boolean;
    supplier?: string;
    receivedAt?: string;
    adminId?: string;
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

interface User {
    id: string;
    name: string;
    email: string;
}

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pool' | 'assigned' | 'sold' | 'admin_stock'>('pool');
    const [searchQuery, setSearchQuery] = useState('');

    // Assign Modal
    const [assignModalItem, setAssignModalItem] = useState<InventoryItem | null>(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ brand: '', name: '', category: '', costPrice: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
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

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    const handleAssign = async () => {
        if (!assignModalItem || !selectedUserId) return;
        setAssigning(true);
        try {
            const res = await fetch('/api/admin/inventory/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: assignModalItem.id, userId: selectedUserId })
            });
            if (res.ok) {
                alert("割り当てました");
                setAssignModalItem(null);
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setAssigning(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            });
            if (res.ok) {
                alert("登録しました");
                setIsCreateModalOpen(false);
                setCreateForm({ brand: '', name: '', category: '', costPrice: '' });
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setCreating(false);
        }
    };

    // Filtering Logic
    const displayedItems = (() => {
        if (activeTab === 'sold') return ledger;

        // Common filtering
        let filtered = items.filter(item =>
            (item.brand + item.name + (item.assignedToUser?.name || '')).toLowerCase().includes(searchQuery.toLowerCase())
        );

        switch (activeTab) {
            case 'pool':
                return filtered.filter(i =>
                    !i.isSelfSourced &&
                    (!i.assignedToUserId || i.assignedToUser?.name === 'Admin') &&
                    i.status === 'IN_STOCK'
                ).filter(i => !i.assignedToUserId);
            case 'assigned':
                return filtered.filter(i =>
                    i.assignedToUserId &&
                    i.status !== 'SOLD'
                );
            case 'admin_stock':
                // Placeholder for Admin's own stock if needed.
                // Assuming currently 'pool' covers unassigned, 'assigned' covers students.
                // If Admin assigns to themselves, it might appear in 'assigned' if we don't filter.
                // For now, returning empty or specific logic if defined.
                return [];
            default:
                return [];
        }
    })();

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">商品管理台帳 (Admin)</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto pb-1">
                {[
                    { id: 'pool', label: 'おまかせ仕入れ (募集中)' },
                    { id: 'assigned', label: '割当済み (受講生在庫)' },
                    { id: 'sold', label: '完売済み' },
                    { id: 'admin_stock', label: '管理者在庫' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
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
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800"
                >
                    <Package className="w-4 h-4" />
                    商品登録
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">商品情報</th>
                            {activeTab === 'assigned' && <th className="px-6 py-4">担当者 / ステータス</th>}
                            {activeTab === 'pool' && <th className="px-6 py-4 text-center">操作</th>}
                            {activeTab === 'sold' && (
                                <>
                                    <th className="px-6 py-4 text-right">販売価格</th>
                                    <th className="px-6 py-4 text-right">粗利益</th>
                                    <th className="px-6 py-4">プラットフォーム</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-right">仕入れ価格</th>
                            {activeTab !== 'sold' && <th className="px-6 py-4">登録日</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {activeTab === 'sold' ? (
                            (displayedItems as LedgerEntry[]).map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{entry.brand}</div>
                                        <div className="text-xs text-slate-500">{entry.user?.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">¥{entry.sellPrice?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">¥{entry.profit?.toLocaleString()}</td>
                                    <td className="px-6 py-4">{entry.salePlatform}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">¥{entry.purchasePrice.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            (displayedItems as InventoryItem[]).map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{item.brand}</div>
                                        <div className="text-xs text-slate-500">{item.name}</div>
                                    </td>
                                    {activeTab === 'assigned' && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-700">{item.assignedToUser?.name}</div>
                                                {!item.receivedAt ? (
                                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        未検品
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        お預かり中
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {activeTab === 'pool' && (
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setAssignModalItem(item)}
                                                className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1 mx-auto"
                                            >
                                                <UserPlus className="w-3 h-3" />
                                                割り当て
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right font-mono">¥{item.costPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                        {displayedItems.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">データがありません</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assign Modal */}
            {assignModalItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">受講生に割り当て</h3>
                        <p className="text-sm text-slate-500 mb-4">{assignModalItem.brand} {assignModalItem.name}</p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 mb-2">受講生を選択</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">選択してください</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setAssignModalItem(null)} className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedUserId || assigning}
                                className="flex-1 py-2 bg-indigo-600 font-bold text-white rounded-lg disabled:opacity-50"
                            >
                                {assigning ? '処理中...' : '確定'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Item Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">新規商品登録 (管理者)</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ブランド *</label>
                                    <input type="text" required value={createForm.brand} onChange={e => setCreateForm({ ...createForm, brand: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ</label>
                                    <input type="text" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">商品名</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ価格 (¥) *</label>
                                <input type="number" required value={createForm.costPrice} onChange={e => setCreateForm({ ...createForm, costPrice: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                                <button type="submit" disabled={creating} className="flex-1 py-2 bg-slate-900 font-bold text-white rounded-lg disabled:opacity-50">
                                    {creating ? '登録中...' : '登録'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
