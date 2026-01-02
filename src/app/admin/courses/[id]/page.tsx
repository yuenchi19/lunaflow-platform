"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';

interface Category {
    id: string;
    title: string;
    isPublic: boolean;
    blockCount: number;
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
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [course, setCourse] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const courses = storage.getCourses();
        setCourse(courses.find((c: any) => c.id === params.id));
        setCategories(storage.getCategories(params.id));
    }, [params.id]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setCategories((items: Category[]) => {
                const oldIndex = items.findIndex((i: Category) => i.id === active.id);
                const newIndex = items.findIndex((i: Category) => i.id === over.id);
                const updated = arrayMove(items, oldIndex, newIndex);
                storage.saveCategories(params.id, updated);
                return updated;
            });
        }
    };

    const togglePublic = (id: string) => {
        const updated = categories.map((cat: Category) =>
            cat.id === id ? { ...cat, isPublic: !cat.isPublic } : cat
        );
        setCategories(updated);
        storage.saveCategories(params.id, updated);
    };

    const deleteCategory = (id: string) => {
        if (confirm('このカテゴリを削除してもよろしいですか？')) {
            const updated = categories.filter((cat: Category) => cat.id !== id);
            setCategories(updated);
            storage.saveCategories(params.id, updated);

            // Update course's category count
            const courses = storage.getCourses();
            const updatedCourses = courses.map((c: any) =>
                c.id === params.id ? { ...c, categoryCount: updated.length } : c
            );
            storage.saveCourses(updatedCourses);
        }
    };

    const handleEditClick = (cat: Category) => {
        setEditingCategory(cat);
        setNewCategoryTitle(cat.title);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (editingCategory) {
            const updated = categories.map((cat: Category) =>
                cat.id === editingCategory.id ? { ...cat, title: newCategoryTitle } : cat
            );
            setCategories(updated);
            storage.saveCategories(params.id, updated);
            setIsEditModalOpen(false);
            setEditingCategory(null);
        }
    };

    const handleCreateCategory = () => {
        const newCat: Category = {
            id: `cat${Date.now()}`,
            title: newCategoryTitle || '新しいカテゴリ',
            isPublic: false,
            blockCount: 0
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        storage.saveCategories(params.id, updated);

        // Update course's category count
        const courses = storage.getCourses();
        const updatedCourses = courses.map((c: any) =>
            c.id === params.id ? { ...c, categoryCount: updated.length } : c
        );
        storage.saveCourses(updatedCourses);

        setIsCreateModalOpen(false);
        setNewCategoryTitle('');
    };

    return (
        <div className={styles.container}>
            {/* Plan Alert Removed */}

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
                <h1 className={styles.courseTitle}>{course?.title || 'コース詳細'}</h1>

                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>カテゴリ数</div>
                        <div className={styles.metricValue}>
                            <span className={styles.bigNum}>{categories.length}</span>
                            <span className={styles.subNum}>
                                公開数: <b>{categories.filter(c => c.isPublic).length}</b> 非公開数: <b>{categories.filter(c => !c.isPublic).length}</b>
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>受講設定</div>
                        <div className={styles.metricItem}>
                            <span className={styles.smallLabel}>受講期限</span>
                            <span className={styles.smallValue}>90日</span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>スケジュール設定</div>
                        <div className={styles.metricItem}>
                            <span className={styles.smallValue}>強制する</span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>受講完了後開放コース</div>
                        <div className={styles.metricItem}>
                            <span className={styles.smallValue}>-</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category List */}
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
                                    checked={category.isPublic}
                                    onChange={() => togglePublic(category.id)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <span className={styles.toggleLabel}>
                                {category.isPublic ? '公開中' : '非公開'}
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
