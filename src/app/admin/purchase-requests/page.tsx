"use client";

import { useState, useEffect } from "react";
import { Download, Search, Filter, CheckCircle, Clock } from "lucide-react";

type PurchaseRequest = {
    id: string;
    email: string;
    name: string;
    postalCode: string;
    prefecture: string;
    address: string;
    phone: string;
    plan: string;
    amount: string;
    carrier: string;
    payment: string;
    note: string;
    status: "pending" | "completed";
    date: string;
};

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
        const updatedRequests = requests.map(req =>
            req.id === id ? { ...req, status: req.status === "pending" ? "completed" : "pending" as "pending" | "completed" } : req
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
