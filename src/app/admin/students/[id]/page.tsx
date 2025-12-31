"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { MOCK_USERS, savePayment, updateUser } from '@/lib/data';
import { calculateStudentStatus } from '@/lib/utils';
import { User, Payment, ProgressDetail } from '@/types';

export default function StudentDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [student, setStudent] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [progressLogs, setProgressLogs] = useState<ProgressDetail[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        communityNickname: "",
        plan: "light"
    });

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const res = await fetch(`/api/admin/students/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudent(data.user);
                    setEditForm({
                        name: data.user.name || "",
                        email: data.user.email || "",
                        communityNickname: data.user.communityNickname || "",
                        plan: data.user.plan || "light"
                    });

                    // Payments
                    setPayments(data.payments || []);

                    // Progress
                    setProgressLogs(data.progressLogs || []);
                } else {
                    console.error("Failed to fetch student");
                    // Optionally set error state
                }
            } catch (error) {
                console.error("Error fetching student details:", error);
            }
        };

        if (params.id) {
            fetchStudentData();
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
        // Use current loaded payments for CSV
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

    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        method: "card",
        note: ""
    });

    const handleAddPayment = () => {
        if (!student || !newPayment.amount) return;

        const amount = parseInt(newPayment.amount);
        if (isNaN(amount)) {
            alert("金額を正しく入力してください");
            return;
        }

        const payment: Payment = {
            id: `pay_${Date.now()}`,
            userId: student.id,
            date: newPayment.date,
            amount: amount,
            method: newPayment.method as any,
            status: 'succeeded'
        };

        savePayment(payment);

        // Update User Total
        const newTotal = (student.lifetimePurchaseTotal || 0) + amount;
        const updatedUser = { ...student, lifetimePurchaseTotal: newTotal };
        updateUser(updatedUser);
        setStudent(updatedUser); // Update local state immediately

        // Refresh Payments (Local Update)
        const newPaymentObj: Payment = {
            id: payment.id,
            userId: payment.userId,
            date: payment.date,
            amount: payment.amount,
            method: payment.method,
            status: payment.status
        };
        const updatedPayments = [newPaymentObj, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPayments(updatedPayments.slice(0, 3));

        setIsAddingPayment(false);
        setNewPayment({ ...newPayment, amount: "" });
        alert("購入履歴を追加しました (サーバー非同期/ローカルのみ反映)");
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
                    <Link href="/admin/emails" className={styles.headerLink}>📧 メール送信履歴</Link>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.studentCard}>
                    <div className={styles.studentHeader}>
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

            {/* Progress History - NEW */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>受講進捗詳細 (行動ログ)</h3>
                <div className={styles.tableCard}>
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">完了日時</th>
                                <th className="px-6 py-3">コース / カテゴリ</th>
                                <th className="px-6 py-3">ブロック名</th>
                                <th className="px-6 py-3 text-center">ステータス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {progressLogs.map((log, idx) => (
                                <tr key={`prog-${idx}`} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                        {new Date(log.completedAt).toLocaleString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{log.courseTitle}</div>
                                        <div className="text-xs text-gray-400">{log.categoryTitle}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-800">
                                        {log.blockTitle}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            完了
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {progressLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-gray-400">
                                        受講・完了履歴がまだありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History Table (Limited to latest 3) */}
            <div className={styles.section}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>直近の決済・購入履歴 (最新3件)</h3>
                    <button
                        onClick={() => setIsAddingPayment(!isAddingPayment)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 font-bold"
                    >
                        {isAddingPayment ? "キャンセル" : "+ 購入履歴を追加"}
                    </button>
                </div>

                {isAddingPayment && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-indigo-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-3">新しい購入履歴を追加</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">日付</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-1.5 text-sm"
                                    value={newPayment.date}
                                    onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">金額 (円)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-1.5 text-sm"
                                    placeholder="例: 10000"
                                    value={newPayment.amount}
                                    onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">支払い方法</label>
                                <select
                                    className="w-full border rounded p-1.5 text-sm bg-white"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                                >
                                    <option value="card">カード</option>
                                    <option value="bank_transfer">銀行振込</option>
                                    <option value="other">その他</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleAddPayment}
                                    className="w-full bg-indigo-600 text-white font-bold py-1.5 rounded text-sm hover:bg-indigo-700"
                                >
                                    追加する
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
