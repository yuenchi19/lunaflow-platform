"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
// import { storage } from '@/app/lib/storage'; // Removed

interface Course {
    id: string;
    title: string;
    label?: string;
    categoryCount: number;
    studentCount: number;
    minTier?: number; // Added
}

// ... imports ...

// ... inside CreateCourseModal ...
{/* Public Range (Tier) */ }
<div>
    <div className={styles.formLabel}>
        公開範囲（プラン） <span className={styles.requiredBadge}>必須</span>
    </div>
    <select
        name="minTier"
        className={styles.input}
        defaultValue="1"
        required
    >
        <option value="1">ライトプラン以上 (全員)</option>
        <option value="2">スタンダードプラン以上</option>
        <option value="3">プレミアムプランのみ</option>
    </select>
</div>

// ... handleCreateCourse update needed implicitly by form submit handling `minTier`

// ... inside CreateCourseModal handleSubmit ...
const formData = new FormData(e.target as HTMLFormElement);
onSubmit({
    title: formData.get('title'),
    label: formData.get('label'),
    minTier: formData.get('minTier'), // Capture minTier
});

// ... inside SortableCourseItem ...
<div className={styles.badges}>
    <span className={styles.badgeId}>コースID: {course.id}</span>
    {course.label && <span className={styles.badgeLabel}>{course.label}</span>}
    {/* Tier Badge */}
    <span className={`${styles.badgeLabel} ${course.minTier === 3 ? 'bg-amber-100 text-amber-800' : course.minTier === 2 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'}`}>
        {course.minTier === 3 ? 'プレミアム限定' : course.minTier === 2 ? 'スタンダード以上' : 'ライト以上'}
    </span>
</div>

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
    const [isLoading, setIsLoading] = useState(true);

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

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = courses.findIndex(i => i.id === active.id);
            const newIndex = courses.findIndex(i => i.id === over.id);

            const newOrder = arrayMove(courses, oldIndex, newIndex);

            // Optimistic update
            setCourses(newOrder);

            // TODO: Implement API reorder sync
            // await fetch('/api/admin/courses/reorder', { method: 'POST', body: JSON.stringify(newOrder.map((c, i) => ({ id: c.id, order: i }))) });
        }
    };

    const handleCreateCourse = async (newCourse: any) => {
        try {
            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse)
            });

            if (res.ok) {
                const created = await res.json();
                // setCourses([...courses, created]); // Order might vary, better refetch or append
                fetchCourses(); // Refetch to get correct state
                setToastMessage("コースが作成されました");
                setTimeout(() => setToastMessage(null), 3000);
                setIsCreateModalOpen(false);
            }
        } catch (error) {
            alert('作成に失敗しました');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('このコースを削除してもよろしいですか？\n紐づくカテゴリやブロックも削除されます。')) return;

        try {
            const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCourses(courses.filter(c => c.id !== id));
                setToastMessage("コースが削除されました");
                setTimeout(() => setToastMessage(null), 3000);
                setOpenMenuId(null);
            }
        } catch (error) {
            alert('削除に失敗しました');
        }
    };

    // TODO: Implement Duplicate in Backend
    const handleDuplicateCourse = (course: Course) => {
        alert('複製機能は現在メンテナンス中です。');
        // if (!confirm(`「${course.title}」を複製しますか？`)) return;
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
            {isLoading ? (
                <div className="p-8 text-center text-slate-500">読み込み中...</div>
            ) : (
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
                        {courses.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                コースがありません。新規作成してください。
                            </div>
                        )}
                    </div>
                </DndContext>
            )}

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
                    <span className={`${styles.badgeLabel} bg-slate-100 text-slate-600`}>
                        {course.minTier === 3 ? '👑 プレミアム限定' : course.minTier === 2 ? '⭐ スタンダード以上' : '🟢 ライト以上'}
                    </span>
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
            minTier: formData.get('minTier'),
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

                        {/* Public Range (Tier) */}
                        <div>
                            <div className={styles.formLabel}>
                                公開範囲（プラン） <span className={styles.requiredBadge}>必須</span>
                            </div>
                            <select
                                name="minTier"
                                className={styles.input}
                                defaultValue="1"
                                required
                            >
                                <option value="1">ライトプラン以上 (全員)</option>
                                <option value="2">スタンダードプラン以上</option>
                                <option value="3">プレミアムプランのみ</option>
                            </select>
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
