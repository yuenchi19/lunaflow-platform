"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Plus, Search, Trash2, Download, Copy, CheckSquare, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface InventoryItem {
    id: string;
    brand: string;
    name: string | null;
    category: string | null;
    costPrice: number;
    sellingPrice: number | null;
    images: string[];
    status: string;
    createdAt: string;
    condition: string | null;
    assignedToUserId?: string | null;
    isSelfSourced?: boolean;
    supplier?: string | null;
    purchaseDate?: string | null;
}

interface LedgerEntry {
    id: string;
    originItemId: string | null;
    sellPrice: number | null;
    sellDate: string | null;
    shippingCost: number | null;
    platformFee: number | null;
    note: string | null;
    salePlatform: string | null;
    saleNote: string | null;
    profit: number | null;
    purchasePrice: number | null;
    brand: string;
    name: string | null;
    updatedAt: string;
    images: string[];
    // For CSV
    supplier?: string;
    purchaseDate?: string;
}

export default function StudentInventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stock' | 'sold'>('stock');
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [visibleCount, setVisibleCount] = useState(20);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [bulkForm, setBulkForm] = useState({ supplier: '', purchaseDate: '' });

    // Sell Modal State
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [sellForm, setSellForm] = useState({
        sellPrice: '',
        sellDate: new Date().toISOString().split('T')[0],
        shippingCost: '',
        platformFee: '',
        note: '',
        salePlatform: '',
        saleNote: ''
    });
    const [submittingSell, setSubmittingSell] = useState(false);
    const [locked, setLocked] = useState(false);

    // Delete State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchItems = useCallback(async () => {
        try {
            // Check Unlock Status
            const unlockRes = await fetch('/api/student/unlock-status');
            if (unlockRes.ok) {
                const unlocks = await unlockRes.json();
                if (!unlocks.inventory) {
                    setLocked(true);
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch('/api/student/inventory');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setLedger(data.ledger || []);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // --- Item Filtering ---
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = (item.brand + item.name + (item.category || '')).toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch && item.status !== 'SOLD';
        });
    }, [items, searchTerm]);

    const filteredLedger = useMemo(() => {
        return ledger.filter(entry => {
            const matchesSearch = (entry.brand + (entry.name || '')).toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [ledger, searchTerm]);

    // Derived Display List
    const displayedItems = activeTab === 'stock'
        ? filteredItems.slice(0, visibleCount)
        : filteredLedger.slice(0, visibleCount);

    const totalCount = activeTab === 'stock' ? filteredItems.length : filteredLedger.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    // --- Bulk Actions ---
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    const handleBulkEditSubmit = async () => {
        if (!confirm(`${selectedIds.size}件の商品の情報を更新しますか？`)) return;
        try {
            const res = await fetch('/api/student/inventory/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemIds: Array.from(selectedIds),
                    supplier: bulkForm.supplier,
                    purchaseDate: bulkForm.purchaseDate
                })
            });

            if (res.ok) {
                alert("一括更新しました");
                setIsBulkEditOpen(false);
                setSelectedIds(new Set());
                fetchItems();
            } else {
                alert("更新に失敗しました");
            }
        } catch (e) {
            console.error(e);
            alert("通信エラー");
        }
    };

    const downloadCSV = () => {
        // Headers for Kobutsusho Daicho
        // Req: Date, Item, Features, Qty, Price, Supplier, SellDate, SellPrice, SellTo
        const csvHeader = [
            "取引年月日(仕入日)",
            "品目(ブランド/カテゴリ)",
            "特徴(商品名/状態)",
            "数量",
            "買受金額(仕入等)",
            "氏名又は名称(仕入先)", // Supplier
            "販売年月日",
            "販売金額",
            "氏名又は名称(販売先)"
        ].join(",");

        const rows = [...items, ...ledger].map(item => {
            const isSold = 'sellDate' in item; // Is LedgerEntry
            // Mapping
            let purchaseDate = '';
            let itemDesc = '';
            let features = '';
            let price = '';
            let supplier = '';
            let sellDate = '';
            let sellPrice = '';
            let sellTo = '';

            if (isSold) {
                const l = item as LedgerEntry;
                purchaseDate = l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : ''; // Ideally purchaseDate from DB
                // Since ledger might not have direct supplier field unless we joined, fallback to empty or note?
                // Actually we just added supplier to InventoryItem. LedgerEntry is separate.
                // If Sold, we need to find original item or store supplier in Ledger?
                // For now, use purchasePrice.
                itemDesc = `${l.brand}`;
                features = `${l.name || ''}`;
                price = l.purchasePrice?.toString() || '0';
                supplier = ''; // TODO: Need to persist supplier to Ledger or join.
                sellDate = l.sellDate ? new Date(l.sellDate).toLocaleDateString() : '';
                sellPrice = l.sellPrice?.toString() || '';
                sellTo = l.salePlatform || '';
            } else {
                const i = item as InventoryItem;
                purchaseDate = i.purchaseDate ? new Date(i.purchaseDate).toLocaleDateString() : new Date(i.createdAt).toLocaleDateString();
                itemDesc = `${i.brand} ${i.category || ''}`;
                features = `${i.name || ''} ${i.condition || ''}`;
                price = i.costPrice.toString();
                supplier = i.supplier || '';
                sellDate = '';
                sellPrice = '';
                sellTo = '';
            }

            return [
                purchaseDate,
                itemDesc,
                features,
                "1",
                price,
                supplier,
                sellDate,
                sellPrice,
                sellTo
            ].map(f => `"${f}"`).join(",");
        });

        const csvContent = "\uFEFF" + [csvHeader, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `kobutsusho_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Action Handlers (Delete, Sell) Same as before ---
    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/student/inventory/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== id));
                alert("削除しました");
            } else {
                alert("削除失敗");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSellClick = (item: InventoryItem) => {
        setSelectedItem(item);
        if (item.status === 'SOLD') {
            const entry = ledger.find(l => l.originItemId === item.id);
            if (entry) {
                setSellForm({
                    sellPrice: entry.sellPrice?.toString() || '',
                    sellDate: entry.sellDate ? new Date(entry.sellDate).toISOString().split('T')[0] : '',
                    shippingCost: entry.shippingCost?.toString() || '',
                    platformFee: entry.platformFee?.toString() || '',
                    note: entry.note || '',
                    salePlatform: entry.salePlatform || '',
                    saleNote: entry.saleNote || ''
                });
            } else {
                setSellForm({ sellPrice: item.sellingPrice?.toString() || '', sellDate: new Date().toISOString().split('T')[0], shippingCost: '0', platformFee: '0', note: '', salePlatform: '', saleNote: '' });
            }
        } else {
            setSellForm({
                sellPrice: item.sellingPrice?.toString() || '',
                sellDate: new Date().toISOString().split('T')[0],
                shippingCost: '1000',
                platformFee: item.sellingPrice ? Math.floor(item.sellingPrice * 0.1).toString() : '',
                note: '',
                salePlatform: '',
                saleNote: ''
            });
        }
        setIsSellModalOpen(true);
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setSubmittingSell(true);
        try {
            const method = selectedItem.status === 'SOLD' ? 'PATCH' : 'POST';
            const res = await fetch(`/api/student/inventory/${selectedItem.id}/sell`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sellForm)
            });
            if (res.ok) {
                alert("保存しました");
                setIsSellModalOpen(false);
                fetchItems();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setSubmittingSell(false);
        }
    };

    useEffect(() => {
        setVisibleCount(20);
        setSelectedIds(new Set()); // Reset selection on tab change
    }, [activeTab, searchTerm]);

    if (loading) return <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;
    if (locked) return <div className="p-8 text-center">機能がロックされています</div>;

    const stockCount = items.filter(i => i.status !== 'SOLD').length;
    const soldCount = ledger.length;
    const stockAmount = items.filter(i => i.status !== 'SOLD').reduce((sum, i) => sum + i.costPrice, 0);
    const profitAmount = ledger.reduce((sum, l) => sum + (l.profit || 0), 0);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">商品管理台帳</h1>
                    <p className="text-sm text-slate-500 mt-1">仕入れ・在庫管理と古物台帳の記録</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        台帳出力 (CSV)
                    </button>
                    <Link href="/student/inventory/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">
                        <Plus className="w-4 h-4" />
                        商品登録
                    </Link>
                </div>
            </div>

            {/* Stats Summary - Kept Same */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">在庫総数</p>
                    <p className="text-2xl font-bold text-slate-800">{stockCount}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">完売総数</p>
                    <p className="text-2xl font-bold text-indigo-600">{soldCount}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">在庫金額</p>
                    <p className="text-xl font-bold text-slate-800">¥{stockAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">粗利益</p>
                    <p className="text-xl font-bold text-emerald-600">¥{profitAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'stock' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>在庫一覧</button>
                        <button onClick={() => setActiveTab('sold')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'sold' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>完売履歴</button>
                    </div>
                </div>

                {/* Bulk Action Bar (Visible when items selected in Stock tab) */}
                {activeTab === 'stock' && selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-sm font-bold text-slate-600">{selectedIds.size}件選択中</span>
                        <button
                            onClick={() => setIsBulkEditOpen(true)}
                            className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700"
                        >
                            <Edit className="w-3 h-3" />
                            一括編集
                        </button>
                    </div>
                )}

                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="商品名など検索"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                {activeTab === 'stock' && (
                                    <th className="px-4 py-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-4">商品画像</th>
                                <th className="px-6 py-4">登録/購入日</th>
                                <th className="px-6 py-4">仕入れ先</th>
                                <th className="px-6 py-4">ブランド / 商品名</th>
                                <th className="px-6 py-4 text-right">仕入れ価格</th>
                                {activeTab === 'sold' && <>
                                    <th className="px-6 py-4 text-right">販売価格</th>
                                    <th className="px-6 py-4 text-right">粗利益</th>
                                </>}
                                <th className="px-6 py-4 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {displayedItems.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-10 text-slate-400">データがありません</td></tr>
                            ) : (
                                activeTab === 'stock' ? (
                                    (displayedItems as InventoryItem[]).map(item => (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(item.id) ? 'bg-indigo-50/50' : ''}`}>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 w-20">
                                                <div className="relative w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                    {item.images[0] ? (
                                                        <Image src={item.images[0]} alt={item.brand} fill className="object-cover" sizes="48px" />
                                                    ) : <div className="text-xs text-slate-300">No</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs tabular-nums text-slate-500">
                                                <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                                                {item.purchaseDate && <div className="text-[10px] text-slate-400">購入: {new Date(item.purchaseDate).toLocaleDateString()}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 truncate max-w-[150px]" title={item.supplier || ''}>
                                                {item.supplier || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {item.brand}
                                                    {/* @ts-ignore */}
                                                    {item.isSelfSourced && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">受講生仕入れ</span>}
                                                </div>
                                                <div className="text-xs text-slate-500">{item.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">¥{item.costPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleSellClick(item)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm">販売登録</button>
                                                    {/* @ts-ignore */}
                                                    {item.isSelfSourced && (
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" disabled={deletingId === item.id}>
                                                            {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    (displayedItems as LedgerEntry[]).map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 w-20">
                                                <div className="relative w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 grayscale">
                                                    {entry.images && entry.images[0] ? (
                                                        <Image src={entry.images[0]} alt={entry.brand} fill className="object-cover" sizes="48px" />
                                                    ) : <div className="text-xs text-slate-300">No</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs tabular-nums text-slate-500">
                                                {new Date(entry.sellDate || entry.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">-</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{entry.brand}</div>
                                                <div className="text-xs text-slate-500">{entry.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-400">¥{(entry.purchasePrice || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-indigo-700">¥{entry.sellPrice?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">¥{entry.profit?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => {
                                                    const pseudoItem: InventoryItem = {
                                                        id: entry.originItemId || entry.id,
                                                        brand: entry.brand,
                                                        name: entry.name,
                                                        category: null,
                                                        costPrice: entry.purchasePrice || 0,
                                                        sellingPrice: entry.sellPrice,
                                                        images: entry.images,
                                                        status: 'SOLD',
                                                        createdAt: entry.updatedAt,
                                                        condition: null
                                                    };
                                                    handleSellClick(pseudoItem);
                                                }} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline">編集</button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Load More Button */}
            {visibleCount < totalCount && (
                <div className="flex justify-center mb-8">
                    <button onClick={handleLoadMore} className="px-6 py-2 bg-white border border-slate-300 rounded-full text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        もっと見る ({totalCount - visibleCount}件)
                    </button>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {isBulkEditOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">一括編集 ({selectedIds.size}件)</h3>
                        <p className="text-xs text-slate-500 mb-4">選択した商品すべての仕入れ先・購入日を更新します。<br />入力した項目のみ上書きされます。</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ先 (購入元)</label>
                                <input
                                    type="text"
                                    value={bulkForm.supplier}
                                    onChange={e => setBulkForm({ ...bulkForm, supplier: e.target.value })}
                                    placeholder="例: セカンドストリート渋谷店"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">購入日</label>
                                <input
                                    type="date"
                                    value={bulkForm.purchaseDate}
                                    onChange={e => setBulkForm({ ...bulkForm, purchaseDate: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button onClick={() => setIsBulkEditOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200">キャンセル</button>
                            <button onClick={handleBulkEditSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">更新する</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal - Same as before */}
            {isSellModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">
                            {selectedItem.status === 'SOLD' ? '販売情報の編集' : '販売実績の登録'}
                        </h3>

                        <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="relative w-16 h-16 bg-white rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                {selectedItem.images[0] && (
                                    <Image src={selectedItem.images[0]} alt="Item" fill className="object-cover" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">{selectedItem.brand} {selectedItem.name}</p>
                                <p className="text-xs text-slate-500 mt-1">仕入れ: <span className="font-mono text-slate-800 font-bold">¥{selectedItem.costPrice.toLocaleString()}</span></p>
                            </div>
                        </div>

                        <form onSubmit={handleSellSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">販売日 *</label>
                                    <input type="date" required value={sellForm.sellDate} onChange={e => setSellForm({ ...sellForm, sellDate: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">プラットフォーム *</label>
                                    <select required value={sellForm.salePlatform} onChange={e => setSellForm({ ...sellForm, salePlatform: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                                        <option value="">選択</option>
                                        <option value="Mercari">メルカリ</option>
                                        <option value="Rakuma">ラクマ</option>
                                        <option value="YahooFleaMarket">Yahoo!フリマ</option>
                                        <option value="eBay">eBay</option>
                                        <option value="Amazon">Amazon</option>
                                        <option value="OwnSite">自社EC</option>
                                        <option value="Other">その他</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売価格 (¥) *</label>
                                <input type="number" required value={sellForm.sellPrice} onChange={e => setSellForm({ ...sellForm, sellPrice: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-lg font-bold text-indigo-600" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">送料 (¥)</label>
                                    <input type="number" value={sellForm.shippingCost} onChange={e => setSellForm({ ...sellForm, shippingCost: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">手数料 (¥)</label>
                                    <input type="number" value={sellForm.platformFee} onChange={e => setSellForm({ ...sellForm, platformFee: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">備考</label>
                                <textarea value={sellForm.note} onChange={e => setSellForm({ ...sellForm, note: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 text-sm" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsSellModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200">キャンセル</button>
                                <button type="submit" disabled={submittingSell} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg">
                                    {submittingSell ? <Loader2 className="animate-spin mx-auto" /> : '保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
