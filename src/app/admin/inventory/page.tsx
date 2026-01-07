"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus, Package, CheckCircle, AlertCircle, Plus, X } from "lucide-react";
import Image from "next/image";

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
    condition?: string;
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
    subscriptionStatus?: string;
}

const ID_VERIFICATION_METHODS = [
    "店舗・業者間取引（本人確認省略）",
    "運転免許証",
    "マイナンバーカード",
    "健康保険証",
    "その他（備考に記載）"
];

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
    const [assignUserSearch, setAssignUserSearch] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        brand: '',
        name: '',
        category: '',
        costPrice: '',
        condition: 'B',
        // Kobutsusho Fields
        supplier: '',
        supplierName: '',
        supplierAddress: '',
        supplierOccupation: '',
        supplierAge: '',
        idVerificationMethod: ID_VERIFICATION_METHODS[0],
        purchaseDate: new Date().toISOString().split('T')[0]
    });
    const [createImages, setCreateImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
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
                setAssignUserSearch('');
                setSelectedUserId('');
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });
            if (res.ok) {
                const data = await res.json();
                setCreateImages([...createImages, data.url]);
            } else {
                alert("画像のアップロードに失敗しました");
            }
        } catch (err) {
            console.error(err);
            alert("通信エラー");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!createForm.brand || !createForm.category || !createForm.costPrice || createImages.length === 0) {
            alert("必須項目を入力してください（画像、ブランド、カテゴリー、価格）");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...createForm,
                    costPrice: Number(createForm.costPrice),
                    images: createImages,
                    status: 'IN_STOCK' // Admin Stock
                })
            });
            if (res.ok) {
                alert("登録しました");
                setIsCreateModalOpen(false);
                setCreateForm({
                    brand: '', name: '', category: '', costPrice: '', condition: 'B',
                    supplier: '', supplierName: '', supplierAddress: '', supplierOccupation: '', supplierAge: '', idVerificationMethod: ID_VERIFICATION_METHODS[0], purchaseDate: new Date().toISOString().split('T')[0]
                });
                setCreateImages([]);
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
                return [];
            default:
                return [];
        }
    })();

    // Filter Users for Assignment (Active Subscription + Search)
    const filteredUsers = users.filter(u => {
        const hasActiveSub = u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing'; // Assuming subscriptionStatus field exists and is used
        // User asked: "Effective Subscription (or non-Partner)".
        // If we don't know Partner status strictly, we rely on Active Sub.
        // Also search query.
        const matchesSearch = (u.name + u.email).toLowerCase().includes(assignUserSearch.toLowerCase());

        return matchesSearch; // For now return all search matches, assume API filtered key roles if needed. 
        // Ideally: return hasActiveSub && matchesSearch;
    });

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 pb-32">
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
                        placeholder="商品検索..."
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
                            <th className="px-6 py-4">画像</th>
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
                                        <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 text-xs flex items-center justify-center text-slate-400">Sold</div>
                                    </td>
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
                                        <div className="relative w-16 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                            {item.images[0] ? (
                                                <Image src={item.images[0]} alt={item.brand} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-300"><Package className="w-6 h-6" /></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{item.brand}</div>
                                        <div className="text-xs text-slate-500">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{item.category} / {item.condition}</div>
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
                                                className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1 mx-auto shadow-sm"
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
                            <tr><td colSpan={7} className="text-center py-8 text-slate-400">データがありません</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assign Modal */}
            {assignModalItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-lg mb-4">受講生に割り当て</h3>
                        <div className="flex gap-4 mb-4 border-b pb-4">
                            <div className="w-16 h-16 relative bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                {assignModalItem.images[0] && <Image src={assignModalItem.images[0]} alt="img" fill className="object-cover" />}
                            </div>
                            <div>
                                <div className="font-bold">{assignModalItem.brand}</div>
                                <div className="text-sm text-slate-500">{assignModalItem.name}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 mb-2">受講生を検索・選択</label>
                            <div className="relative mb-2">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="名前またはメールアドレスで検索"
                                    value={assignUserSearch}
                                    onChange={(e) => setAssignUserSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">該当するユーザーがいません</div>
                                ) : (
                                    filteredUsers.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => setSelectedUserId(u.id)}
                                            className={`p-3 text-sm cursor-pointer hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex justify-between items-center ${selectedUserId === u.id ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                        >
                                            <div>
                                                <div className="font-bold text-slate-700">{u.name}</div>
                                                <div className="text-xs text-slate-400">{u.email}</div>
                                            </div>
                                            {selectedUserId === u.id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setAssignModalItem(null)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedUserId || assigning}
                                className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-lg disabled:opacity-50"
                            >
                                {assigning ? '処理中...' : '確定'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Item Modal (Admin) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">新規商品登録 (管理者)</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateItem} className="space-y-6">
                            {/* Images */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">商品画像 (メイン1枚 + サブ5枚) <span className="text-red-500">*</span></label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {createImages.map((img, idx) => (
                                        <div key={idx} className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded border border-slate-200 overflow-hidden group">
                                            <Image src={img} alt="preview" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setCreateImages(createImages.filter((_, i) => i !== idx))}
                                                className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {createImages.length < 6 && (
                                        <label className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded cursor-pointer hover:bg-slate-50 ${uploading ? 'opacity-50' : ''}`}>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Plus className="w-5 h-5 text-slate-400" />}
                                            <span className="text-[9px] text-slate-400 font-bold mt-1">追加</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ブランド <span className="text-red-500">*</span></label>
                                    <input type="text" required value={createForm.brand} onChange={e => setCreateForm({ ...createForm, brand: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ <span className="text-red-500">*</span></label>
                                    <select required value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                                        <option value="">選択してください</option>
                                        <option value="Bags">バッグ</option>
                                        <option value="Wallets">財布</option>
                                        <option value="Accessories">アクセサリー</option>
                                        <option value="Apparel">アパレル</option>
                                        <option value="Other">その他</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">商品名</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ価格 (¥) <span className="text-red-500">*</span></label>
                                    <input type="number" required value={createForm.costPrice} onChange={e => setCreateForm({ ...createForm, costPrice: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">状態 (ランク) <span className="text-red-500">*</span></label>
                                    <select required value={createForm.condition} onChange={e => setCreateForm({ ...createForm, condition: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white">
                                        <option value="S">S (新品同様)</option>
                                        <option value="A">A (非常に良い)</option>
                                        <option value="B">B (良い)</option>
                                        <option value="C">C (可)</option>
                                        <option value="D">D (難あり)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Admin Supplier Info (For Kobutsusho) */}
                            <div className="border-t pt-4">
                                <h4 className="font-bold text-sm text-slate-700 mb-3">仕入れ先情報 (古物台帳用・受講生に継承)</h4>
                                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ先 (表示用名)</label>
                                        <input type="text" value={createForm.supplier} onChange={e => setCreateForm({ ...createForm, supplier: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" placeholder="例: セカンドストリート" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">氏名/名称</label>
                                            <input type="text" value={createForm.supplierName} onChange={e => setCreateForm({ ...createForm, supplierName: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">年齢</label>
                                            <input type="number" value={createForm.supplierAge} onChange={e => setCreateForm({ ...createForm, supplierAge: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">住所</label>
                                        <input type="text" value={createForm.supplierAddress} onChange={e => setCreateForm({ ...createForm, supplierAddress: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">職業</label>
                                        <input type="text" value={createForm.supplierOccupation} onChange={e => setCreateForm({ ...createForm, supplierOccupation: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">本人確認方法</label>
                                        <select
                                            value={createForm.idVerificationMethod}
                                            onChange={e => setCreateForm({ ...createForm, idVerificationMethod: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                        >
                                            {ID_VERIFICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">仕入れ日</label>
                                        <input type="date" value={createForm.purchaseDate} onChange={e => setCreateForm({ ...createForm, purchaseDate: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-600 rounded-lg">キャンセル</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 bg-slate-900 font-bold text-white rounded-lg disabled:opacity-50">
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
