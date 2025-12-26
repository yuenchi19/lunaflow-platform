import { Metadata } from 'next';
import Link from 'next/link';
import { Book, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { getArticles } from '@/lib/data';

export const metadata: Metadata = {
    title: 'マニュアル・記事一覧 | LunaFlow',
};

export default function StudentManualsPage() {
    const articles = getArticles();

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Book className="text-indigo-600" />
                        マニュアル・記事一覧
                    </h1>
                    <p className="text-slate-500 mt-2">
                        LunaFlowの使い方や、学習に役立つ記事をまとめています。
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid gap-4">
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/student/manuals/${article.id}`}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${article.category === 'マニュアル' ? 'bg-indigo-100 text-indigo-700' :
                                                article.category === 'サポート' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {article.category}
                                        </span>
                                        <span className="text-xs text-slate-400">{article.publishedAt}</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {article.title}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                        {article.content}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors mt-2" />
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
