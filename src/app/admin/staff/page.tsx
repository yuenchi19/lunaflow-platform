"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';

interface Staff {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'accounting' | 'staff';
    status: 'active' | 'inactive';
    lastLogin: string;
}

export default function StaffManagementPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'accounting' | 'staff'>('staff');
    const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await fetch('/api/admin/staff');
            if (res.ok) {
                const data = await res.json();
                setStaffList(data);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
    };

    const handleAddClick = () => {
        setEditingStaff(null);
        setNewName('');
        setNewEmail('');
        setNewRole('staff');
        setNewStatus('active');
        setIsAddModalOpen(true);
    };

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff);
        setNewName(staff.name);
        setNewEmail(staff.email);
        setNewRole(staff.role);
        setNewStatus(staff.status);
        setIsAddModalOpen(true);
    };

    const handleSaveStaff = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingStaff) {
                // UPDATE
                const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, email: newEmail, role: newRole, status: newStatus })
                });
                if (!res.ok) throw new Error('Update failed');
            } else {
                // CREATE (Invite)
                const res = await fetch('/api/admin/staff', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, email: newEmail, role: newRole, status: newStatus })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Create failed');
                }
            }

            // Refresh list
            await fetchStaff();
            setIsAddModalOpen(false);

        } catch (error: any) {
            console.error(error);
            alert(`保存に失敗しました: ${error.message}`);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (confirm('このスタッフを削除してもよろしいですか？')) {
            try {
                const res = await fetch(`/api/admin/staff/${id}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Delete failed');
                await fetchStaff();
            } catch (error) {
                alert('削除に失敗しました。');
                console.error(error);
            }
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return '管理者';
            case 'accounting': return '経理担当';
            case 'staff': return 'スタッフ';
            default: return role;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/dashboard">ダッシュボード</Link> / スタッフ管理
                    </div>
                    <h1 className={styles.title}>スタッフ管理</h1>
                </div>
                <button className={styles.addBtn} onClick={handleAddClick}>
                    ＋ 新規スタッフを招待
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>総スタッフ数</div>
                    <div className={styles.statValue}>{staffList.length}名</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>アクティブ</div>
                    <div className={styles.statValue}>{staffList.filter(s => s.status === 'active').length}名</div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>名前</th>
                            <th>メールアドレス</th>
                            <th>権限</th>
                            <th>ステータス</th>
                            <th>最終ログイン</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div className={styles.staffName}>
                                        <div className={styles.avatar}>{item.name[0]}</div>
                                        {item.name}
                                    </div>
                                </td>
                                <td>{item.email}</td>
                                <td><span className={`${styles.badge} ${styles[item.role]}`}>{getRoleLabel(item.role)}</span></td>
                                <td>
                                    <span className={`${styles.statusDot} ${styles[item.status]}`}></span>
                                    {item.status === 'active' ? '有効' : '無効'}
                                </td>
                                <td className={styles.lastLogin}>{item.lastLogin}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button className={styles.editBtn} onClick={() => handleEditClick(item)}>設定</button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDeleteStaff(item.id)}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingStaff ? 'スタッフ編集' : 'スタッフの招待'}</h2>
                            <button onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form className={styles.modalForm} onSubmit={handleSaveStaff}>
                            <div className={styles.formItem}>
                                <label>氏名</label>
                                <input
                                    type="text"
                                    placeholder="例：山田 太郎"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className={styles.formItem}>
                                <label>メールアドレス</label>
                                <input
                                    type="email"
                                    placeholder="staff@example.com"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div className={styles.formItem}>
                                <label>権限</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'accounting' | 'staff')}
                                >
                                    <option value="admin">管理者</option>
                                    <option value="accounting">経理担当</option>
                                    <option value="staff">スタッフ</option>
                                </select>
                            </div>
                            <div className={styles.formItem}>
                                <label>ステータス</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive')}
                                >
                                    <option value="active">有効</option>
                                    <option value="inactive">無効</option>
                                </select>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)}>キャンセル</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingStaff ? 'スタッフ更新' : '招待を送信'}
                                </button>
                            </div>
                            {editingStaff && (
                                <button
                                    type="button"
                                    className={styles.deleteBtnFull}
                                    onClick={() => {
                                        handleDeleteStaff(editingStaff.id);
                                        setIsAddModalOpen(false);
                                    }}
                                >
                                    ■ スタッフ削除
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
