"use client";

import { useState, useEffect } from "react";
import { Download, Search, Filter, CheckCircle, Clock } from "lucide-react";

import { getUsers, updateUser, savePayment } from "@/lib/data";
import { PurchaseRequest, Payment } from "@/types";

export default function PurchaseRequestsPage() {
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const storedRequests = localStorage.getItem("mock_purchase_requests");
        if (storedRequests) {
            setRequests(JSON.parse(storedRequests));
        }
    }, []);

    const toggleStatus = (id: string) => {
        const targetReq = requests.find(r => r.id === id);
        if (!targetReq) return;

        const newStatus = targetReq.status === "pending" ? "completed" : "pending";

        // Logic: specific automation when marking as Completed
        if (newStatus === 'completed') {
            const confirmed = confirm("このリクエストを完了にしますか？\n完了にすると、該当する受講生の「おまかせ仕入れ」実績に加算されます。");
            if (!confirmed) return;

            // Find user
            const users = getUsers();
            const user = users.find(u => u.email === targetReq.email); // Match by Email for now

            if (user) {
                // Parse amount (remove "円" or commas if any, though existing mock might be string "30000")
                const amountVal = typeof targetReq.amount === 'string'
                    ? parseInt((targetReq.amount as string).replace(/[^0-9]/g, ''))
                    : targetReq.amount;

                if (!isNaN(amountVal)) {
                    // 1. Update User Total
                    const newTotal = (user.lifetimePurchaseTotal || 0) + amountVal;
                    updateUser({ ...user, lifetimePurchaseTotal: newTotal });

                    // 2. Add Payment Record
                    const newPayment: Payment = {
                        id: `pay_req_${targetReq.id}_${Date.now()}`,
                        userId: user.id,
                        date: new Date().toISOString().split('T')[0],
                        amount: amountVal,
                        method: 'other', // Purchase Request
                        status: 'succeeded'
                    };
                    savePayment(newPayment);
                    alert(`${user.name}様の仕入れ実績に ${amountVal.toLocaleString()}円 を反映しました。`);
                }
            } else {
                alert("該当するメールアドレスの受講生が見つかりませんでした。実績への反映はスキップされました。");
            }
        }

        const updatedRequests = requests.map(req =>
            req.id === id ? { ...req, status: newStatus as "pending" | "completed" } : req
        );
        setRequests(updatedRequests);
        localStorage.setItem("mock_purchase_requests", JSON.stringify(updatedRequests));
    };

    const filteredRequests = requests.filter(req =>
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                        {req.date}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-sm">{req.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{req.plan}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 text-sm">{req.amount}円</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{req.payment}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 max-w-xs">
                                        <div className="font-mono text-xs text-slate-400 mb-0.5">{req.postalCode}</div>
                                        <div className="line-clamp-2" title={req.prefecture + req.address}>
                                            {req.prefecture}{req.address}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">{req.email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {req.carrier}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={req.note}>
                                        {req.note || "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(req.id)}
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
