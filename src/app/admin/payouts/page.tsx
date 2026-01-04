"use client";

import { useEffect, useState } from "react";
import { User } from "@/types";
import { Copy, Download, CreditCard, Search } from "lucide-react";

export default function PayoutsPage() {
    const [partners, setPartners] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch('/api/admin/payouts');
                if (res.ok) {
                    const data = await res.json();
                    setPartners(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPartners();
    }, []);

    const filteredPartners = partners.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("コピーしました");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">報酬支払管理</h1>
                    <p className="text-slate-500">パートナーへの報酬支払先情報を管理します。</p>
                </div>
                {/* Export Button (Placeholder) */}
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>CSVエクスポート</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="名前またはメールアドレスで検索..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">パートナー名</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">銀行情報</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm">口座名義 (カナ)</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-sm text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">読み込み中...</td>
                            </tr>
                        ) : filteredPartners.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">パートナーが見つかりません</td>
                            </tr>
                        ) : (
                            filteredPartners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{partner.name || "名称未設定"}</div>
                                        <div className="text-xs text-slate-500">{partner.email}</div>
                                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-mono">
                                            ID: {partner.affiliateCode || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {partner.bankName ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700">{partner.bankName}</span>
                                                    <span className="text-sm text-slate-500">{partner.bankBranch}</span>
                                                </div>
                                                <div className="text-sm text-slate-600 font-mono">
                                                    {partner.bankAccountType === 'current' ? '当座' : '普通'} : {partner.bankAccountNumber}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-amber-500 flex items-center gap-1">
                                                <CreditCard className="w-4 h-4" />
                                                未登録
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-slate-700">{partner.bankAccountHolder || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleCopy(`${partner.bankName} ${partner.bankBranch} ${partner.bankAccountType === 'current' ? '当座' : '普通'} ${partner.bankAccountNumber} ${partner.bankAccountHolder}`)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
                                            disabled={!partner.bankName}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            情報をコピー
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
