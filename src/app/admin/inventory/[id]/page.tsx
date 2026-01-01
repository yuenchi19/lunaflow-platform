"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";

interface InventoryItem {
    id: string;
    brand: string;
    name?: string;
    category?: string;
    costPrice: number;
    sellingPrice?: number;
    images: string[];
    damageImages: string[];
    condition?: string;
    hasAccessories: boolean;
    accessories: string[];
    note?: string;
    status: string;
    assignedToUser?: { name: string; email: string };
    createdAt: string;
}

export default function AdminInventoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchItem(params.id as string);
        }
    }, [params.id]);

    const fetchItem = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/inventory/${id}`);
            if (res.ok) {
                const data = await res.json();
                setItem(data);
            } else {
                alert("商品が見つかりません");
                router.push('/admin/inventory');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">読み込み中...</div>;
    if (!item) return null;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                在庫一覧に戻る
            </button>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {item.category || "未分類"}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${item.status === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {item.status === 'IN_STOCK' ? '在庫あり' : item.status}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{item.brand} {item.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">ID: {item.id}</p>
                </div>
                {/* Future: Edit Button */}
                {/* <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    <Edit className="w-4 h-4" /> 編集
                </button> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Images Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-800 border-b pb-2">商品画像</h2>

                        {/* Main Images */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-500">メイン写真</span>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {item.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all group relative">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Damage Images */}
                        {item.damageImages.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-red-500">ダメージ・詳細写真</span>
                                <div className="grid grid-cols-4 gap-4">
                                    {item.damageImages.map((img, i) => (
                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-red-100 hover:shadow-md transition-all group relative">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="group">
                                    <th className="bg-slate-50 px-6 py-4 font-bold text-slate-500 w-1/3">コンディション</th>
                                    <td className="px-6 py-4 font-bold bg-white group-hover:bg-slate-50/50">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${['S', 'A'].includes(item.condition || '') ? 'bg-emerald-500' :
                                                ['B'].includes(item.condition || '') ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}>
                                            {item.condition || '-'}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="group">
                                    <th className="bg-slate-50 px-6 py-4 font-bold text-slate-500">付属品</th>
                                    <td className="px-6 py-4 bg-white group-hover:bg-slate-50/50">
                                        {item.hasAccessories ? (
                                            <div className="flex flex-wrap gap-2">
                                                {item.accessories.map(acc => (
                                                    <span key={acc} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                                                        {acc}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">なし</span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="group">
                                    <th className="bg-slate-50 px-6 py-4 font-bold text-slate-500">備考・メモ</th>
                                    <td className="px-6 py-4 bg-white group-hover:bg-slate-50/50 whitespace-pre-wrap text-slate-600">
                                        {item.note || '-'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Price Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">価格情報</h3>

                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs text-slate-400 mb-1">仕入れ単価 (Cost)</span>
                                <div className="text-xl font-mono font-bold text-slate-600">
                                    ¥{item.costPrice.toLocaleString()}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <span className="block text-xs text-indigo-500 mb-1 font-bold">顧客表示価格 (Selling Price)</span>
                                <div className="text-3xl font-mono font-bold text-slate-900">
                                    ¥{item.sellingPrice?.toLocaleString() || Math.floor(item.costPrice * 1.15).toLocaleString()}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 text-right">※ Cost + 15%</p>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">在庫状況 / 割当</h3>

                        {item.assignedToUser ? (
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                        {item.assignedToUser.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{item.assignedToUser.name}</div>
                                        <div className="text-xs text-slate-500">{item.assignedToUser.email}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-2 rounded-lg text-center">
                                    現在このユーザーに割り当てられています
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                割当なし (在庫)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
