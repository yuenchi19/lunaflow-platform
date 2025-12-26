"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Article {
    id: string;
    title: string;
    category: string;
    author: string;
    status: 'published' | 'draft';
    date: string;
    content?: string;
}

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([
        { id: 'a1', title: '効率的な学習のための5つのヒント', category: '学習・教育', author: '山田 太郎', status: 'published', date: '2023-12-15' },
        { id: 'a2', title: 'コースのアップデート情報', category: 'ニュース', author: '佐藤 花子', status: 'draft', date: '2023-12-20' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Partial<Article>>({});

    const handleCreateClick = () => {
        setEditingArticle({ title: '', category: 'ニュース', status: 'draft', content: '', author: '管理者' });
        setIsModalOpen(true);
    };

    const handleEditClick = (article: Article) => {
        setEditingArticle({ ...article });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingArticle.title) {
            alert('タイトルは必須です');
            return;
        }

        if (editingArticle.id) {
            setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...editingArticle } as Article : a));
        } else {
            const newArticle: Article = {
                id: `a${Date.now()}`,
                title: editingArticle.title || '',
                category: editingArticle.category || 'ニュース',
                author: editingArticle.author || '管理者',
                status: editingArticle.status || 'draft',
                date: new Date().toISOString().split('T')[0],
                content: editingArticle.content || ''
            };
            setArticles(prev => [newArticle, ...prev]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / 記事管理
                    </div>
                    <h1 className={styles.title}>記事管理</h1>
                </div>
                <button className={styles.addBtn} onClick={handleCreateClick}>
                    ＋ 記事を作成
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>タイトル</th>
                            <th>カテゴリ</th>
                            <th>作成者</th>
                            <th>ステータス</th>
                            <th>公開日/更新日</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map(article => (
                            <tr key={article.id}>
                                <td className={styles.articleTitle}>{article.title}</td>
                                <td>{article.category}</td>
                                <td>{article.author}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[article.status]}`}>
                                        {article.status === 'published' ? '公開中' : '下書き'}
                                    </span>
                                </td>
                                <td>{article.date}</td>
                                <td className={styles.actions}>
                                    <button className={styles.editBtn} onClick={() => handleEditClick(article)}>編集</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 flex-none">{editingArticle.id ? '記事を編集' : '新しい記事を作成'}</h2>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">タイトル</label>
                                <input
                                    type="text"
                                    value={editingArticle.title || ''}
                                    onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="記事のタイトルを入力"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">カテゴリ</label>
                                    <select
                                        value={editingArticle.category || 'ニュース'}
                                        onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 outline-none"
                                    >
                                        <option value="ニュース">ニュース</option>
                                        <option value="学習・教育">学習・教育</option>
                                        <option value="インタビュー">インタビュー</option>
                                        <option value="その他">その他</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ステータス</label>
                                    <select
                                        value={editingArticle.status || 'draft'}
                                        onChange={e => setEditingArticle({ ...editingArticle, status: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 outline-none"
                                    >
                                        <option value="draft">下書き</option>
                                        <option value="published">公開する</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">アイキャッチ画像 (URL)</label>
                                <input
                                    type="text"
                                    value={editingArticle.content?.match(/!\[image\]\((.*?)\)/)?.[1] || ''}
                                    onChange={() => alert("画像アップロード機能はMockです。")}
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none bg-slate-100"
                                    placeholder="画像URL (Mock)"
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">記事本文 (Markdown)</label>
                                <textarea
                                    value={editingArticle.content || ''}
                                    onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 h-64 outline-none focus:ring-2 focus:ring-slate-300 font-mono text-sm"
                                    placeholder="# 見出し&#13;&#10;ここに記事の本文を入力します..."
                                />
                            </div>
                        </div>

                        <div className="flex-none flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-700 shadow-sm"
                            >
                                保存する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
