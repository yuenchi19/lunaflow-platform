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
    // Version: 2025-12-26 Rev 2
    const [students] = useState(MOCK_USERS.filter(u => u.role === 'student'));

    const calculateStatus = (user: any) => {
        // Defaults
        const regDate = user.registrationDate ? new Date(user.registrationDate) : new Date("2025-01-01");
        const monthsElapsed = Math.floor((new Date().getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const currentTotal = user.lifetimePurchaseTotal || 0;

        let requiredMonths = 0;
        let requiredTotal = 0;

        // Plan Logic based on User Request
        if (user.plan === 'premium') {
            requiredMonths = 10;
            // 30k * 10 = 300k
            requiredTotal = 30000 * 10;
        } else if (user.plan === 'standard') {
            requiredMonths = 11;
            // 60k * 11 = 660k
            requiredTotal = 60000 * 11;
        } else if (user.plan === 'light') {
            requiredMonths = 12;
            // 80k * 12 = 960k
            requiredTotal = 80000 * 12;
        }

        const isDurationOk = monthsElapsed >= requiredMonths;
        const purchaseDeficit = Math.max(0, requiredTotal - currentTotal);
        const isPurchaseOk = purchaseDeficit === 0;

        return {
            monthsElapsed,
            requiredMonths,
            currentTotal,
            requiredTotal,
            purchaseDeficit,
            isDurationOk,
            isPurchaseOk
        };
    };

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
                            <th>プラン / 契約期間</th>
                            <th>おまかせ仕入れ状況</th>
                            <th>ステータス</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((st: any) => {
                            const stats = calculateStatus(st);
                            return (
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
                                                <div className="text-[10px] text-slate-400">{st.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`w-fit px-2 py-0.5 rounded text-xs font-bold ${st.plan === 'premium' ? 'bg-amber-100 text-amber-700' :
                                                st.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {st.plan.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-slate-600 font-medium">
                                                {stats.monthsElapsed}ヶ月目 / 最低{stats.requiredMonths}ヶ月
                                            </span>
                                            {stats.isDurationOk ? (
                                                <span className="text-[10px] text-emerald-600 font-bold">✅ 契約期間クリア</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">あと {stats.requiredMonths - stats.monthsElapsed}ヶ月</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-bold text-slate-700">
                                                実績: ¥{stats.currentTotal.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                目標: ¥{stats.requiredTotal.toLocaleString()}
                                            </div>
                                            {stats.isPurchaseOk ? (
                                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded w-fit">
                                                    ✅ 条件達成済
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1 rounded w-fit">
                                                    不足: ¥{stats.purchaseDeficit.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-emerald-600 font-bold text-xs">サブスク有効</span>
                                            {stats.isDurationOk && stats.isPurchaseOk && (
                                                <span className="text-[10px] font-bold text-indigo-600">卒業/変更可</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link href={`/admin/students/${st.id}`} className={styles.detailBtn}>详细</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
