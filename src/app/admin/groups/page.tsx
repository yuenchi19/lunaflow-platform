"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Group {
    id: string;
    name: string;
    studentCount: number;
    courseName: string;
    createdDate: string;
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([
        { id: 'g1', name: '2023年12月生', studentCount: 25, courseName: 'テストコース', createdDate: '2023-12-01' },
        { id: 'g2', name: '法人向け研修：A社', studentCount: 12, courseName: 'テストコース', createdDate: '2023-12-10' },
    ]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / グループ管理
                    </div>
                    <h1 className={styles.title}>グループ管理</h1>
                </div>
                <button className={styles.addBtn}>
                    ＋ 新規グループを作成
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>グループ名</th>
                            <th>受講生数</th>
                            <th>対象コース</th>
                            <th>作成日</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td className={styles.groupName}>{group.name}</td>
                                <td>{group.studentCount} 名</td>
                                <td>{group.courseName}</td>
                                <td>{group.createdDate}</td>
                                <td>
                                    <button className={styles.actionBtn}>詳細</button>
                                    <button className={styles.actionBtn}>一括送信</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
