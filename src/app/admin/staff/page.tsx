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

    useEffect(() => {
        setStaffList(storage.getStaff());
    }, []);

    const handleAddClick = () => {
        setEditingStaff(null);
        setNewName('');
        setNewEmail('');
        setNewRole('staff');
        setIsAddModalOpen(true);
    };

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff);
        setNewName(staff.name);
        setNewEmail(staff.email);
        setNewRole(staff.role);
        setIsAddModalOpen(true);
    };

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        let updated: Staff[];

        if (editingStaff) {
            updated = staffList.map(s =>
                s.id === editingStaff.id
                    ? { ...s, name: newName, email: newEmail, role: newRole }
                    : s
            );
        } else {
            const newStaff: Staff = {
                id: `s${Date.now()}`,
                name: newName,
                email: newEmail,
                role: newRole,
                status: 'active',
                lastLogin: '-'
            };
            updated = [...staffList, newStaff];
        }

        setStaffList(updated);
        storage.saveStaff(updated);
        setIsAddModalOpen(false);
    };

    const handleDeleteStaff = (id: string) => {
        if (confirm('このスタッフを削除してもよろしいですか？')) {
            const updated = staffList.filter(s => s.id !== id);
            setStaffList(updated);
            storage.saveStaff(updated);
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
