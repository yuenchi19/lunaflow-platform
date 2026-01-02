"use client";

import { useState, useEffect } from "react";
import { getBlocks, submitAssignment, getStudentProgressDetail, MOCK_BLOCKS, MOCK_USERS, MOCK_CATEGORIES } from "@/lib/data";
import { Block, User, Category, ProgressDetail } from "@/types";
import { PlayCircle, MessageSquare, Send, CheckCircle, ChevronRight, AlertCircle, RotateCcw, Clock } from "lucide-react";
import Link from "next/link";

interface LessonViewProps {
    courseId: string;
    blockId: string;
}

export default function LessonView({ courseId, blockId }: LessonViewProps) {
    const [block, setBlock] = useState<Block | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [user] = useState<User>(MOCK_USERS[0]);
    const [feedbackContent, setFeedbackContent] = useState("");
    const [currentProgress, setCurrentProgress] = useState<ProgressDetail | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const loadData = () => {
        const b = MOCK_BLOCKS.find(b => b.id === blockId);
        if (b) {
            setBlock(b);
            setCategory(MOCK_CATEGORIES.find(c => c.id === b.categoryId) || null);

            // Check progress
            const progress = getStudentProgressDetail(user.id);
            const entry = progress.find(p => p.blockId === blockId);
            setCurrentProgress(entry || null);
            if (entry && entry.feedbackContent) setFeedbackContent(entry.feedbackContent); // Show saved content/feedback
        }
    };

    useEffect(() => {
        loadData();
    }, [blockId, user.id]);

    const handleSubmit = async () => {
        if (!feedbackContent.trim() || !block) return;
        setIsSubmitting(true);
        submitAssignment(user.id, block.id, feedbackContent);

        // Simulate delay
        setTimeout(() => {
            setIsSubmitting(false);
            setShowSuccessToast(true);
            loadData();
            setTimeout(() => setShowSuccessToast(false), 3000);
        }, 800);
    };

    if (!block) return <div className="p-10 text-center font-serif italic">Loading lesson...</div>;

    const isApproved = currentProgress?.status === 'completed' || currentProgress?.feedbackStatus === 'completed';
    const isPending = currentProgress?.feedbackStatus === 'pending';
    const isRejected = false; // We don't have rejection logic in new AI flow yet, assuming always constructive or pending

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800">
            {/* Toast Notification (Image 4/5 style) */}
            {showSuccessToast && (
                <div className="fixed top-8 right-8 z-50 bg-[#DAF2E9] border border-[#B5E1D1] text-[#2D6A4F] px-6 py-3 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">感想を提出しました</span>
                    <button onClick={() => setShowSuccessToast(false)} className="ml-4 opacity-50 hover:opacity-100">×</button>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-slate-400">
                    <Link href={`/student/course/${courseId}`} className="hover:text-rose-700 transition-colors">テスト</Link>
                    <span>/</span>
                    <span className="text-slate-600 font-bold">{category?.title}</span>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-8 space-y-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-10 border-b border-slate-50 flex items-start gap-4">
                        <div className="bg-blue-500 p-2.5 rounded-full text-white shadow-lg">
                            <PlayCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif font-bold text-slate-800">{block.title}</h1>
                            <p className="text-slate-500 font-medium">{block.content}</p>
                        </div>
                    </div>

                    {/* Feedback Form / Area */}
                    <div className="p-10 bg-slate-50/30">
                        {isApproved ? (
                            <div className="space-y-8">
                                {block.type === 'video' && (
                                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={block.videoUrl}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                        <CheckCircle className="w-6 h-6" />
                                        <span>このステップは受講完了です！</span>
                                    </div>

                                    {(() => {
                                        const allBlocks = [...MOCK_BLOCKS].sort((a, b) => {
                                            const catA = MOCK_CATEGORIES.find(c => c.id === a.categoryId)!;
                                            const catB = MOCK_CATEGORIES.find(c => c.id === b.categoryId)!;
                                            if (catA.order !== catB.order) return catA.order - catB.order;
                                            return a.order - b.order;
                                        });
                                        const currentIndex = allBlocks.findIndex(b => b.id === block.id);
                                        const nextBlock = allBlocks[currentIndex + 1];

                                        if (nextBlock) {
                                            const isNextCat = nextBlock.categoryId !== block.categoryId;
                                            return (
                                                <Link
                                                    href={`/student/course/${courseId}/learn/${nextBlock.id}`}
                                                    className="bg-[#0047AB] text-white px-12 py-4 rounded-md font-bold text-lg hover:bg-[#003580] transition-all shadow-xl flex items-center gap-4 group"
                                                >
                                                    {isNextCat ? (
                                                        <>
                                                            <span>次のカテゴリへ進む</span>
                                                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>受講完了して次へ</span>
                                                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </Link>
                                            );
                                        } else {
                                            return (
                                                <Link
                                                    href={`/student/course/${courseId}`}
                                                    className="bg-emerald-600 text-white px-12 py-4 rounded-md font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2"
                                                >
                                                    全コース受講完了！一覧へ戻る
                                                </Link>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                    <span>感想 / 課題を提出しましょう</span>
                                </div>

                                <div className="relative">
                                    <div className="absolute -top-2.5 left-4 bg-[#FDFCFB] px-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                                        提出内容
                                    </div>
                                    <textarea
                                        className={`w-full h-40 bg-white border-2 p-6 rounded-lg text-slate-700 focus:outline-none transition-all resize-none shadow-inner ${isRejected ? "border-rose-200 focus:border-rose-400" : "border-rose-100 focus:border-rose-400"}`}
                                        placeholder="あとからご自身でもレッスンの振り返りができます。思い出すためのヒントとして感想を残しましょう！"
                                        value={feedbackContent}
                                        onChange={(e) => setFeedbackContent(e.target.value)}
                                        disabled={isPending}
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-300 font-bold">
                                        {feedbackContent.length}
                                    </div>
                                </div>

                                {isRejected && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-md flex items-start gap-3">
                                        <RotateCcw className="w-5 h-5 text-rose-600 mt-0.5" />
                                        <div className="space-y-1">
                                            <div className="font-bold text-rose-800 text-sm">再提出のお願い</div>
                                            <p className="text-rose-700 text-xs leading-relaxed">
                                                {"スタッフからのコメント"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isPending && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-md flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <div className="font-bold text-blue-800 text-sm">
                                            {block.feedbackType === 'ai' ? "AI講師が確認中です。フィードバックをお待ちください。" : "スタッフが確認中です。承認されるまでお待ちください。"}
                                        </div>
                                    </div>
                                )}

                                {!isPending && (
                                    <div className="flex flex-col items-center gap-4">
                                        <p className="text-[10px] text-rose-500 font-bold">感想を入力してください</p>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!feedbackContent.trim() || isSubmitting}
                                            className="bg-slate-300 text-slate-500 hover:bg-rose-700 hover:text-white disabled:bg-slate-200 disabled:text-slate-400 px-12 py-3 rounded-md font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                                        >
                                            {isSubmitting ? "送信中..." : "感想を提出する"}
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
