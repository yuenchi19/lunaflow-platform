import { getArticle } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function ManualDetailPage({ params }: { params: { id: string } }) {
    const article = getArticle(params.id);

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <Link
                    href="/student/manuals"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    一覧に戻る
                </Link>

                <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                                <Tag className="w-3 h-3" />
                                {article.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {article.publishedAt}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                            {article.title}
                        </h1>
                    </div>

                    <div className="p-8 prose prose-slate max-w-none">
                        {/* 
                           In a real app, this would be a Markdown renderer or Rich Text.
                           For now, we simply display the content with whitespace preservation.
                        */}
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {article.content}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}
