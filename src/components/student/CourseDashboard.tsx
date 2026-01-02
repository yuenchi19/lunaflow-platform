"use client";

import { useState, useEffect } from "react";
import { getCategories, getBlocks, getTargetDates, saveTargetDate, MOCK_COURSES, MOCK_USERS } from "@/lib/data";
import { storage } from "@/app/lib/storage"; // Added
import { Category, Block, Course, User } from "@/types";
import { Calendar, BookOpen, MessageSquare, PlayCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CourseDashboardProps {
    courseId: string;
}

export default function CourseDashboard({ courseId }: CourseDashboardProps) {
    const [activeTab, setActiveTab] = useState<'course' | 'plan' | 'feedback'>('course');
    const [course, setCourse] = useState<Course | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [targetDates, setTargetDates] = useState<Record<string, string>>({});
    const [user] = useState<User>(MOCK_USERS[0]); // Mock student
    const [completedBlockIds, setCompletedBlockIds] = useState<string[]>([]); // Added state

    useEffect(() => {
        const c = MOCK_COURSES.find(c => c.id === courseId);
        if (c) {
            setCourse(c);
            setCategories(getCategories(c.id));
        }
        setTargetDates(getTargetDates(user.id));
        // Load progress
        if (typeof window !== 'undefined') {
            fetch('/api/student/progress')
                .then(res => res.json())
                .then(data => {
                    // data is array of { blockId, status, ... }
                    if (Array.isArray(data)) {
                        const completed = data
                            .filter((item: any) => item.status === 'completed')
                            .map((item: any) => item.blockId);
                        setCompletedBlockIds(completed);
                    }
                })
                .catch(err => console.error("Failed to fetch progress", err));
        }
    }, [courseId, user.id]);

    if (!course) return <div className="p-10 text-center text-slate-500 font-serif italic">Loading course...</div>;

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
                            {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-700" />}
                        </button>
                    </div>
                </div>

                {activeTab === 'course' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Learning Progress Section (Image 1) */}
                        <section className="bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden flex flex-col md:flex-row">
                            <div className="w-full md:w-2/3 bg-slate-900 aspect-video flex items-center justify-center relative group">
                                <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all cursor-pointer" />
                                <div className="absolute bottom-4 left-4 text-white text-xs opacity-60">学習の進捗</div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-center items-start gap-4">
                                <p className="text-slate-600 leading-relaxed text-sm font-bold">
                                    {course.title}へようこそ！<br />まずは動画を確認して感想を記載して受講を開始してください。
                                </p>
                                <Link
                                    href={`/student/course/${course.id}/learn/b1`}
                                    className="bg-rose-600 text-white px-8 py-3 rounded-md font-bold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    感想を送ってスタート
                                </Link>
                            </div>
                        </section>
                        {/* Curriculum Section (Image 1) */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-serif font-bold text-slate-700">カリキュラム</h2>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                                {categories.map((cat, idx) => {
                                    // Calculate completion status for category
                                    // Since we don't have cat.blocks easily available here without fetching, let's fetch them or assume.
                                    // In real app, we should fetch blocks for cat. 
                                    // getCategories returns title/id/img.
                                    // getBlocks(cat.id) is imported from data.
                                    const catBlocks = getBlocks(cat.id);
                                    const isCatCompleted = catBlocks.length > 0 && catBlocks.every(b => completedBlockIds.includes(b.id));

                                    return (
                                        <Link
                                            href={`/student/course/${course.id}/categories/${cat.id}`}
                                            key={cat.id}
                                            className="block p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm font-bold transition-colors ${isCatCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                                                    {isCatCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-700 group-hover:text-rose-800 transition-colors">{cat.title}</h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">完了予定: {targetDates[cat.id] || "未設定"}</p>
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
                        {/* Banner Alert (Image 2) */}
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
                                {categories.map((cat, idx) => {
                                    const catBlocks = getBlocks(cat.id);
                                    const isCatCompleted = catBlocks.every(b => completedBlockIds.includes(b.id));

                                    return (
                                        <div key={cat.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-50 hover:border-rose-100 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-slate-300 font-serif text-sm">{idx + 1}/{categories.length}</div>
                                                <div className="font-bold text-lg text-slate-700">{cat.title}</div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-tight ${isCatCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                    {isCatCompleted ? '完了' : '未完了'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">カテゴリ終了目安</span>
                                                    <span className="text-sm font-serif italic text-slate-500">{idx === 0 ? "なし" : "1 時間"}</span>
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
                                                                saveTargetDate(user.id, cat.id, e.target.value);
                                                                setTargetDates(prev => ({ ...prev, [cat.id]: e.target.value }));
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
                    <div className="p-12 bg-white rounded-xl border border-slate-100 shadow-sm text-center space-y-4">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto" />
                        <h3 className="text-slate-400 font-serif italic">感想履歴はまだありません</h3>
                        <p className="text-xs text-slate-300">レッスンを受講して感想を提出すると、ここに履歴が表示されます。</p>
                    </div>
                )}
            </main>
        </div>
    );
}
