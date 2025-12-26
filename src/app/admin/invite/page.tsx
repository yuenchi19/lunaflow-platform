"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Invite {
    id: string;
    courseName: string;
    url: string;
    clicks: number;
    enrolled: number;
    status: 'active' | 'expired';
}

export default function InvitePage() {
    const [invites, setInvites] = useState<Invite[]>([
        { id: 'i1', courseName: 'テストコース', url: 'https://onclass.jp/i/abcd123', clicks: 120, enrolled: 45, status: 'active' },
        { id: 'i2', courseName: 'テストコース (冬キャンペーン)', url: 'https://onclass.jp/i/winter2023', clicks: 85, enrolled: 12, status: 'active' },
    ]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / コース招待URL
                    </div>
                    <h1 className={styles.title}>コース招待URL管理</h1>
                </div>
                <button className={styles.addBtn}>
                    ＋ 新規招待URLを発行
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>コース名 / ラベル</th>
                            <th>招待用URL</th>
                            <th>クリック数</th>
                            <th>登録数</th>
                            <th>コンバージョン率</th>
                            <th>ステータス</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invites.map(item => (
                            <tr key={item.id}>
                                <td className={styles.courseTitle}>{item.courseName}</td>
                                <td>
                                    <div className={styles.urlRow}>
                                        <code className={styles.code}>{item.url}</code>
                                        <button className={styles.copyBtn}>コピー</button>
                                    </div>
                                </td>
                                <td>{item.clicks}</td>
                                <td>{item.enrolled}</td>
                                <td>{((item.enrolled / item.clicks) * 100).toFixed(1)}%</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                        {item.status === 'active' ? '有効' : '期限切れ'}
                                    </span>
                                </td>
                                <td>
                                    <button className={styles.editBtn}>設定</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
