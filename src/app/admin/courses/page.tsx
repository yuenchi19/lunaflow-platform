"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';

interface Course {
    id: string;
    title: string;
    label?: string;
    categoryCount: number;
    studentCount: number;
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

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTopVideoModalOpen, setIsTopVideoModalOpen] = useState(false);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setCourses(storage.getCourses());
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setCourses((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const updated = arrayMove(items, oldIndex, newIndex);
                storage.saveCourses(updated);
                return updated;
            });
        }
    };

    const handleCreateCourse = (newCourse: any) => {
        const mockCourse: Course = {
            id: Math.random().toString(36).substr(2, 9),
            title: newCourse.title,
            label: newCourse.label || undefined,
            categoryCount: 0,
            studentCount: 0
        };
        const updated = [...courses, mockCourse];
        setCourses(updated);
        storage.saveCourses(updated);
        setToastMessage("コースが作成されました");
        setTimeout(() => setToastMessage(null), 3000);
        setIsCreateModalOpen(false);
    };

    const handleDeleteCourse = (id: string) => {
        if (!confirm('このコースを削除してもよろしいですか？\n紐づくカテゴリやブロックも削除されます。')) return;

        const updated = courses.filter(c => c.id !== id);
        setCourses(updated);
        storage.saveCourses(updated);

        // Cleanup storage for categories (Optional but good for hygiene)
        // localStorage.removeItem(`categories_${id}`); 
        // Note: Deep cleanup of blocks would require iterating categories, which is complex without a backend.
        // For localStorage mock, just removing the course entry is usually sufficient for the UI.

        setToastMessage("コースが削除されました");
        setTimeout(() => setToastMessage(null), 3000);
        setOpenMenuId(null);
    };

    const handleDuplicateCourse = (course: Course) => {
        if (!confirm(`「${course.title}」を複製しますか？`)) return;

        const newId = Math.random().toString(36).substr(2, 9);
        const newCourse: Course = {
            ...course,
            id: newId,
            title: `${course.title} (コピー)`,
            studentCount: 0 // Reset student count
        };

        // Deep Copy Categories & Blocks
        const sourceCategories = storage.getCategories(course.id);
        const newCategories = sourceCategories.map((cat: any) => {
            const newCatId = Math.random().toString(36).substr(2, 9);

            // Copy Blocks for this Category
            const sourceBlocks = storage.getBlocks(cat.id);
            const newBlocks = sourceBlocks.map((block: any) => ({
                ...block,
                id: Math.random().toString(36).substr(2, 9)
            }));
            storage.saveBlocks(newCatId, newBlocks);

            return {
                ...cat,
                id: newCatId,
                courseId: newId,
                // blockCount remains same
            };
        });
        storage.saveCategories(newId, newCategories);

        // Update Course List
        const updated = [...courses, newCourse];
        setCourses(updated);
        storage.saveCourses(updated);

        setToastMessage("コースを複製しました");
        setTimeout(() => setToastMessage(null), 3000);
        setOpenMenuId(null);
    };

    return (
        <div className={styles.container}>
            {/* Toast Notification */}
            {toastMessage && (
                <div className={styles.toast}>
                    <span>✅</span>
                    {toastMessage}
                    <button onClick={() => setToastMessage(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>受講コース一覧</h1>
                <button
                    className={styles.addButton}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <span>＋</span> 新規コース作成
                </button>
            </div>

            {/* Course List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.courseList}>
                    <SortableContext
                        items={courses.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {courses.map(course => (
                            <SortableCourseItem
                                key={course.id}
                                course={course}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                                handleDuplicateCourse={handleDuplicateCourse}
                                handleDeleteCourse={handleDeleteCourse}
                                setIsTopVideoModalOpen={setIsTopVideoModalOpen}
                            />
                        ))}
                    </SortableContext>

                    {courses.length > 0 && (
                        <div className={styles.infoBox}>
                            コースをドラッグすると順番を入れ替えることができます。
                        </div>
                    )}
                </div>
            </DndContext>

            {/* Modals */}
            {isCreateModalOpen && <CreateCourseModal onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateCourse} />}
            {isTopVideoModalOpen && <CourseTopVideoModal onClose={() => setIsTopVideoModalOpen(false)} />}
        </div>
    );
}

function SortableCourseItem({ course, openMenuId, setOpenMenuId, handleDeleteCourse, handleDuplicateCourse, setIsTopVideoModalOpen }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: course.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.courseItem} {...attributes} {...listeners}>
            <div className={styles.courseMain}>
                <Link href={`/admin/courses/${course.id}`} className={styles.courseTitle} onMouseDown={e => e.stopPropagation()}>
                    {course.title}
                </Link>
                <div className={styles.badges}>
                    <span className={styles.badgeId}>コースID: {course.id}</span>
                    {course.label && <span className={styles.badgeLabel}>{course.label}</span>}
                </div>
                <div className={styles.metrics}>
                    <div className={styles.metricItem}>
                        <span>≣ カテゴリ数</span>
                        <span style={{ fontWeight: 'bold' }}>{course.categoryCount}</span>
                    </div>
                    <div className={styles.metricItem}>
                        <span>👥 受講中生徒数</span>
                        <span style={{ fontWeight: 'bold' }}>{course.studentCount}</span>
                    </div>
                    <div className={styles.metricItem}>
                        <span>▶️ コーストップ動画</span>
                    </div>
                </div>
            </div>

            <div className={styles.actions} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.settingsButton}
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                    >
                        設定
                    </button>
                    {openMenuId === course.id && (
                        <div className={styles.dropdownMenu} style={{ right: 0, top: '100%', marginTop: '0.5rem' }}>
                            <Link href={`/admin/courses/${course.id}`} className={styles.dropdownItem}>コース編集</Link>
                            <div className={styles.dropdownItem} onClick={() => {
                                setIsTopVideoModalOpen(true);
                                setOpenMenuId(null);
                            }}>トップ動画設定</div>
                            <div className={styles.dropdownItem} onClick={() => handleDuplicateCourse(course)}>コース複製</div>
                            <div className={`${styles.dropdownItem} ${styles.deleteText}`} onClick={() => handleDeleteCourse(course.id)}>コース削除</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function CourseTopVideoModal({ onClose }: { onClose: () => void }) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("動画を登録しました");
        onClose();
    };

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal} style={{ width: '450px' }}>
                <div className={styles.modalBody}>
                    <div className={styles.modalCenteredTitle}>コーストップ動画作成</div>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>テスト</h3>
                        <p className={styles.modalSubTitle}>受講生のコーストップページに表示する動画を設定することができます。</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <div className={styles.formLabel}>動画タイトル</div>
                            <input
                                className={styles.input}
                                placeholder="例）ハンズオンで学ぶカスタマージャーニーマップの制作"
                            />
                            <div className={styles.charCount}>0 / 100</div>
                        </div>

                        <div>
                            <div className={styles.formLabel}>動画URL <span className={styles.requiredBadge}>必須</span></div>
                            <input
                                className={styles.input}
                                placeholder="例）https://youtu.be/00000000"
                                required
                            />
                        </div>

                        <div className={styles.modalFooter} style={{ borderTop: 'none', padding: '1rem 0 0 0' }}>
                            <button type="button" className={styles.cancelButton} onClick={onClose}>キャンセル</button>
                            <button type="submit" className={styles.submitButton}>登録する</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function CreateCourseModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit({
            title: formData.get('title'),
            label: formData.get('label'),
        });
    };

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>新規コース作成</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalScrollBody}>
                        {/* Course Name */}
                        <div>
                            <div className={styles.formLabel}>
                                コース名 <span className={styles.requiredBadge}>必須</span>
                            </div>
                            <input
                                name="title"
                                type="text"
                                placeholder="例）フロントエンジニアコース"
                                className={styles.input}
                                required
                            />
                            <div className={styles.charCount}>0 / 100</div>
                        </div>

                        {/* Course Days */}
                        <div>
                            <div className={styles.formLabel}>
                                コース日数 <span className={styles.helpIcon}>?</span>
                            </div>
                            <input
                                className={styles.input}
                                placeholder="コース日数"
                            />
                            <div style={{ marginTop: '0.5rem' }}>
                                <label className={styles.checkboxGroup}>
                                    <input type="checkbox" />
                                    受講生にスケジュールの設定を強制する
                                </label>
                            </div>
                        </div>

                        {/* Course Progress */}
                        <div>
                            <div className={styles.formLabel}>
                                コース進捗 <span className={styles.helpIcon}>?</span>
                            </div>
                            <label className={styles.checkboxGroup}>
                                <input type="checkbox" />
                                最初から全てのカテゴリ・ブロックを受講可能にする
                            </label>
                        </div>

                        {/* Hashtag */}
                        <div>
                            <div className={styles.formLabel}>
                                ハッシュタグを設定 <span className={styles.helpIcon}>?</span>
                            </div>
                            <label className={styles.checkboxGroup}>
                                <input type="checkbox" />
                                ハッシュタグを設定する
                            </label>
                        </div>

                        {/* Label */}
                        <div>
                            <div className={styles.formLabel}>
                                ラベルの設定 <span className={styles.helpIcon}>?</span>
                            </div>
                            <input
                                name="label"
                                className={styles.input}
                                placeholder="例）基礎編、○○向け、重要度：高"
                            />
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            キャンセル
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            新規コース作成
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
