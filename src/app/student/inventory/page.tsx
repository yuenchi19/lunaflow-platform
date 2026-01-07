"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Download, Package, CheckCircle, AlertCircle, Edit2, ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface InventoryItem {
    id: string;
    brand: string;
    name?: string;
    category?: string;
    costPrice: number;
    images: string[];
    assignedToUserId: string;
    createdAt: string;
    status: string;
    isSelfSourced: boolean;
    supplier?: string;
    receivedAt?: string;
    purchaseDate?: string;

    // Kobutsusho Fields
    supplierName?: string;
    supplierAddress?: string;
    supplierOccupation?: string;
    supplierAge?: number;
    idVerificationMethod?: string;
}

interface LedgerEntry {
    id: string;
    user: { name: string, email: string };
    brand: string;
    purchasePrice: number;
    sellPrice?: number;
    profit?: number;
    salePlatform?: string;
    saleDate?: string;
    sellNote?: string;
    updatedAt: string;
    status: string;
}

const ID_VERIFICATION_METHODS = [
    "店舗・業者間取引（本人確認省略）",
    "運転免許証",
    "マイナンバーカード",
    "健康保険証",
    "その他（備考に記載）"
];

export default function StudentInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stock' | 'sold'>('stock');
    const [searchQuery, setSearchQuery] = useState('');
    const [userProfile, setUserProfile] = useState<{ name: string, kobutsushoNumber?: string } | null>(null);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [bulkEditForm, setBulkEditForm] = useState({
        supplier: '',
        purchaseDate: '',
        supplierName: '',
        supplierAddress: '',
        supplierOccupation: '',
        supplierAge: '',
        idVerificationMethod: ID_VERIFICATION_METHODS[0]
    });
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // Sales Modal
    const [sellModalItem, setSellModalItem] = useState<InventoryItem | null>(null);
    const [sellForm, setSellForm] = useState({ price: '', platform: 'Mercari', note: '' });
    const [selling, setSelling] = useState(false);

    // Return Modal
    const [returnItem, setReturnItem] = useState<LedgerEntry | null>(null);
    const [returnReason, setReturnReason] = useState("");
    const [returning, setReturning] = useState(false);

    // Individual Edit Modal (Stock)
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [editForm, setEditForm] = useState({
        supplier: '',
        purchaseDate: '',
        supplierName: '',
        supplierAddress: '',
        supplierOccupation: '',
        supplierAge: '',
        idVerificationMethod: '',
        costPrice: ''
    });
    const [editing, setEditing] = useState(false);

    // Delete
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Receiving
    const [receivingId, setReceivingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        fetchProfile();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/student/inventory');
            const data = await res.json();
            setItems(data.items || []);
            setLedger(data.ledger || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data);
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };

    // --- Bulk Logic ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(items.filter(i => i.status === 'IN_STOCK').map(i => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.size === 0) return;
        setBulkUpdating(true);
        try {
            const res = await fetch('/api/student/inventory/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemIds: Array.from(selectedIds),
                    ...bulkEditForm
                })
            });
            if (res.ok) {
                alert("更新しました");
                setIsBulkEditOpen(false);
                setSelectedIds(new Set());
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setBulkUpdating(false);
        }
    };

    // --- Individual Edit Logic ---
    const openEditModal = (item: InventoryItem) => {
        setEditItem(item);
        setEditForm({
            supplier: item.supplier || '',
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
            supplierName: item.supplierName || '',
            supplierAddress: item.supplierAddress || '',
            supplierOccupation: item.supplierOccupation || '',
            supplierAge: item.supplierAge ? item.supplierAge.toString() : '',
            idVerificationMethod: item.idVerificationMethod || ID_VERIFICATION_METHODS[0],
            costPrice: item.costPrice.toString()
        });
    };

    const handleEditSave = async () => {
        if (!editItem) return;
        setEditing(true);
        try {
            const res = await fetch('/api/student/inventory/bulk', { // Reuse bulk endpoint for single update
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemIds: [editItem.id],
                    ...editForm
                })
            });
            if (res.ok) {
                alert("更新しました");
                setEditItem(null);
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setEditing(false);
        }
    };


    // --- Sales Logic ---
    const handleSellClick = (item: InventoryItem) => {
        setSellModalItem(item);
        setSellForm({ price: '', platform: 'Mercari', note: '' });
    };

    const handleSellConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sellModalItem) return;
        setSelling(true);
        try {
            const res = await fetch('/api/student/inventory/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: sellModalItem.id,
                    sellPrice: parseInt(sellForm.price),
                    platform: sellForm.platform,
                    note: sellForm.note
                })
            });
            if (res.ok) {
                alert("販売記録を保存しました");
                setSellModalItem(null);
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setSelling(false);
        }
    };

    // --- Receive Logic ---
    const handleReceive = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("検品を完了し、在庫として登録しますか？")) return;

        setReceivingId(id);
        try {
            const res = await fetch(`/api/student/inventory/${id}/receive`, { method: 'POST' });
            if (res.ok) {
                fetchData();
            } else {
                alert("エラーが発生しました");
            }
        } catch (e) {
            alert("通信エラー");
        } finally {
            setReceivingId(null);
        }
    };

    // --- Delete Logic ---
    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/student/inventory/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "削除できませんでした");
            }
        } catch (e) {
            alert("エラー");
        } finally {
            setDeletingId(null);
        }
    };

    // --- CSV Export ---
    const downloadCSV = () => {
        // Filter: Must be received
        const exportItems = items.filter(i => i.receivedAt);

        if (exportItems.length === 0) {
            alert("CSV出力できる商品がありません（未検品の商品は出力されません）");
            return;
        }

        // Header
        const headerInfo = userProfile ? `古物商許可番号: ${userProfile.kobutsushoNumber || '未登録'}  氏名: ${userProfile.name}\n` : '';
        const headers = ["No.", "受入年月日", "品目", "特徴", "数量", "単価", "仕入先住所", "仕入先氏名", "職業", "年齢", "確認確認方法", "払出年月日", "価額", "相手方"];

        const csvContent = headerInfo + headers.join(",") + "\n" + exportItems.map((item, index) => {
            const purchaseDate = item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "");
            const description = `${item.brand} ${item.name || ''}`;
            const features = item.category || ''; // Using category as feature
            const qty = 1;
            const cost = item.costPrice;

            // Kobutsusho Supplier Info
            const supplierAddress = item.supplierAddress || item.supplier || ""; // Fallback to simple supplier if address missing
            const supplierName = item.supplierName || "";
            const occupation = item.supplierOccupation || "";
            const age = item.supplierAge || "";
            const idMethod = item.idVerificationMethod || "";

            // Sales info (Check ledger if sold, but this list is mostly Stock. If sold items are in list? Current list view separates Stock/Sold.)
            // If exporting ALL, we need to merge. But user typically exports "Ledger" which includes both. 
            // Current `items` is Stock. `ledger` is Sold.
            // Let's combine for CSV if requested? Or just Stock?
            // Usually Kobutsusho Ledger needs sequence of Purchase -> Sale.
            // Let's try to export BOTH if we can, or just tell user this matches the view.
            // Since `items` might update to `status=sold`? No, separate states.
            // Let's export current `items` (Stock) + `ledger` (Sold) combined?
            // Complexity: LedgerEntry structure matches `InventoryItem`?
            // Let's just export `items` (Stock) for now, or merge manually.
            // Ideally, we fetch ALL history for CSV. 
            // For now, let's export valid Stock items.

            return [
                index + 1,
                purchaseDate,
                "衣類・雑貨", // Fixed or Category
                description,
                qty,
                cost,
                supplierAddress,
                supplierName,
                occupation,
                age,
                idMethod,
                "", // Sales Date (Empty for stock)
                "", // Sales Price
                ""  // Buyer
            ].map(f => `"${f}"`).join(",");
        }).join("\n");

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `古物台帳_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtered Display
    const displayedItems = activeTab === 'sold'
        ? ledger.filter(i => (i.brand + i.brand).toLowerCase().includes(searchQuery.toLowerCase()))
        : items.filter(i => (i.brand + (i.name || '')).toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-4 md:p-8 pb-32">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">在庫管理</h1>
                <Link href="/student/inventory/new" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Package className="w-4 h-4" />
                    <span className="hidden md:inline">新規登録</span>
                </Link>
            </div>

            {/* Filter & Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>在庫一覧</button>
                    <button onClick={() => setActiveTab('sold')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'sold' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>完売・利益</button>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full md:w-64"
                        />
                    </div>
                    {activeTab === 'stock' && (
                        <>
                            <button
                                onClick={() => setIsBulkEditOpen(true)}
                                disabled={selectedIds.size === 0}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                            >
                                一括編集
                            </button>
                            <button onClick={downloadCSV} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                <span className="hidden md:inline">台帳CSV</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
                                <tr>
                                    {activeTab === 'stock' && (
                                        <th className="px-6 py-4 w-10">
                                            <input type="checkbox" onChange={handleSelectAll} className="rounded border-slate-300 mb-0.5" />
                                        </th>
                                    )}
                                    <th className="px-6 py-4">商品画像</th>
                                    <th className="px-6 py-4">情報</th>
                                    {activeTab === 'stock' && <th className="px-6 py-4">仕入れ情報</th>}
                                    {activeTab === 'sold' && (
                                        <>
                                            <th className="px-6 py-4 text-right">販売価格</th>
                                            <th className="px-6 py-4 text-right">利益</th>
                                            <th className="px-6 py-4">PF</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {displayedItems.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">データがありません</td></tr>
                                ) : (activeTab === 'stock' ? (
                                    (displayedItems as InventoryItem[]).map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => handleSelectOne(item.id)}
                                                    className="rounded border-slate-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 relative bg-slate-100 rounded overflow-hidden border border-slate-200">
                                                    {item.images?.[0] ? (
                                                        <Image src={item.images[0]} alt={item.brand} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-300"><Package className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{item.brand}</div>
                                                <div className="text-xs text-slate-500">{item.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {item.isSelfSourced ? (
                                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">受講生仕入</span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">おまかせ</span>
                                                    )}
                                                    {!item.receivedAt && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />未検品
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="text-slate-500">¥{item.costPrice.toLocaleString()}</div>
                                                <div className="text-slate-400 truncate max-w-[120px]" title={item.supplier}>{item.supplier || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    {/* Receive Button */}
                                                    {!item.isSelfSourced && !item.receivedAt && (
                                                        <button
                                                            onClick={(e) => handleReceive(item.id, e)}
                                                            disabled={!!receivingId}
                                                            className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-emerald-700 shadow-sm"
                                                        >
                                                            {receivingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                            検品完了
                                                        </button>
                                                    )}

                                                    {/* Operation Buttons */}
                                                    <button
                                                        onClick={() => handleSellClick(item)}
                                                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                                    >
                                                        販売登録
                                                    </button>

                                                    {/* Edit Button (Individual) */}
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                                        title="編集"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    {item.isSelfSourced && (
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="削除"
                                                        >
                                                            {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "✕"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    (displayedItems as LedgerEntry[]).map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                {/* Sold Item Image Placeholder or from joined data if available (removed simplistic handling for brevity, assuming standard table) */}
                                                <div className="font-bold text-slate-800">{entry.brand}</div>
                                                <div className="text-xs text-slate-500">{new Date(entry.updatedAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {/* Sold Item Info */}
                                                売却済
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">¥{entry.sellPrice?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">¥{entry.profit?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm">{entry.salePlatform}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded">
                                                    返品・修正
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {isBulkEditOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">一括編集 ({selectedIds.size}件)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-4">
                                ※ここで入力した内容は、選択した全ての商品に上書きされます。
                            </div>

                            <h4 className="font-bold text-sm border-b pb-2">仕入れ情報 (古物台帳用)</h4>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ先 (表示用名)</label>
                                <input type="text" value={bulkEditForm.supplier} onChange={e => setBulkEditForm({ ...bulkEditForm, supplier: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" placeholder="例: セカンドストリート" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">氏名 (必須)</label>
                                    <input type="text" value={bulkEditForm.supplierName} onChange={e => setBulkEditForm({ ...bulkEditForm, supplierName: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">年齢</label>
                                    <input type="number" value={bulkEditForm.supplierAge} onChange={e => setBulkEditForm({ ...bulkEditForm, supplierAge: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">住所 (必須)</label>
                                <input type="text" value={bulkEditForm.supplierAddress} onChange={e => setBulkEditForm({ ...bulkEditForm, supplierAddress: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" placeholder="東京都..." />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">職業</label>
                                <input type="text" value={bulkEditForm.supplierOccupation} onChange={e => setBulkEditForm({ ...bulkEditForm, supplierOccupation: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">本人確認方法</label>
                                <select
                                    value={bulkEditForm.idVerificationMethod}
                                    onChange={e => setBulkEditForm({ ...bulkEditForm, idVerificationMethod: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                >
                                    {ID_VERIFICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ日時</label>
                                <input type="date" value={bulkEditForm.purchaseDate} onChange={e => setBulkEditForm({ ...bulkEditForm, purchaseDate: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setIsBulkEditOpen(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                                <button onClick={handleBulkUpdate} disabled={bulkUpdating} className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-lg disabled:opacity-50">
                                    {bulkUpdating ? '更新中...' : '一括更新を実行'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Edit Modal */}
            {editItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">商品情報の編集</h3>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm border-b pb-2">仕入れ・台帳情報</h4>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ価格 (¥)</label>
                                <input type="number" value={editForm.costPrice} onChange={e => setEditForm({ ...editForm, costPrice: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ先 (表示用名)</label>
                                <input type="text" value={editForm.supplier} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">氏名 (必須)</label>
                                    <input type="text" value={editForm.supplierName} onChange={e => setEditForm({ ...editForm, supplierName: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">年齢</label>
                                    <input type="number" value={editForm.supplierAge} onChange={e => setEditForm({ ...editForm, supplierAge: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">住所 (必須)</label>
                                <input type="text" value={editForm.supplierAddress} onChange={e => setEditForm({ ...editForm, supplierAddress: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">職業</label>
                                <input type="text" value={editForm.supplierOccupation} onChange={e => setEditForm({ ...editForm, supplierOccupation: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">本人確認方法</label>
                                <select
                                    value={editForm.idVerificationMethod}
                                    onChange={e => setEditForm({ ...editForm, idVerificationMethod: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                >
                                    {ID_VERIFICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ日時</label>
                                <input type="date" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setEditItem(null)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                                <button onClick={handleEditSave} disabled={editing} className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-lg disabled:opacity-50">
                                    {editing ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Modal */}
            {sellModalItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">販売登録</h3>
                        <form onSubmit={handleSellConfirm} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売価格 (¥)</label>
                                <input type="number" required value={sellForm.price} onChange={e => setSellForm({ ...sellForm, price: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">プラットフォーム</label>
                                <select value={sellForm.platform} onChange={e => setSellForm({ ...sellForm, platform: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2">
                                    <option value="Mercari">メルカリ</option>
                                    <option value="YahooAuctions">ヤフオク</option>
                                    <option value="Rakuma">ラクマ</option>
                                    <option value="Other">その他</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">備考</label>
                                <textarea value={sellForm.note} onChange={e => setSellForm({ ...sellForm, note: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 h-20" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setSellModalItem(null)} className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                                <button type="submit" disabled={selling} className="flex-1 py-2 bg-indigo-600 font-bold text-white rounded-lg">販売確定</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
