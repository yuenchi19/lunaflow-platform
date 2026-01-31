"use client";

import { useParams } from "next/navigation";
import { getBlocks, getCategories, MOCK_COURSES } from "@/lib/data";
import Link from "next/link";
import { CheckCircle, PlayCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CategoryDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    const categoryId = params.categoryId as string;

    const [course, setCourse] = useState<any | null>(null);
    const [category, setCategory] = useState<any | null>(null);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [completedBlockIds, setCompletedBlockIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Course Data (including categories and blocks)
                const courseRes = await fetch(`/api/courses/${courseId}`);
                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);

                    const foundCat = courseData.categories?.find((c: any) => c.id === categoryId);
                    setCategory(foundCat || null);
                    setBlocks(foundCat?.blocks || []);
                }

                // Fetch Progress
                const progressRes = await fetch('/api/student/progress');
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    if (Array.isArray(progressData)) {
                        const completed = progressData
                            .filter((item: any) => item.status === 'completed')
                            .map((item: any) => item.blockId);
                        setCompletedBlockIds(completed);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId && categoryId) {
            fetchData();
        }
    }, [courseId, categoryId]);

    if (loading) return <div className="p-10 text-center text-slate-500 font-serif italic">Loading...</div>;
    if (!course || !category) {
        return <div className="p-10 text-center text-slate-500">category/course not found.</div>;
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Link href="/student/dashboard" className="hover:text-rose-700 transition-colors">マイページ</Link>
                    <span>/</span>
                    <Link href={`/student/course/${courseId}`} className="hover:text-rose-700 transition-colors">{course.title}</Link>
                    <span>/</span>
                    <span className="text-slate-600 font-bold">{category.title}</span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <Link href={`/student/course/${courseId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-rose-700 mb-6 font-bold">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    コーストップに戻る
                </Link>

                <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">{category.title}</h1>
                <p className="text-slate-500 mb-8 text-sm">以下のレッスンを進めてください。</p>

                <div className="space-y-4">
                    {blocks.map((block, idx) => {
                        const isCompleted = completedBlockIds.includes(block.id);

                        return (
                            <Link
                                href={`/student/course/${courseId}/learn/${block.id}`}
                                key={block.id}
                                className="block bg-white rounded-xl border border-slate-200 p-5 hover:bg-slate-50 transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                                            {isCompleted ? <CheckCircle className="w-6 h-6" /> : <PlayCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-700 group-hover:text-rose-700 transition-colors">{block.title}</h3>
                                            <p className="text-xs text-slate-400 mt-1">{block.type === 'video' ? '動画レッスン' : 'テキスト/クイズ'}</p>
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            完了済み
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
