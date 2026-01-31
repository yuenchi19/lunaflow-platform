"use client";

import { useState, useEffect } from "react";
import { getBlocks, submitAssignment, getStudentProgressDetail, MOCK_BLOCKS, MOCK_USERS, MOCK_CATEGORIES } from "@/lib/data";
import { Block, User, Category, ProgressDetail } from "@/types";
import { PlayCircle, MessageSquare, Send, CheckCircle, ChevronRight, AlertCircle, RotateCcw, Clock } from "lucide-react";
import { storage } from "@/app/lib/storage"; // Added import
import Link from "next/link";

interface LessonViewProps {
    courseId: string;
    blockId: string;
}

export default function LessonView({ courseId, blockId }: LessonViewProps) {
    const [block, setBlock] = useState<Block | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [parsedContent, setParsedContent] = useState<any>({});
    const [user] = useState<User>(MOCK_USERS[0]);
    const [feedbackContent, setFeedbackContent] = useState("");
    const [currentProgress, setCurrentProgress] = useState<ProgressDetail | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [nav, setNav] = useState<{ next: string | null, prev: string | null, nextCategoryId?: string | null }>({ next: null, prev: null });

    const loadData = async () => {
        let fetchedBlock: Block | null = null;
        let fetchedCategory: Category | null = null;

        try {
            const res = await fetch(`/api/courses/${courseId}/learn/${blockId}`);
            if (res.ok) {
                const data = await res.json();
                fetchedBlock = data.block;
                fetchedCategory = data.category;
                setBlock(data.block);
                setCategory(data.category);
                setNav({ next: data.nextBlockId, prev: data.prevBlockId, nextCategoryId: data.nextBlockCategoryId });

                // Parse content if it's JSON
                if (data.block && data.block.content) {
                    try {
                        const parsed = typeof data.block.content === 'string'
                            ? JSON.parse(data.block.content)
                            : data.block.content;
                        setParsedContent(parsed);
                    } catch (e) {
                        // Fallback if not JSON
                        setParsedContent({ body: data.block.content });
                    }
                }
            }

            // Fetch progress
            const progressRes = await fetch('/api/student/progress');
            if (progressRes.ok) {
                const progressList = await progressRes.json();
                if (Array.isArray(progressList)) {
                    const entry = progressList.find((p: any) => p.blockId === blockId);
                    if (entry) {
                        setCurrentProgress({
                            blockId: entry.blockId,
                            status: entry.status,
                            feedbackStatus: entry.feedbackStatus || 'pending',
                            completedAt: entry.completedAt,
                            feedbackContent: entry.feedbackContent,
                            userId: user.id,
                            createdAt: entry.createdAt,
                            updatedAt: entry.updatedAt,
                            courseId: courseId,
                            courseTitle: 'Course',
                            categoryId: fetchedCategory?.id || category?.id || '',
                            categoryTitle: fetchedCategory?.title || category?.title || '',
                            blockTitle: fetchedBlock?.title || block?.title || '',
                        });
                        if (entry.feedbackContent) setFeedbackContent(entry.feedbackContent);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load lesson data", e);
        }
    };

    useEffect(() => {
        loadData();
    }, [blockId, user.id]);

    const handleNext = () => {
        // Just navigate if not required to submit feedback or already completed
        // But we should mark as completed if not already
        if (!currentProgress || currentProgress.status !== 'completed') {
            handleSubmit('completed_no_feedback');
        }
        // Actually handleSubmit handles navigation? No, handleSubmit just submits.
        // We need logic to submit then navigate?
        // Let's make handleSubmit distinct from navigation.
    };

    const handleSubmit = async (overrideStatus?: string) => {
        if (!block) return;
        setIsSubmitting(true);

        const status = 'completed';
        const content = overrideStatus === 'completed_no_feedback' ? 'Completed without feedback' : feedbackContent;

        try {
            const res = await fetch('/api/student/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blockId: block.id,
                    status: status,
                    feedbackContent: content
                })
            });

            if (res.ok) {
                // Determine where to go
                if (nav.next) {
                    window.location.href = `/student/course/${courseId}/learn/${nav.next}`;
                } else {
                    window.location.href = `/student/course/${courseId}`;
                }
            } else {
                alert("送信に失敗しました。");
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました。");
            setIsSubmitting(false);
        }
    };

    if (!block) return <div className="p-10 text-center font-serif italic">Loading lesson...</div>;

    const isApproved = currentProgress?.status === 'completed' || currentProgress?.feedbackStatus === 'completed';
    const isPending = currentProgress?.feedbackStatus === 'pending' && currentProgress?.status !== 'completed';
    const isRejected = false;

    // Logic: If feedbackRequired is FALSE, we show the "Next" button immediately without blocking.
    // Logic: If feedbackRequired is TRUE, we show the Form and block "Next" until submitted/approved.

    // BUT user says: "If absent, proceed with button".
    // So if feedbackRequired is false, we just show a "Finished? Go Next" button that marks complete and moves on.

    const isFeedbackRequired = parsedContent.feedbackRequired === true;
    const feedbackTitle = parsedContent.feedbackTitle || "感想 / 課題を提出しましょう";

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800">
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-slate-400">
                    <Link href={`/student/course/${courseId}`} className="hover:text-rose-700 transition-colors">コースTOP</Link>
                    <span>/</span>
                    <span className="text-slate-600 font-bold">{category?.title}</span>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden pb-8">
                    {/* Lesson Header */}
                    <div className="p-8 md:p-12 border-b border-slate-50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-600 p-2 rounded-full text-white">
                                <PlayCircle className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">{block.title}</h1>
                        </div>

                        {/* Content Renders Here */}
                        <div className="prose prose-slate max-w-none">
                            {block.type === 'video' && parsedContent.url && (
                                <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-lg mb-8">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={parsedContent.url}
                                        title="Video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {(parsedContent.body) && (
                                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                                    {parsedContent.body}
                                </div>
                            )}

                            {/* If it was a quiz/survey etc, render specific UI here in future */}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="px-8 md:px-12 pt-8">
                        {/* CASE 1: Feedback Required */}
                        {isFeedbackRequired && (
                            <div className="max-w-3xl mx-auto space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                {isApproved ? (
                                    <div className="text-center space-y-4 py-4">
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-lg">
                                            <CheckCircle className="w-6 h-6" />
                                            <span>提出済み・完了</span>
                                        </div>
                                        {/* Next Button */}
                                        <div className="flex justify-center pt-4">
                                            {(() => {
                                                if (nav.next) {
                                                    const isNextCat = nav.nextCategoryId && nav.nextCategoryId !== block.categoryId;
                                                    return (
                                                        <Link
                                                            href={`/student/course/${courseId}/learn/${nav.next}`}
                                                            className="bg-[#0047AB] text-white px-8 py-3 rounded-md font-bold hover:bg-[#003580] transition-all flex items-center gap-2"
                                                        >
                                                            {isNextCat ? "次のカテゴリへ" : "次のレッスンへ"}
                                                            <ChevronRight className="w-5 h-5" />
                                                        </Link>
                                                    );
                                                } else {
                                                    return (
                                                        <Link
                                                            href={`/student/course/${courseId}`}
                                                            className="bg-emerald-600 text-white px-8 py-3 rounded-md font-bold hover:bg-emerald-700 transition-all"
                                                        >
                                                            コース完了！一覧へ
                                                        </Link>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                            <span>{feedbackTitle}</span>
                                        </div>
                                        <textarea
                                            className="w-full h-32 bg-white border border-slate-300 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="ここに回答・感想を入力してください..."
                                            value={feedbackContent}
                                            onChange={(e) => setFeedbackContent(e.target.value)}
                                            disabled={isPending}
                                        />
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleSubmit()}
                                                disabled={!feedbackContent.trim() || isSubmitting}
                                                className="bg-rose-600 text-white px-10 py-3 rounded-md font-bold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                                            >
                                                {isSubmitting ? "送信中..." : "提出して次へ"}
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* CASE 2: Feedback NOT Required - Just Show Next Button */}
                        {!isFeedbackRequired && (
                            <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <p className="text-slate-500 text-sm font-bold">このレッスンの学習は完了です</p>
                                <button
                                    onClick={() => handleSubmit('completed_no_feedback')} // This function handles navigation now
                                    disabled={isSubmitting}
                                    className="bg-[#0047AB] text-white px-12 py-4 rounded-md font-bold text-lg hover:bg-[#003580] transition-all shadow-xl flex items-center gap-2 hover:scale-105"
                                >
                                    {isSubmitting ? "処理中..." : "理解して次へ"}
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
