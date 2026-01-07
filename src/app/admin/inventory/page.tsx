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
    assignedToUserId?: string; // Added for fallback display
    createdAt: string;
    isSelfSourced?: boolean;
}

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string, name: string, email: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
    const [assignNote, setAssignNote] = useState('');

    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExportCSV = () => {
        // Headers
        const headers = ["ID", "Brand", "Name", "Category", "Cost Price", "Status", "Assigned To Name", "Assigned To Email", "Registered At"];

        // Rows
        const rows = filteredItems.map(item => [
            item.id,
            item.brand,
            item.name || '',
            item.category || '',
            item.costPrice.toString(),
            item.status,
            item.assignedToUser?.name || '',
            item.assignedToUser?.email || '',
            item.createdAt
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Bulk Actions
    const handleToggleSelectKey = (id: string) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItemIds(filteredItems.map(i => i.id));
        } else {
            setSelectedItemIds([]);
        }
    };

    const handleBulkAssign = async () => {
        if (selectedItemIds.length === 0) return;
        setSelectedItem(null); // Clear single select
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setAssignNote('');
        setModalOpen(true);
    };

    const handleExecuteBulkAssign = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/inventory/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemIds: selectedItemIds,
                    assignedToUserId: userId
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                setModalOpen(false);
                setSelectedItemIds([]);
                fetchItems();
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed");
        }
    };

    // Status Actions
    const handleOpenAssignModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setAssignNote(item.status === 'SHIPPED' ? 'Processing Return' : '');
        setModalOpen(true);
    };

    const handleSearchUsers = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateStatus = async (newStatus: string, userId?: string) => {
        if (!selectedItem) return;

        try {
            const res = await fetch(`/api/admin/inventory/${selectedItem.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    assignedToUserId: userId || null,
                    note: assignNote
                })
            });

            if (res.ok) {
                alert("Updated successfully");
                setModalOpen(false);
                fetchItems(); // Refresh
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update");
        }
    };

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
        if (filter === 'shipped') return item.status === 'SHIPPED';
        if (filter === 'received') return item.status === 'RECEIVED';
        return true;
    }).sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        if (key === 'assignedToUser') {
            const nameA = a.assignedToUser?.name || '';
            const nameB = b.assignedToUser?.name || '';
            if (nameA < nameB) return direction === 'asc' ? -1 : 1;
            if (nameA > nameB) return direction === 'asc' ? 1 : -1;
            return 0;
        }

        return 0;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen relative">
            {/* Bulk Action Bar */}
            {selectedItemIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4">
                    <span className="font-bold">{selectedItemIds.length} items selected</span>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button
                        onClick={handleBulkAssign}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2"
                    >
                        <span>👤</span> まとめて割り当て
                    </button>
                    <button
                        onClick={() => setSelectedItemIds([])}
                        className="text-slate-400 hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            )}

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
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <span>⬇️</span> CSV出力
                    </button>
                    <Link
                        href="/admin/inventory/new"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        商品登録
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex gap-4 overflow-x-auto">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    すべて ({items.length})
                </button>
                <button onClick={() => setFilter('in_stock')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    在庫あり ({items.filter(i => i.status === 'IN_STOCK').length})
                </button>
                <button onClick={() => setFilter('assigned')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'assigned' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                    割当済み ({items.filter(i => i.status === 'ASSIGNED').length})
                </button>
                <button onClick={() => setFilter('shipped')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'shipped' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                    発送済み ({items.filter(i => i.status === 'SHIPPED').length})
                </button>
                <button onClick={() => setFilter('received')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === 'received' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    受取済み ({items.filter(i => i.status === 'RECEIVED').length})
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input type="checkbox" onChange={handleSelectAll} className="w-4 h-4 rounded border-slate-300" />
                            </th>
                            <th className="px-6 py-4">商品情報</th>
                            <th className="px-6 py-4">カテゴリ</th>
                            <th className="px-6 py-4 text-right">仕入れ価格</th>
                            <th className="px-6 py-4 text-center">ステータス</th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                onClick={() => handleSort('assignedToUser')}
                            >
                                <div className="flex items-center gap-1">
                                    割当先
                                    {sortConfig?.key === 'assignedToUser' && (
                                        <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-4">登録日</th>
                            <th className="px-6 py-4 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-10 text-slate-400">読み込み中...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-10 text-slate-400">データがありません</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr
                                    key={item.id}
                                    className={`
                                        transition-colors 
                                        ${selectedItemIds.includes(item.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
                                        ${item.status === 'RECEIVED' ? 'opacity-60 bg-slate-50 grayscale' : ''}
                                    `}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIds.includes(item.id)}
                                            onChange={() => handleToggleSelectKey(item.id)}
                                            className="w-4 h-4 rounded border-slate-300"
                                        />
                                    </td>
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
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {item.brand}
                                                    {item.isSelfSourced && (
                                                        <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold border border-sky-200 whitespace-nowrap">
                                                            自己仕入れ
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">{item.name || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{item.category || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono">¥{item.costPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                                            item.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' :
                                                item.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-700' :
                                                    item.status === 'RECEIVED' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-slate-100 text-slate-700'
                                            }`}>
                                            {item.status === 'IN_STOCK' ? '在庫あり' :
                                                item.status === 'ASSIGNED' ? '割当済' :
                                                    item.status === 'SHIPPED' ? '発送済' :
                                                        item.status === 'RECEIVED' ? '受取済' : item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.assignedToUser ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                    {(item.assignedToUser.name || 'U').substring(0, 1)}
                                                </div>
                                                <span className="text-slate-600 font-bold">{item.assignedToUser.name || '名称未設定'}</span>
                                            </div>
                                        ) : item.isSelfSourced && item.assignedToUserId ? (
                                            <span className="text-slate-500 italic text-xs">
                                                (ユーザーID: {item.assignedToUserId.substring(0, 6)}...)
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Action Button */}
                                            {item.status === 'IN_STOCK' && (
                                                <button
                                                    onClick={() => handleOpenAssignModal(item)}
                                                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-emerald-700 whitespace-nowrap"
                                                >
                                                    割り当て
                                                </button>
                                            )}
                                            {item.status === 'ASSIGNED' && (
                                                item.isSelfSourced ? (
                                                    <span className="text-[10px] text-slate-400 font-bold border border-slate-200 px-2 py-1.5 rounded bg-slate-50 flex items-center gap-1 opacity-70 cursor-not-allowed">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        固定
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenAssignModal(item)}
                                                        className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-slate-200 whitespace-nowrap"
                                                    >
                                                        状態変更
                                                    </button>
                                                )
                                            )}
                                            {item.status === 'SHIPPED' && (
                                                <button
                                                    onClick={() => handleOpenAssignModal(item)}
                                                    className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-100 whitespace-nowrap border border-indigo-200"
                                                >
                                                    到着確認
                                                </button>
                                            )}
                                            {item.status === 'RECEIVED' && (
                                                <span className="text-xs text-slate-400 font-bold">完了</span>
                                            )}

                                            <Link
                                                href={`/admin/inventory/${item.id}`}
                                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 px-2.5 py-1.5 rounded whitespace-nowrap"
                                            >
                                                詳細
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assignment Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">
                                {selectedItem ? `在庫の操作: ${selectedItem.brand}` : `一括操作: ${selectedItemIds.length}件を割り当て`}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="text-xl">×</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* BULK or SINGLE IN_STOCK */}
                            {(!selectedItem || selectedItem.status === 'IN_STOCK' || (selectedItem.status === 'ASSIGNED' && !selectedItem.assignedToUser)) && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">割り当てる生徒を検索</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => handleSearchUsers(e.target.value)}
                                                placeholder="名前 または メールアドレス"
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="mt-2 border border-slate-100 rounded-lg max-h-40 overflow-y-auto shadow-sm">
                                                {searchResults.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => { setSelectedUser(u); setSearchQuery(u.name); setSearchResults([]); }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex justify-between items-center group"
                                                    >
                                                        <span className="font-bold text-slate-700">{u.name}</span>
                                                        <span className="text-xs text-slate-400 group-hover:text-indigo-400">{u.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedUser && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">{selectedUser.name[0]}</div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-indigo-900">{selectedUser.name}</div>
                                                <div className="text-xs text-indigo-600">に割り当てます</div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        disabled={!selectedUser}
                                        onClick={() => {
                                            if (!selectedUser) return;
                                            if (selectedItem) {
                                                handleUpdateStatus('ASSIGNED', selectedUser.id);
                                            } else {
                                                handleExecuteBulkAssign(selectedUser.id);
                                            }
                                        }}
                                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        割り当てを確定する
                                    </button>
                                </div>
                            )}

                            {/* SINGLE: ASSIGNED - Change Status or User */}
                            {selectedItem && selectedItem.status === 'ASSIGNED' && selectedItem.assignedToUser && (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3 mb-4">
                                        <span className="text-2xl">📦</span>
                                        <div>
                                            <div className="text-xs text-slate-500 font-bold uppercase">現在の割当</div>
                                            <div className="font-bold text-slate-800">{selectedItem.assignedToUser.name}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUpdateStatus('SHIPPED')}
                                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                    >
                                        <span>🚚</span> 発送済みにする
                                    </button>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold">OR</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    {/* Reassign (Simple version: Cancel assignment first) */}
                                    <button
                                        onClick={() => handleUpdateStatus('IN_STOCK')}
                                        className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-50 text-sm"
                                    >
                                        割当を解除する (在庫に戻す)
                                    </button>
                                </div>
                            )}

                            {/* SINGLE: SHIPPED - Return or Receive */}
                            {selectedItem && selectedItem.status === 'SHIPPED' && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex flex-col gap-3">
                                        <h4 className="font-bold text-indigo-900 text-sm mb-1">到着確認</h4>
                                        <p className="text-xs text-indigo-700">生徒側で商品の到着が確認できた場合、ステータスを更新します。</p>
                                        <button
                                            onClick={() => handleUpdateStatus('RECEIVED')}
                                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                        >
                                            <span>✨</span> 到着確認済みにする (グレーアウト)
                                        </button>
                                    </div>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold">返品・キャンセル</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus('RETURNED')}
                                            className="flex-1 bg-rose-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-rose-700"
                                        >
                                            返品として処理
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus('IN_STOCK')}
                                            className="flex-1 bg-white border border-rose-200 text-rose-600 font-bold py-2 rounded-lg text-sm hover:bg-rose-50"
                                        >
                                            在庫に戻す
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
