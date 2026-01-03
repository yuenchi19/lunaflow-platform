"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface NewsItem {
    id: string;
    title: string;
    target: 'all' | 'students' | 'staff';
    date: string;
    status: 'published' | 'draft';
    content?: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<NewsItem>>({});

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const res = await fetch('/api/admin/news');
            if (res.ok) {
                const data = await res.json();
                setNews(data);
            }
        } catch (error) {
            console.error("Failed to fetch news", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setEditingItem({ title: '', target: 'all', status: 'draft', content: '', date: new Date().toISOString().split('T')[0] });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: NewsItem) => {
        setEditingItem({ ...item });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingItem.title || !editingItem.date) {
            alert('タイトルと日付は必須です');
            return;
        }

        try {
            let res;
            if (editingItem.id) {
                // Update
                res = await fetch(`/api/admin/news/${editingItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingItem)
                });
            } else {
                // Create
                res = await fetch('/api/admin/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingItem)
                });
            }

            if (res.ok) {
                fetchNews(); // Refresh list
                setIsModalOpen(false);
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error("Save error", error);
            alert('エラーが発生しました');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('本当に削除してもよろしいですか？')) {
            try {
                const res = await fetch(`/api/admin/news/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setNews(prev => prev.filter(item => item.id !== id));
                    setIsModalOpen(false);
                } else {
                    alert('削除に失敗しました');
                }
            } catch (error) {
                console.error("Delete error", error);
                alert('エラーが発生しました');
            }
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / お知らせ管理
                    </div>
                    <h1 className={styles.title}>お知らせ管理</h1>
                </div>
                <button className={styles.addBtn} onClick={handleCreateClick}>
                    ＋ お知らせを作成
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>タイトル</th>
                            <th>配信対象</th>
                            <th>投稿日</th>
                            <th>ステータス</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {news.map(item => (
                            <tr key={item.id}>
                                <td className={styles.newsTitle}>{item.title}</td>
                                <td>
                                    <span className={styles.targetLabel}>
                                        {item.target === 'all' ? '全員' : item.target === 'students' ? '受講生' : 'スタッフ'}
                                    </span>
                                </td>
                                <td>{item.date}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                        {item.status === 'published' ? '配信中' : '下書き'}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <button className={styles.editBtn} onClick={() => handleEditClick(item)}>編集</button>
                                        <button
                                            className="text-xs text-rose-600 font-bold px-3 py-1 bg-rose-50 rounded hover:bg-rose-100 transition-colors"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {news.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">お知らせはありません</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{editingItem.id ? 'お知らせを編集' : '新しいお知らせを作成'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">タイトル</label>
                                <input
                                    type="text"
                                    value={editingItem.title || ''}
                                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="タイトルを入力"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">配信対象</label>
                                    <select
                                        value={editingItem.target || 'all'}
                                        onChange={e => setEditingItem({ ...editingItem, target: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 outline-none"
                                    >
                                        <option value="all">全員</option>
                                        <option value="students">受講生のみ</option>
                                        <option value="staff">スタッフのみ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ステータス</label>
                                    <select
                                        value={editingItem.status || 'draft'}
                                        onChange={e => setEditingItem({ ...editingItem, status: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 outline-none"
                                    >
                                        <option value="draft">下書き</option>
                                        <option value="published">配信する</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">投稿日 (表示用)</label>
                                <input
                                    type="date"
                                    value={editingItem.date || ''}
                                    onChange={e => setEditingItem({ ...editingItem, date: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">本文</label>
                                <textarea
                                    value={editingItem.content || ''}
                                    onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 h-32 outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="お知らせの内容を入力..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            <div>
                                {editingItem.id && (
                                    <button
                                        onClick={() => handleDelete(editingItem.id!)}
                                        className="text-red-500 text-sm font-bold hover:underline"
                                    >
                                        このお知らせを削除
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
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
                </div>
            )}
        </div>
    );
}
