"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { MOCK_USERS } from '@/lib/data';

interface Student {
    id: string;
    name: string;
    email: string;
    enrolledCourse: string;
    progress: number;
    lastActive: string;
}

export default function StudentsPage() {
    // In a real app, fetch from API. Here we use MOCK_USERS directly for consistency.
    const [students] = useState(MOCK_USERS.filter(u => u.role === 'student'));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / 受講生管理
                    </div>
                    <h1 className={styles.title}>受講生管理</h1>
                </div>
                <div className={styles.actions}>
                    <button className={styles.csvBtn}>CSV出力</button>
                    <button className={styles.addBtn}>＋ 受講生を個別追加</button>
                </div>
            </div>

            <div className={styles.filterBar}>
                <input type="text" placeholder="名前 or メールで検索" className={styles.searchInput} />
                <select className={styles.select}>
                    <option>すべてのコース</option>
                    <option>テストコース</option>
                </select>
                <select className={styles.select}>
                    <option>すべての進捗</option>
                    <option>未着手</option>
                    <option>学習中</option>
                    <option>修了</option>
                </select>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>名前 (コミュニティ名)</th>
                            <th>メールアドレス</th>
                            <th>プラン</th>
                            <th>ステータス</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(st => (
                            <tr key={st.id}>
                                <td>
                                    <div className={styles.studentInfo}>
                                        {st.avatarUrl ? (
                                            <img src={st.avatarUrl} alt="" className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatar}>{st.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="font-bold">{st.name}</div>
                                            {st.communityNickname && (
                                                <div className="text-xs text-slate-500">@{st.communityNickname}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>{st.email}</td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${st.plan === 'premium' ? 'bg-amber-100 text-amber-700' :
                                        st.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {st.plan.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <span className="text-emerald-600 font-bold text-sm">有効</span>
                                </td>
                                <td>
                                    <Link href={`/admin/students/${st.id}`} className={styles.detailBtn}>詳細</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
