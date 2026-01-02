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
        note: ''
    });
    const [submittingSell, setSubmittingSell] = useState(false);

    const [ledger, setLedger] = useState<any[]>([]);

    const fetchItems = async () => {
        try {
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
            note: ''
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
                        在庫の管理、販売実績の登録ができます。
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeTab === 'stock' ? (
                    filteredItems.length === 0 ? (
                        <EmptyState
                            title="在庫がありません"
                            description="在庫アイテムが登録されていません。「商品登録」ボタンから追加してください。"
                            icon={Package}
                            className="col-span-full py-16"
                        />
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                <div className="relative aspect-square bg-slate-100">
                                    {item.images[0] ? (
                                        <img src={item.images[0]} alt={item.brand} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-700' :
                                            item.status === 'SHIPPED' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                            {item.status === 'IN_STOCK' ? '在庫あり' :
                                                item.status === 'SHIPPED' ? '発送済み' :
                                                    item.status === 'ASSIGNED' ? '担当者割り当て済み' :
                                                        item.status === 'RECEIVED' ? '受領済み' :
                                                            item.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-slate-400 font-bold mb-1">{item.category || "未分類"}</div>
                                    <h3 className="font-bold text-slate-800 mb-1 truncate">{item.brand} {item.name}</h3>
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">仕入れ値</p>
                                            <p className="text-sm font-bold text-slate-700">¥{item.costPrice.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSellClick(item)}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            販売登録
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    // SOLD VIEW (Using Ledger)
                    ledger.filter(l => (l.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                        <EmptyState
                            title="販売履歴がありません"
                            description="まだ販売された商品がありません。在庫を販売登録するとここに表示されます。"
                            icon={DollarSign}
                            className="col-span-full py-16"
                        />
                    ) : (
                        ledger.filter(l => (l.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(entry => (
                            <div key={entry.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                <div className="relative aspect-square bg-slate-100">
                                    {entry.images && entry.images[0] ? (
                                        <img src={entry.images[0]} alt={entry.brand} className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm bg-slate-800 text-white">
                                            SOLD OUT
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 truncate flex-1">{entry.brand} {entry.name}</h3>
                                        <span className="text-[10px] text-slate-400">{new Date(entry.sellDate || entry.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-[10px] text-slate-400">売上</p>
                                            <p className="font-bold">¥{entry.sellPrice?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-2 rounded">
                                            <p className="text-[10px] text-emerald-600">利益</p>
                                            <p className="font-bold text-emerald-700">¥{entry.profit?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* Sell Modal */}
            {isSellModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">販売実績の登録</h3>
                        <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-lg">
                            <div className="w-16 h-16 bg-white rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                                {selectedItem.images[0] && <img src={selectedItem.images[0]} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">{selectedItem.brand}</p>
                                <p className="text-xs text-slate-500">仕入れ: ¥{selectedItem.costPrice.toLocaleString()}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSellSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売価格 (¥) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    value={sellForm.sellPrice}
                                    onChange={e => setSellForm({ ...sellForm, sellPrice: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売日 <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={sellForm.sellDate}
                                    onChange={e => setSellForm({ ...sellForm, sellDate: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                />
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
                                        placeholder="例: メルカリ10%"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">メモ</label>
                                <textarea
                                    value={sellForm.note}
                                    onChange={e => setSellForm({ ...sellForm, note: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                                />
                            </div>

                            {sellForm.sellPrice && (
                                <div className="bg-indigo-50 p-3 rounded-lg text-center mt-2">
                                    <p className="text-xs text-indigo-600 font-bold uppercase mb-1">予想利益</p>
                                    <p className="text-xl font-bold text-indigo-700">
                                        ¥{(Number(sellForm.sellPrice) - selectedItem.costPrice - Number(sellForm.shippingCost || 0) - Number(sellForm.platformFee || 0)).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsSellModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingSell}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submittingSell ? '処理中...' : '確定する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
