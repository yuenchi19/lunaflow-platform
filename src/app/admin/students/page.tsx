"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { calculateStudentStatus } from '@/lib/utils';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function StudentsPage() {
    // Version: 2025-12-27 Refined
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch('/api/admin/students');
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                } else {
                    console.error("Failed to fetch students");
                }
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadCSV = () => {
        const headers = ["ID", "名前", "プラン", "紹介コード", "メールアドレス", "コミュニティ名", "登録日", "合計購入額"];
        const rows = filteredStudents.map(st => [
            st.id,
            st.name,
            st.plan,
            st.affiliateCode || "",
            st.email,
            st.communityNickname || "",
            st.registrationDate || "",
            st.lifetimePurchaseTotal || 0
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `students_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <button onClick={handleDownloadCSV} className={styles.csvBtn}>CSV出力</button>
                    {/* Removed "Add Individual Student" and Beta tag as requested */}
                </div>
            </div>

            <div className={styles.filterBar}>
                <input
                    type="text"
                    placeholder="名前 or メールで検索"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                            <th>紹介コード</th>
                            <th>プラン / 契約期間</th>
                            <th>おまかせ仕入れ状況</th>
                            <th>ステータス</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((st: any) => {
                            const stats = calculateStudentStatus(st);
                            return (
                                <tr key={st.id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            {/* Removed Avatar Icon as requested */}
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    {st.name}
                                                    {st.communityNickname && (
                                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200">
                                                            @{st.communityNickname}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{st.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {st.affiliateCode ? (
                                            <code className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                                {st.affiliateCode}
                                            </code>
                                        ) : (
                                            <span className="text-xs text-slate-300">-</span>
                                        )}
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
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    ✅ 条件達成済
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                    ⚠️ 不足: ¥{stats.purchaseDeficit.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            <span className="inline-flex items-center w-fit px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                                                ✅ サブスク有効
                                            </span>
                                            {stats.isDurationOk && stats.isPurchaseOk && (
                                                <span className="inline-flex items-center w-fit px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 animate-pulse">
                                                    🎓 卒業/変更可
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link href={`/admin/students/${st.id}`} className={styles.detailBtn}>詳細</Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-0">
                                    <EmptyState
                                        title="受講生が見つかりません"
                                        description="検索条件を変更するか、新しい受講生が登録されるのをお待ちください。"
                                        icon={Users}
                                        className="m-8"
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
