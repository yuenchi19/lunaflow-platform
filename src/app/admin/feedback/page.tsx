"use client";

import { useState, useEffect } from "react";
import { getFeedbacks, updateFeedbackStatus, MOCK_USERS, MOCK_BLOCKS } from "@/lib/data";
import { Feedback, User, Block } from "@/types";
import { CheckCircle, XCircle, Clock, Search, Filter, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [staffComment, setStaffComment] = useState("");
    const [filterStatus, setFilterStatus] = useState<Feedback['status'] | 'all'>('all');

    const loadData = () => {
        setFeedbacks(getFeedbacks());
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = (status: Feedback['status']) => {
        if (!selectedFeedback) return;
        updateFeedbackStatus(selectedFeedback.id, status, staffComment);
        setFeedbacks(getFeedbacks());
        setSelectedFeedback(null);
        setStaffComment("");
    };

    const getBlockTitle = (id: string) => MOCK_BLOCKS.find(b => b.id === id)?.title || "Unknown Block";
    const getUserName = (id: string) => MOCK_USERS.find(u => u.id === id)?.name || "Unknown User";

    const filtered = feedbacks.filter(f => filterStatus === 'all' || f.status === filterStatus).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 text-slate-700">
            <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold mb-2">感想・フィードバック管理</h1>
                    <p className="text-slate-500 italic">受講生から提出された感想をレビューして、受講完了の承認や差し戻しを行います。</p>
                </div>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterStatus === s ? "bg-slate-800 text-white border-slate-800 shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"}`}
                        >
                            {s === 'all' ? "すべて" : s === 'pending' ? "未処理" : s === 'approved' ? "承認済み" : "差し戻し中"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    {filtered.length === 0 ? (
                        <div className="p-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-300 italic font-serif">
                            該当するデータが見つかりませんでした
                        </div>
                    ) : (
                        filtered.map(f => (
                            <div
                                key={f.id}
                                onClick={() => setSelectedFeedback(f)}
                                className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white group ${selectedFeedback?.id === f.id ? "border-rose-300 shadow-xl" : "border-slate-50 shadow-sm hover:border-slate-200 hover:shadow-md"}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 font-serif">
                                            {getUserName(f.userId)[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{getUserName(f.userId)}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{getBlockTitle(f.blockId)}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${f.status === 'approved' ? "bg-emerald-50 text-emerald-600" : f.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                                        {f.status}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 italic leading-relaxed">
                                    "{f.content}"
                                </p>
                                <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                    <span>提出: {new Date(f.submittedAt).toLocaleString()}</span>
                                    <div className="flex items-center gap-1 group-hover:text-rose-700 transition-colors">
                                        詳細を確認 <Search className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail/Review Area */}
                <div className="md:col-span-1">
                    <div className="sticky top-8 space-y-4">
                        {selectedFeedback ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="p-6 bg-slate-800 text-white">
                                    <h3 className="font-bold font-serif">フィードバック詳細</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">提出内容</div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed font-serif italic border border-slate-100">
                                            {selectedFeedback.content}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">スタッフコメント (差し戻し時)</div>
                                        <textarea
                                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                                            placeholder="差し戻す場合はその理由を入力してください..."
                                            value={staffComment}
                                            onChange={(e) => setStaffComment(e.target.value)}
                                        />

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleAction('approved')}
                                                className="w-full bg-emerald-600 text-white py-3 rounded-md font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                            >
                                                <CheckCircle className="w-4 h-4" /> 承認する
                                            </button>
                                            <button
                                                onClick={() => handleAction('rejected')}
                                                disabled={!staffComment.trim()}
                                                className="w-full bg-rose-700 text-white py-3 rounded-md font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" /> 差し戻す
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-serif italic text-sm">左側のリストから確認したいフィードバックを選択してください</p>
                            </div>
                        )}

                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3">
                            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1">
                                <Filter className="w-3 h-3" /> 学習ペース通知 (プロトタイプ)
                            </h4>
                            <p className="text-[10px] text-rose-700 leading-relaxed">
                                田中健太さんの学習ペースが目標を上回っています。特典（シークレット動画など）の付与を検討してください。
                            </p>
                            <Link href="/admin/students/s1" className="block text-[10px] font-bold text-rose-900 underline">
                                受講生詳細を確認
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
