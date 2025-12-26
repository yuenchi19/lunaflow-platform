"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { MOCK_USERS, getStudentPayments } from '@/lib/data';
import { calculateStudentStatus } from '@/lib/utils';
import { User, Payment } from '@/types';

export default function StudentDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [student, setStudent] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        communityNickname: "",
        plan: "light"
    });

    useEffect(() => {
        // Mock fetch
        const found = MOCK_USERS.find(u => u.id === params.id);
        if (found) {
            setStudent(found);
            setEditForm({
                name: found.name,
                email: found.email,
                communityNickname: found.communityNickname || "",
                plan: found.plan
            });
            // Fetch Payments
            setPayments(getStudentPayments(found.id));
        }
    }, [params.id]);

    const handleSave = () => {
        if (!student) return;
        // Mock Save
        setStudent({
            ...student,
            name: editForm.name,
            email: editForm.email,
            communityNickname: editForm.communityNickname,
            plan: editForm.plan as any
        });
        setIsEditing(false);
        alert("保存しました (擬似)");
    };

    const handleDownloadCSV = () => {
        if (!student) return;
        const headers = ["日付", "金額", "方法", "ステータス"];
        const rows = payments.map(p => [
            p.date,
            p.amount.toString(),
            p.method,
            p.status
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payment_history_${student.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendEmail = () => {
        if (!student) return;
        window.location.href = `mailto:${student.email}?subject=LunaFlowからのお知らせ`;
    };

    if (!student) return <div className={styles.loading}>読み込み中...</div>;

    const stats = calculateStudentStatus(student);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>受講生情報</h1>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handleDownloadCSV} className={styles.headerBtn}>📥 履歴CSV出力</button>
                    <button onClick={handleSendEmail} className={styles.headerBtnPrimary}>📧 この受講生にメールを送る</button>
                    {/* Beta removed */}
                    <Link href="/admin/emails" className={styles.headerLink}>📧 メール送信履歴</Link>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.studentCard}>
                    <div className={styles.studentHeader}>
                        {/* Avatar Removed as requested */}
                        <div className={styles.studentMainInfo}>
                            <div className={styles.nameRow}>
                                {isEditing ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            className="border p-1 rounded"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                        <input
                                            className="border p-1 rounded placeholder:text-gray-300"
                                            placeholder="ニックネーム"
                                            value={editForm.communityNickname}
                                            onChange={e => setEditForm({ ...editForm, communityNickname: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <h2 className={styles.studentName}>
                                        {student.name}
                                    </h2>
                                )}

                                <div className={styles.editActions}>
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleSave} className="text-sm bg-blue-500 text-white px-3 py-1 rounded">保存</button>
                                            <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 px-2">キャンセル</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className={styles.textLink}>編集</button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>メールアドレス</div>
                                    {isEditing ? (
                                        <input
                                            className="border p-1 rounded w-full text-sm"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    ) : (
                                        <div className={styles.infoValue}>{student.email}</div>
                                    )}
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>現在のプラン</div>
                                    {isEditing ? (
                                        <select
                                            className="border p-1 rounded text-sm bg-white"
                                            value={editForm.plan}
                                            onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                                        >
                                            <option value="light">Light</option>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    ) : (
                                        <div className={styles.infoValue}>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${student.plan === 'premium' ? 'bg-amber-100 text-amber-700' :
                                                student.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {student.plan}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>ニックネーム</div>
                                    {isEditing ? (
                                        <input
                                            className="border p-1 rounded w-full text-sm"
                                            value={editForm.communityNickname}
                                            onChange={e => setEditForm({ ...editForm, communityNickname: e.target.value })}
                                            placeholder="@ユーザー名"
                                        />
                                    ) : (
                                        <div className={styles.infoValue}>
                                            {student.communityNickname ? (
                                                <span className="text-indigo-600 font-medium">{student.communityNickname}</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">未設定</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>登録日時</div>
                                    <div className={styles.infoValue}>{student.registrationDate || "-"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Contract Status Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">契約期間・条件</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">経過月数</span>
                            <span className="font-mono font-bold text-lg">
                                {stats.monthsElapsed} <span className="text-xs text-gray-400">/ {stats.requiredMonths} ヶ月</span>
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${stats.isDurationOk ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, (stats.monthsElapsed / stats.requiredMonths) * 100)}%` }}
                            ></div>
                        </div>
                        {stats.isDurationOk ? (
                            <p className="text-xs text-emerald-600 font-bold text-right pt-1">✅ 最低契約期間クリア</p>
                        ) : (
                            <p className="text-xs text-slate-500 text-right pt-1">残り {stats.requiredMonths - stats.monthsElapsed} ヶ月</p>
                        )}
                    </div>
                </div>

                {/* Purchase Status Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">おまかせ仕入れ目標</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">現在の実績</span>
                            <span className="font-mono font-bold text-lg">
                                ¥{stats.currentTotal.toLocaleString()} <span className="text-xs text-gray-400">/ ¥{stats.requiredTotal.toLocaleString()}</span>
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${stats.isPurchaseOk ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, (stats.currentTotal / stats.requiredTotal) * 100)}%` }}
                            ></div>
                        </div>
                        {stats.isPurchaseOk ? (
                            <p className="text-xs text-emerald-600 font-bold text-right pt-1">✅ 目標達成済み</p>
                        ) : (
                            <p className="text-xs text-rose-500 text-right pt-1">不足額: ¥{stats.purchaseDeficit.toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment History Table */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>決済・購入履歴</h3>
                <div className={styles.tableCard}>
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">日付</th>
                                <th className="px-6 py-3">内容 / 方法</th>
                                <th className="px-6 py-3 text-right">金額</th>
                                <th className="px-6 py-3 text-center">ステータス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">{p.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">月額サブスクリプション</div>
                                        <div className="text-xs text-gray-400 capitalize">{p.method}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">¥{p.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                                            p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-gray-400">履歴がありません</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={() => router.back()} className={styles.backBtn}>← バック</button>
            </div>
        </div>
    );
}
