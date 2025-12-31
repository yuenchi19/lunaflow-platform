"use client";

import { useState, useEffect } from "react";
import { Download, Search, CheckCircle, Clock } from "lucide-react";

interface AdminPurchaseRequest {
    id: string;
    userId: string;
    amount: number;
    plan: string;
    status: string;
    stripeInvoiceId: string | null;
    createdAt: string;
    updatedAt: string;
    note: string | null;
    scheduledDate: string | null;
    user: {
        name: string | null;
        email: string;
        zipCode: string | null;
        address: string | null;
    };
}

export default function PurchaseRequestsPage() {
    const [requests, setRequests] = useState<AdminPurchaseRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/purchase-requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else {
                console.error("Failed to fetch requests");
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "pending" ? "completed" : "pending";

        if (newStatus === 'completed') {
            const confirmed = confirm("このリクエストを完了にしますか？\n完了にすると、該当する受講生の「おまかせ仕入れ」実績に加算されます。");
            if (!confirmed) return;
        }

        try {
            const res = await fetch(`/api/admin/purchase-requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                // Optimistic update or refetch
                fetchRequests(); // Refetch to be sure, or map local
                if (newStatus === 'completed') {
                    alert("ステータスを更新しました。");
                }
            } else {
                alert("更新に失敗しました。");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("通信エラーが発生しました。");
        }
    };

    const filteredRequests = requests.filter(req => {
        if (!req.user) return false;
        const name = req.user.name || "";
        const email = req.user.email || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">読み込み中...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">仕入れ希望管理</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        受講生からの仕入れ購入希望一覧です。
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>CSVエクスポート</span>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="名前やメールで検索"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 w-64"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                            <th className="p-4 font-bold">ステータス</th>
                            <th className="p-4 font-bold">申込日時</th>
                            <th className="p-4 font-bold">名前 / プラン</th>
                            <th className="p-4 font-bold">希望金額 / 支払</th>
                            <th className="p-4 font-bold">連絡先 / 住所</th>
                            <th className="p-4 font-bold">配送業者</th>
                            <th className="p-4 font-bold">備考</th>
                            <th className="p-4 font-bold text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">
                                    リクエストはまだありません。
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {req.status === 'completed' ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    対応済
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-3 h-3" />
                                                    未対応
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {new Date(req.createdAt).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-sm">{req.user?.name || "未設定"}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{req.plan}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-sm">{req.amount.toLocaleString()}円</div>
                                        <div className="text-xs text-slate-500 mt-0.5">請求書払い</div>{/* Fixed as invoice for now */}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 max-w-xs">
                                        <div className="font-mono text-xs text-slate-400 mb-0.5">{req.user?.zipCode || "-"}</div>
                                        <div className="line-clamp-2" title={(req.user?.address || "")}>
                                            {req.user?.address || "-"}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">{req.user?.email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        - {/* Carrier not in DB yet */}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={req.note || ""}>
                                        {req.note || "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(req.id, req.status)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${req.status === 'pending'
                                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            {req.status === 'pending' ? '完了にする' : '未完了に戻す'}
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
