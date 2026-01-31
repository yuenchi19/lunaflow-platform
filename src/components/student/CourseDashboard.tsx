"use client";

import { useState, useEffect } from "react";
import { getTargetDates, saveTargetDate, MOCK_USERS } from "@/lib/data";
import { storage } from "@/app/lib/storage";
import { Category, Block, Course, User } from "@/types";
import { Calendar, BookOpen, MessageSquare, PlayCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CourseDashboardProps {
    courseId: string;
}


export default function CourseDashboard({ courseId }: CourseDashboardProps) {
    const [activeTab, setActiveTab] = useState<'course' | 'plan' | 'feedback'>('course');
    const [course, setCourse] = useState<any | null>(null); // Use any for now or update Course type to include categories
    const [targetDates, setTargetDates] = useState<Record<string, string>>({});
    const [user] = useState<User>(MOCK_USERS[0]); // Mock student
    const [allProgress, setAllProgress] = useState<any[]>([]);
    const [completedBlockIds, setCompletedBlockIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                // Fetch Course
                const res = await fetch(`/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setErrorMsg(errData.error || `Error ${res.status}`);
                }

                // Fetch Targets
                const targetsRes = await fetch('/api/student/targets');
                if (targetsRes.ok) {
                    const targetsData = await targetsRes.json();
                    setTargetDates(targetsData);
                }

            } catch (e) {
                console.error("Failed to fetch course", e);
                setErrorMsg("Communication Error");
            } finally {
                setLoading(false);
            }
        };

        // Load progress
        if (typeof window !== 'undefined') {
            fetch('/api/student/progress')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAllProgress(data);
                        const completed = data
                            .filter((item: any) => item.status === 'completed')
                            .map((item: any) => item.blockId);
                        setCompletedBlockIds(completed);
                    }
                })
                .catch(err => console.error("Failed to fetch progress", err));
        }

        fetchCourseData();
    }, [courseId, user.id]);

    if (loading) return <div className="p-10 text-center text-slate-500 font-serif italic">Loading course...</div>;
    if (errorMsg) return <div className="p-10 text-center text-rose-500 font-bold">Error: {errorMsg}</div>;
    if (!course) return <div className="p-10 text-center text-slate-500 font-serif italic">Course not found (Unknown).</div>;

    // Check for unread feedback
    const hasUnreadFeedback = allProgress.some(p => !p.isFeedbackRead && p.feedbackResponse);

    useEffect(() => {
        if (activeTab === 'feedback' && hasUnreadFeedback) {
            // Optimistic update
            setAllProgress(prev => prev.map(p => ({ ...p, isFeedbackRead: true })));

            // API Call
            fetch('/api/student/progress/read', { method: 'POST' })
                .catch(err => console.error("Failed to mark read", err));
        }
    }, [activeTab, hasUnreadFeedback]);

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800">
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Link href="/student/dashboard" className="hover:text-rose-700 transition-colors">マイページ</Link>
                    <span>/</span>
                    <span className="text-slate-600 font-bold">{course.title}</span>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                {/* Title and Tabs */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-serif font-bold text-slate-800">{course.title}</h1>

                    <div className="flex border-b border-slate-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('course')}
                            className={`px-8 py-3 text-sm font-bold transition-all relative flex-shrink-0 ${activeTab === 'course' ? "text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            コース
                            {activeTab === 'course' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`px-8 py-3 text-sm font-bold transition-all relative flex-shrink-0 ${activeTab === 'plan' ? "text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            学習計画
                            {activeTab === 'plan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('feedback')}
                            className={`px-8 py-3 text-sm font-bold transition-all relative flex-shrink-0 ${activeTab === 'feedback' ? "text-rose-700" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            感想履歴
                            {hasUnreadFeedback && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            )}
                            {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700" />}
                        </button>
                    </div>
                </div>

                {activeTab === 'course' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">


                        {/* Curriculum Section */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-serif font-bold text-slate-700">カリキュラム</h2>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                                {course.categories?.map((cat: any, idx: number) => {
                                    const catBlocks = cat.blocks || [];
                                    const isCatCompleted = catBlocks.length > 0 && catBlocks.every((b: any) => completedBlockIds.includes(b.id));

                                    // Category Locking Logic (Global Sequential)
                                    // Find the index of the first incomplete category
                                    const firstIncompleteIndex = course.categories.findIndex((c: any) => {
                                        const cBlocks = c.blocks || [];
                                        if (cBlocks.length === 0) return false; // Empty categories are "completed" for flow purposes
                                        return !cBlocks.every((b: any) => completedBlockIds.includes(b.id));
                                    });

                                    // If everything is complete (index -1), nothing is locked.
                                    // Otherwise, any category AFTER the first incomplete one is locked.
                                    // Also, strict sequential: current one is unlocked, next ones are locked.
                                    const isLocked = firstIncompleteIndex !== -1 && idx > firstIncompleteIndex;

                                    if (isLocked) {
                                        return (
                                            <div
                                                key={cat.id}
                                                className="block p-5 flex items-center justify-between bg-slate-50 cursor-not-allowed opacity-60 select-none grayscale"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm font-bold bg-slate-200 text-slate-400">
                                                        🔒
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-500">{cat.title}</h3>
                                                        <p className="text-xs text-slate-400 mt-0.5">前のカテゴリ全レッスン完了で解放</p>
                                                        <p className="text-[10px] text-slate-400">{catBlocks.length} レッスン</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] px-3 py-1 rounded-full font-bold border bg-slate-100 text-slate-400 border-slate-200">
                                                    未解禁
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            href={catBlocks.length > 0 ? `/student/course/${course.id}/categories/${cat.id}` : '#'}
                                            key={cat.id}
                                            className="block p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                            onClick={(e) => {
                                                if (catBlocks.length === 0) e.preventDefault();
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm font-bold transition-colors ${isCatCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                                                    {isCatCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-700 group-hover:text-rose-800 transition-colors">{cat.title}</h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">完了予定: {targetDates[cat.id] || "未設定"}</p>
                                                    <p className="text-[10px] text-slate-400">{catBlocks.length} レッスン</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${isCatCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                {isCatCompleted ? '完了' : '未完了'}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Banner Alert */}
                        {!Object.keys(targetDates).length && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-md flex items-center justify-between text-rose-800">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                    スケジュールを登録してください
                                </div>
                                <button className="text-rose-400 hover:text-rose-600"><Clock className="w-4 h-4" /></button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h2 className="text-2xl font-serif font-bold text-slate-800">あなたの学習計画</h2>
                            <p className="text-sm text-slate-500 italic">完了予定日を設定して学習計画を立てましょう。</p>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 shadow-lg p-8">
                            <div className="grid grid-cols-1 gap-6">
                                {course.categories?.map((cat: any, idx: number) => {
                                    const catBlocks = cat.blocks || [];
                                    const isCatCompleted = catBlocks.length > 0 && catBlocks.every((b: any) => completedBlockIds.includes(b.id));

                                    return (
                                        <div key={cat.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-50 hover:border-rose-100 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-slate-300 font-serif text-sm">{idx + 1}/{course.categories.length}</div>
                                                <div className="font-bold text-lg text-slate-700">{cat.title}</div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-tight ${isCatCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {isCatCompleted ? '完了' : '未完了'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">カテゴリ終了目安</span>
                                                    <span className="text-sm font-serif italic text-slate-500">
                                                        {(() => {
                                                            const dateStr = targetDates[cat.id];
                                                            if (!dateStr) return "未設定";
                                                            const target = new Date(dateStr);
                                                            const today = new Date();
                                                            target.setHours(0, 0, 0, 0);
                                                            today.setHours(0, 0, 0, 0);
                                                            const diffTime = target.getTime() - today.getTime();
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                            if (diffDays < 0) return `${Math.abs(diffDays)}日超過`;
                                                            if (diffDays === 0) return "今日まで";
                                                            return `あと ${diffDays} 日`;
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">あなたの完了予定日</span>
                                                    <div className="relative group/input">
                                                        <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-hover/input:text-rose-500 transition-colors pointer-events-none" />
                                                        <input
                                                            type="date"
                                                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all font-serif"
                                                            value={targetDates[cat.id] || ""}
                                                            onChange={(e) => {
                                                                const newDate = e.target.value;
                                                                setTargetDates(prev => ({ ...prev, [cat.id]: newDate })); // Optimistic update

                                                                fetch('/api/student/targets', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        categoryId: cat.id,
                                                                        targetDate: newDate
                                                                    })
                                                                }).catch(err => console.error("Failed to save target", err));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'feedback' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-serif font-bold text-slate-700">感想・フィードバック履歴</h2>
                        {allProgress.filter(p => p.feedbackContent).length === 0 ? (
                            <div className="p-12 bg-white rounded-xl border border-slate-100 shadow-sm text-center space-y-4">
                                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto" />
                                <h3 className="text-slate-400 font-serif italic">感想履歴はまだありません</h3>
                                <p className="text-xs text-slate-300">レッスンを受講して感想を提出すると、ここに履歴が表示されます。</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {allProgress.filter(p => p.feedbackContent).map((progress) => {
                                    // Find block title
                                    let blockTitle = "Unknown Lesson";
                                    course.categories?.forEach((c: any) => {
                                        const b = c.blocks?.find((blk: any) => blk.id === progress.blockId);
                                        if (b) blockTitle = b.title;
                                    });

                                    return (
                                        <div key={progress.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative">
                                            {/* Unread Badge for specific item if needed, but tab badge is main request */}
                                            {!progress.isFeedbackRead && progress.feedbackResponse && (
                                                <div className="absolute top-4 right-4 text-xs font-bold text-rose-600 animate-pulse">
                                                    NEW!
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">レッスン</span>
                                                        <h3 className="font-bold text-slate-700">{blockTitle}</h3>
                                                        <span className="text-[10px] text-slate-300 ml-auto">
                                                            {new Date(progress.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                                                        <p className="text-xs text-slate-400 font-bold mb-1">あなたの感想:</p>
                                                        {progress.feedbackContent}
                                                    </div>
                                                </div>
                                                <div className="flex-1 border-l border-slate-100 pl-0 md:pl-6 space-y-3">
                                                    {progress.feedbackResponse ? (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MessageSquare className="w-4 h-4 text-emerald-500" />
                                                                <h4 className="font-bold text-emerald-700 text-sm">フィードバック</h4>
                                                            </div>
                                                            <div className="bg-emerald-50/50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                                                                {progress.feedbackResponse}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-slate-300 text-sm italic">
                                                            フィードバック待ち...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

