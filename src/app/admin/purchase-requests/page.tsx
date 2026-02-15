"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Search, CheckCircle, Clock, FileText, Upload } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";

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
    carrier: string | null;
    scheduledDate: string | null;
    user: {
        name: string | null;
        email: string;
        zipCode: string | null;
        address: string | null;
    };
    inventoryItems?: {
        id: string;
        name: string | null;
        costPrice: number;
        brand: string;
    }[];
}

export default function PurchaseRequestsPage() {
    const [requests, setRequests] = useState<AdminPurchaseRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

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

    const [selectedRequest, setSelectedRequest] = useState<AdminPurchaseRequest | null>(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.split('\n');
        const updates: any[] = [];

        // Simple CSV Parser
        // Expected format: ID,TrackingNumber,Status(optional)
        // Check for header
        const startIndex = lines[0].toLowerCase().includes('id') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Handle quotes if necessary, but assuming simple CSV for now
            const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            const [id, tracking, status] = parts;

            if (id) {
                updates.push({
                    id,
                    trackingNumber: tracking || undefined,
                    status: status || 'completed' // Default to completed if imported with tracking
                });
            }
        }

        if (updates.length === 0) {
            showToast("有効なデータが見つかりませんでした。", 'error');
            return;
        }

        if (!confirm(`${updates.length}件のデータを一括更新しますか？`)) {
            e.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/purchase-requests/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`${data.processed}件の更新が完了しました。`, 'success');
                if (data.errors && data.errors.length > 0) {
                    console.error("Bulk update errors:", data.errors);
                    alert(`${data.errors.length}件のエラーが発生しました。コンソールを確認してください。`);
                }
                fetchRequests();
            } else {
                showToast(`エラー: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error("Bulk import error:", error);
            showToast("通信エラーが発生しました。", 'error');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const openCompleteModal = (req: AdminPurchaseRequest) => {
        setSelectedRequest(req);
        setTrackingNumber("");
        setIsModalOpen(true);
    };

    const handleComplete = async () => {
        if (!selectedRequest) return;
        if (!trackingNumber) {
            alert("追跡番号を入力してください。");
            return;
        }

        try {
            const res = await fetch(`/api/admin/purchase-requests/${selectedRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed', trackingNumber }),
            });

            if (res.ok) {
                fetchRequests();
                showToast("完了ステータスに更新し、追跡番号を保存しました。", 'success');
                setIsModalOpen(false);
            } else {
                showToast("更新に失敗しました。", 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("通信エラーが発生しました。", 'error');
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        if (currentStatus === 'completed') {
            // Revert to pending
            const confirmed = confirm("未完了に戻しますか？");
            if (!confirmed) return;

            try {
                const res = await fetch(`/api/admin/purchase-requests/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'pending' }),
                });
                if (res.ok) fetchRequests();
            } catch (e) {
                console.error(e);
            }
            return;
        }

        // If pending -> completed, use Modal
        // Find existing req object (optimization: pass entire obj)
        const req = requests.find(r => r.id === id);
        if (req) openCompleteModal(req);
    };

    const filteredRequests = requests.filter(req => {
        const name = req.user?.name || "未設定";
        const email = req.user?.email || "未設定";
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
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4" />
                        <span>CSV一括更新</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".csv"
                    />
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
                                <td colSpan={8} className="p-0">
                                    <EmptyState
                                        title="リクエストはまだありません"
                                        description="受講生からの仕入れリクエストが届くとここに表示されます。"
                                        icon={FileText}
                                        className="m-8"
                                    />
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((req) => (
                                <PurchaseRequestRow key={req.id} req={req} toggleStatus={toggleStatus} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tracking Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">発送情報の入力</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {selectedRequest.user.name} 様への商品を発送し、完了にします。
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    追跡番号 (必須)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                    placeholder="1234-5678-9012"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    ※ 追跡番号を入力すると受講生に通知されます（今回はデータ保存のみ）。
                                </p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-lg"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={!trackingNumber}
                                className="px-6 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-200"
                            >
                                完了にする
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PurchaseRequestRow({ req, toggleStatus }: { req: AdminPurchaseRequest, toggleStatus: (id: string, s: string) => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr className={`hover:bg-slate-50 transition-colors ${expanded ? 'bg-slate-50' : ''}`}>
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
                    <div className="text-xs text-slate-500 mt-0.5">請求書払い</div>
                </td>
                <td className="p-4 text-sm text-slate-600">
                    <div className="font-mono text-xs text-slate-400 mb-0.5">{req.user?.zipCode || "-"}</div>
                    <div className="whitespace-pre-wrap mb-1" title={(req.user?.address || "")}>
                        {req.user?.address || "-"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                        <span>✉️</span> {req.user?.email}
                    </div>
                </td>
                <td className="p-4 text-sm text-slate-600">
                    {req.carrier === 'jp' ? "日本郵便" :
                        req.carrier === 'ym' ? "ヤマト運輸" :
                            req.carrier === 'sg' ? "佐川急便" :
                                req.carrier || "-"}
                </td>
                <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={req.note || ""}>
                    {req.note || "-"}
                </td>
                <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            {expanded ? '詳細を閉じる' : '詳細'}
                        </button>
                        <button
                            onClick={() => toggleStatus(req.id, req.status)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${req.status === 'pending'
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            {req.status === 'pending' ? '完了にする' : '未完了に戻す'}
                        </button>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50">
                    <td colSpan={8} className="p-4 pl-12">
                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                            <h4 className="font-bold text-sm text-slate-700 mb-2">購入商品詳細</h4>
                            <div className="text-xs text-slate-500 mb-2">
                                ※仕入れ希望金額内訳: {(req.amount).toLocaleString()}円 (おまかせ) + ストア購入分
                            </div>
                            {req.inventoryItems && req.inventoryItems.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-slate-400">
                                            <th className="py-2">商品名</th>
                                            <th className="py-2">ブランド</th>
                                            <th className="py-2 text-right">単価(Cost)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {req.inventoryItems.map((item: any) => (
                                            <tr key={item.id} className="border-b border-slate-50">
                                                <td className="py-2">{item.name}</td>
                                                <td className="py-2">{item.brand}</td>
                                                <td className="py-2 text-right">{item.costPrice.toLocaleString()}円</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-slate-400 italic">商品詳細情報がありません（おまかせのみ、または未割り当て）</p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
