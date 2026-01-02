
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Category {
    id: string;
    title: string;
    published: boolean;
    blockCount: number;
    blocks?: any[];
}

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


export default function CourseDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCourseEditModalOpen, setIsCourseEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Course Edit State
    const [editCourseData, setEditCourseData] = useState({ title: '', label: '', minTier: 1 });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchCourseData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/courses/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
                if (data.categories) {
                    setCategories(data.categories.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        published: c.published,
                        blockCount: c.blocks ? c.blocks.length : 0
                    })));
                } else {
                    setCategories([]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseData();
    }, [params.id]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex(i => i.id === active.id);
            const newIndex = categories.findIndex(i => i.id === over.id);

            const newOrder = arrayMove(categories, oldIndex, newIndex);

            // Optimistic update
            setCategories(newOrder);

            // API Sync
            try {
                await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'reorder',
                        items: newOrder.map((c, i) => ({ id: c.id, order: i + 1 }))
                    })
                });
            } catch (e) {
                console.error("Reorder failed", e);
            }
        }
    };

    const togglePublic = async (id: string) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        const newStatus = !cat.published;

        // Optimistic
        setCategories(categories.map(c => c.id === id ? { ...c, published: newStatus } : c));

        try {
            await fetch(`/api/admin/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: newStatus })
            });
        } catch (e) {
            alert('更新に失敗しました');
            fetchCourseData(); // Revert
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('このカテゴリを削除してもよろしいですか？')) return;

        // Optimistic
        setCategories(categories.filter(c => c.id !== id));

        try {
            await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            fetchCourseData();
        } catch (e) {
            alert('削除に失敗しました');
            fetchCourseData();
        }
    };

    const handleEditClick = (cat: Category) => {
        setEditingCategory(cat);
        setNewCategoryTitle(cat.title);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (editingCategory) {
            try {
                const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newCategoryTitle })
                });

                if (res.ok) {
                    setCategories(categories.map(cat =>
                        cat.id === editingCategory.id ? { ...cat, title: newCategoryTitle } : cat
                    ));
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                }
            } catch (e) {
                alert('保存に失敗しました');
            }
        }
    };

    const handleCreateCategory = async () => {
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: params.id,
                    title: newCategoryTitle || '新しいカテゴリ'
                })
            });

            if (res.ok) {
                fetchCourseData();
                setIsCreateModalOpen(false);
                setNewCategoryTitle('');
            }
        } catch (e) {
            alert('作成に失敗しました');
        }
    };

    const openCourseEdit = () => {
        if (course) {
            setEditCourseData({
                title: course.title,
                label: course.label || '',
                minTier: course.minTier || 1
            });
            setIsCourseEditModalOpen(true);
        }
    };

    const handleSaveCourse = async () => {
        try {
            const res = await fetch(`/api/admin/courses/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCourseData)
            });
            if (res.ok) {
                const updated = await res.json();
                setCourse(updated);
                setIsCourseEditModalOpen(false);
            }
        } catch (e) {
            alert('コース情報の保存に失敗しました');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.breadcrumb}>
                <div className={styles.breadcrumbLink}>
                    <Link href="/admin/courses">コース一覧</Link> / {course?.title || 'コース詳細'}
                </div>
                <Link href={`/student/course/${params.id}?mode=preview`} className={styles.previewAsStudent} target="_blank">
                    <span className={styles.previewIcon}>👁️</span> 受講生として表示
                </Link>
            </div>

            {/* Course Metrics Header */}
            <div className={styles.courseHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 className={styles.courseTitle}>{course?.title || 'コース詳細'}</h1>
                    <button className={styles.editLinkBtn} onClick={openCourseEdit}>
                        <span className={styles.editIcon}>⚙️</span> 設定変更
                    </button>
                    {course?.minTier && (
                        <span className={`px-2 py-1 rounded text-sm ${course.minTier === 3 ? 'bg-amber-100 text-amber-800' : course.minTier === 2 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'}`}>
                            {course.minTier === 3 ? 'Premium' : course.minTier === 2 ? 'Standard+' : 'Light+'}
                        </span>
                    )}
                </div>

                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>カテゴリ数</div>
                        <div className={styles.metricValue}>
                            <span className={styles.bigNum}>{categories.length}</span>
                            <span className={styles.subNum}>
                                公開数: <b>{categories.filter(c => c.published).length}</b> 非公開数: <b>{categories.filter(c => !c.published).length}</b>
                            </span>
                        </div>
                    </div>
                    {/* Other metrics placeholders if needed */}
                </div>
            </div>

            {/* Category List */}
            {isLoading ? <div>Loading...</div> : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className={styles.categoryList}>
                        <SortableContext
                            items={categories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {categories.map((category) => (
                                <SortableCategoryItem
                                    key={category.id}
                                    category={category}
                                    params={params}
                                    togglePublic={togglePublic}
                                    deleteCategory={deleteCategory}
                                    handleEditClick={handleEditClick}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </DndContext>
            )}

            {/* Add Category Button */}
            <div className={styles.bottomAction}>
                <button className={styles.createCategoryBtn} onClick={() => setIsCreateModalOpen(true)}>
                    <span className={styles.plusIconLarge}>✚</span> 講座カテゴリを新規作成
                </button>
            </div>

            {/* Edit Category Modal */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>カテゴリ名を編集</h3>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={newCategoryTitle}
                            onChange={(e) => setNewCategoryTitle(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsEditModalOpen(false)}>キャンセル</button>
                            <button className={styles.saveBtn} onClick={handleSaveEdit}>保存</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Category Modal */}
            {isCreateModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>新しいカテゴリを追加</h3>
                        <input
                            type="text"
                            className={styles.modalInput}
                            placeholder="カテゴリ名を入力"
                            value={newCategoryTitle}
                            onChange={(e) => setNewCategoryTitle(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsCreateModalOpen(false)}>キャンセル</button>
                            <button className={styles.saveBtn} onClick={handleCreateCategory}>作成</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Course Settings Modal */}
            {isCourseEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>コース設定変更</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label className={styles.formLabel}>コース名</label>
                                <input
                                    className={styles.modalInput}
                                    value={editCourseData.title}
                                    onChange={e => setEditCourseData({ ...editCourseData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>ラベル</label>
                                <input
                                    className={styles.modalInput}
                                    value={editCourseData.label}
                                    onChange={e => setEditCourseData({ ...editCourseData, label: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={styles.formLabel}>公開範囲 (Tier)</label>
                                <select
                                    className={styles.modalInput}
                                    value={editCourseData.minTier}
                                    onChange={e => setEditCourseData({ ...editCourseData, minTier: parseInt(e.target.value) })}
                                >
                                    <option value={1}>Tier 1 (Light+)</option>
                                    <option value={2}>Tier 2 (Standard+)</option>
                                    <option value={3}>Tier 3 (Premium)</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsCourseEditModalOpen(false)}>キャンセル</button>
                            <button className={styles.saveBtn} onClick={handleSaveCourse}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SortableCategoryItem({ category, params, togglePublic, deleteCategory, handleEditClick }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: transform ? 1 : 0,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.categoryCard}>
            <div className={styles.dragHandle} {...attributes} {...listeners}>
                <span className={styles.dragIcon}>☰</span>
            </div>
            <div className={styles.categoryContent}>
                <div className={styles.categoryCardHeader}>
                    <div className={styles.categoryCardTitleRow}>
                        <span className={styles.categoryCardTitle}>{category.title}</span>
                        <button className={styles.editLinkBtn} onClick={() => handleEditClick(category)}>
                            <span className={styles.editIcon}>🖊️</span> カテゴリ編集
                        </button>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.toggleWrapper}>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={category.published}
                                    onChange={() => togglePublic(category.id)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <span className={styles.toggleLabel}>
                                {category.published ? '公開中' : '非公開'}
                            </span>
                        </div>
                        <button className={styles.deleteBtn} onClick={() => deleteCategory(category.id)}>
                            <span>🗑️</span>
                        </button>
                    </div>
                </div>

                <div className={styles.blockEditArea}>
                    <div className={styles.blockCountBox}>
                        <div className={styles.blockCountText}>
                            ブロック数 <span className={styles.blockCountNum}>{category.blockCount}</span>
                        </div>
                        <Link
                            href={`/admin/courses/${params.id}/categories/${category.id}`}
                            className={styles.addBlockBtn}
                        >
                            <span className={styles.editIconSmall}>🖊️</span> 講座ブロック追加・編集
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
