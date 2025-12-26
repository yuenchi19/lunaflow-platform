"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Student {
    id: string;
    name: string;
    email: string;
    enrolledCourse: string;
    progress: number;
    lastActive: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([
        { id: 'st1', name: '山田 太郎', email: 'yamada@example.com', enrolledCourse: 'テストコース', progress: 45, lastActive: '2023-12-21' },
        { id: 'st2', name: '鈴木 花子', email: 'suzuki@example.com', enrolledCourse: 'テストコース', progress: 80, lastActive: '2023-12-20' },
        { id: 'st3', name: '田中 一郎', email: 'tanaka@example.com', enrolledCourse: 'テストコース', progress: 10, lastActive: '2023-12-19' },
    ]);

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
                            <th>名前</th>
                            <th>メールアドレス</th>
                            <th>受講中のコース</th>
                            <th>進捗率</th>
                            <th>最終ログイン</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(st => (
                            <tr key={st.id}>
                                <td>
                                    <div className={styles.studentInfo}>
                                        <div className={styles.avatar}>{st.name[0]}</div>
                                        {st.name}
                                    </div>
                                </td>
                                <td>{st.email}</td>
                                <td>{st.enrolledCourse}</td>
                                <td>
                                    <div className={styles.progressRow}>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${st.progress}%` }}></div>
                                        </div>
                                        <span className={styles.progressText}>{st.progress}%</span>
                                    </div>
                                </td>
                                <td>{st.lastActive}</td>
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
