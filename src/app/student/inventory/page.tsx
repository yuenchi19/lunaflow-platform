"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Tag, DollarSign, Calendar, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

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
}

export default function StudentInventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stock' | 'sold'>('stock');
    const [searchTerm, setSearchTerm] = useState("");

    // Sell Modal State
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [sellForm, setSellForm] = useState({
        sellPrice: '',
        sellDate: new Date().toISOString().split('T')[0],
        shippingCost: '',
        platformFee: '',
        note: '', // Keep for backward compatibility or existing note
        salePlatform: '',
        saleNote: ''
    });
    const [submittingSell, setSubmittingSell] = useState(false);

    const [ledger, setLedger] = useState<any[]>([]);

    const [locked, setLocked] = useState(false);

    const fetchItems = async () => {
        try {
            // Check Unlock Status First
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
    };

    useEffect(() => {
        fetchItems();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

    if (locked) {
        return (
            <div className="p-8 max-w-4xl mx-auto min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="p-4 bg-slate-100 rounded-full">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">この機能は利用できません</h2>
                    <p className="text-slate-500 mb-6">
                        現在のお客様のプラン（または進捗）では、この機能はロックされています。<br />
                        上位プランへのアップグレードまたはカリキュラムの完了が必要です。
                    </p>
                    <Link href="/student/dashboard" className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                        ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        );
    }
    const filteredItems = items.filter(item => {
        const matchesSearch = (item.brand + item.name + item.category).toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'stock') {
            return matchesSearch && (item.status === 'IN_STOCK' || item.status === 'ASSIGNED' || item.status === 'RECEIVED');
        } else {
            return matchesSearch && (item.status === 'SOLD' || item.status === 'SHIPPED');
            // SHIPPED is transitional but logically closer to sold/activley moving out? 
            // Or maybe SHIPPED means "Shipped to Student"?
            // Based on Admin flow, "SHIPPED" -> "RECEIVED" (by student).
            // So "SHIPPED" items are incoming. They should probably be in "Stock" (as Incoming).
            // Let's put SHIPPED in Stock for now, or a separate "Incoming" tab. 
            // For simplicity: Stock = IN_STOCK, ASSIGNED, SHIPPED, RECEIVED. Sold = SOLD.
        }
    });

    const handleSellClick = (item: InventoryItem) => {
        setSelectedItem(item);
        // Pre-fill some defaults if possible
        setSellForm({
            sellPrice: item.sellingPrice ? item.sellingPrice.toString() : '',
            sellDate: new Date().toISOString().split('T')[0],
            shippingCost: '1000', // Default guess
            platformFee: item.sellingPrice ? Math.floor(item.sellingPrice * 0.1).toString() : '', // 10% guess
            note: '',
            salePlatform: '',
            saleNote: ''
        });
        setIsSellModalOpen(true);
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setSubmittingSell(true);

        try {
            const res = await fetch(`/api/student/inventory/${selectedItem.id}/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sellForm)
            });

            if (res.ok) {
                alert("販売情報を登録しました！");
                setIsSellModalOpen(false);
                fetchItems(); // Refresh
            } else {
                const err = await res.json();
                alert(`エラー: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("通信エラーが発生しました");
        } finally {
            setSubmittingSell(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">商品管理台帳 (Ledger)</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        仕入れ・在庫管理・ストア公開機能、販売実績の登録ができます。
                    </p>
                </div>
                <Link href="/student/inventory/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">
                    <Plus className="w-4 h-4" />
                    商品登録
                </Link>
            </div>

            {/* Stats Summary (Simple) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">在庫総数</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-800">
                        {items.filter(i => i.status !== 'SOLD').length} <span className="text-xs md:text-sm font-normal text-slate-400">点</span>
                    </p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">販売済み</p>
                    <p className="text-xl md:text-2xl font-bold text-indigo-600">
                        {ledger.length} <span className="text-xs md:text-sm font-normal text-slate-400">点</span>
                    </p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">在庫金額(原価)</p>
                    <p className="text-lg md:text-xl font-bold text-slate-800 truncate">
                        ¥{items.filter(i => i.status !== 'SOLD').reduce((sum, i) => sum + i.costPrice, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">粗利益総額</p>
                    <p className="text-lg md:text-xl font-bold text-emerald-600 truncate">
                        ¥{ledger.reduce((sum, l) => sum + (l.profit || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        在庫一覧
                    </button>
                    <button
                        onClick={() => setActiveTab('sold')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'sold' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        販売済み履歴 (Ledger)
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ブランド、商品名で検索"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* List View (Table) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">商品画像</th>
                                <th className="px-6 py-4">登録日</th>
                                <th className="px-6 py-4">カテゴリー</th>
                                <th className="px-6 py-4">ブランド / 商品名</th>
                                <th className="px-6 py-4 text-right">仕入れ価格</th>
                                <th className="px-6 py-4 text-center">ステータス</th>
                                {activeTab === 'sold' && <>
                                    <th className="px-6 py-4 text-right">販売価格</th>
                                    <th className="px-6 py-4 text-right">粗利益</th>
                                    <th className="px-6 py-4 text-center">PF</th>
                                </>}
                                <th className="px-6 py-4 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {activeTab === 'stock' ? (
                                filteredItems.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-10 text-slate-400">データがありません</td></tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 w-20">
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                    {item.images[0] ? (
                                                        <img src={item.images[0]} alt={item.brand} className="w-full h-full object-cover" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">No</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs tabular-nums text-slate-500">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">{item.category || "-"}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{item.brand}</div>
                                                <div className="text-xs text-slate-500">{item.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">¥{item.costPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'SHIPPED' ? 'bg-amber-100 text-amber-700' :
                                                        item.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {item.status === 'IN_STOCK' ? '在庫あり' :
                                                        item.status === 'SHIPPED' ? '発送済み' :
                                                            item.status === 'ASSIGNED' ? '保管中' :
                                                                item.status === 'RECEIVED' ? '受取済' : item.status}
                                                </span>
                                            </td>
                                            {/* Stock Tab Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSellClick(item)}
                                                    className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                                >
                                                    販売登録
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                /* SOLD TAB (Ledger) */
                                ledger.filter(l => (l.brand || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <tr><td colSpan={10} className="text-center py-10 text-slate-400">履歴がありません</td></tr>
                                ) : (
                                    ledger.map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 w-20">
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 grayscale">
                                                    {entry.images && entry.images[0] ? (
                                                        <img src={entry.images[0]} alt={entry.brand} className="w-full h-full object-cover" />
                                                    ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">No</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs tabular-nums text-slate-500">
                                                {new Date(entry.sellDate || entry.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">-</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{entry.brand}</div>
                                                <div className="text-xs text-slate-500">{entry.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-400">¥{(entry.purchasePrice || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-800 text-white px-2 py-1 rounded-full text-[10px] font-bold">SOLD</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-indigo-700">¥{entry.sellPrice?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">¥{entry.profit?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-500">{entry.salePlatform || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {/* Edit Logic to be implemented or alert */ alert("編集機能は準備中です") }}
                                                    className="text-slate-400 hover:text-indigo-600 text-xs font-bold underline"
                                                >
                                                    編集
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sell Modal */}
            {isSellModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">販売実績の登録</h3>

                        <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="w-16 h-16 bg-white rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                {selectedItem.images[0] && <img src={selectedItem.images[0]} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">{selectedItem.brand} {selectedItem.name}</p>
                                <p className="text-xs text-slate-500 mt-1">仕入れ: <span className="font-mono text-slate-800 font-bold">¥{selectedItem.costPrice.toLocaleString()}</span></p>
                            </div>
                        </div>

                        <form onSubmit={handleSellSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">販売日 <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        required
                                        value={sellForm.sellDate}
                                        onChange={e => setSellForm({ ...sellForm, sellDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">販売先プラットフォーム <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={sellForm.salePlatform}
                                        onChange={e => setSellForm({ ...sellForm, salePlatform: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">選択してください</option>
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
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売価格 (¥) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        value={sellForm.sellPrice}
                                        onChange={e => setSellForm({ ...sellForm, sellPrice: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 font-mono text-lg font-bold text-indigo-600"
                                        placeholder="0"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">¥</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">送料 (¥)</label>
                                    <input
                                        type="number"
                                        value={sellForm.shippingCost}
                                        onChange={e => setSellForm({ ...sellForm, shippingCost: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">手数料 (¥)</label>
                                    <input
                                        type="number"
                                        value={sellForm.platformFee}
                                        onChange={e => setSellForm({ ...sellForm, platformFee: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">備考 / メモ</label>
                                <textarea
                                    value={sellForm.note}
                                    onChange={e => setSellForm({ ...sellForm, note: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 text-sm"
                                    placeholder="返品条件や取引メモなど"
                                />
                            </div>

                            {sellForm.sellPrice && (
                                <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-100">
                                    <p className="text-xs text-indigo-600 font-bold uppercase mb-1">予想粗利益 (Profit)</p>
                                    <p className="text-2xl font-bold text-indigo-700 tracking-tight">
                                        ¥{(
                                            Number(sellForm.sellPrice) -
                                            selectedItem.costPrice -
                                            Number(sellForm.shippingCost || 0) -
                                            Number(sellForm.platformFee || 0)
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsSellModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingSell}
                                    className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg"
                                >
                                    {submittingSell ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '実績を確定する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
