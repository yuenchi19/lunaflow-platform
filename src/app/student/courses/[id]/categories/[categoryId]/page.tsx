"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';
import VideoPlayer from '@/components/VideoPlayer';
import BlockRenderer from '@/components/BlockRenderer';

export default function StudentCategoryPage({ params }: { params: { id: string, categoryId: string } }) {
    const [category, setCategory] = useState<any>(null);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [activeBlockIndex, setActiveBlockIndex] = useState(0);

    useEffect(() => {
        const categories = storage.getCategories(params.id);
        const found = categories.find((c: any) => c.id === params.categoryId);
        setCategory(found);

        const fetchedBlocks = storage.getBlocks(params.categoryId);
        setBlocks(fetchedBlocks);
    }, [params.id, params.categoryId]);

    if (!category) return <div className={styles.loading}>読み込み中...</div>;

    const activeBlock = blocks[activeBlockIndex];

    // Converted to separate Component
    // const renderBlockContent = (block: any) => ...

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href={`/student/courses/${params.id}`} className={styles.backToCourse}>
                        ← コース詳細に戻る
                    </Link>
                    <h1 className={styles.categoryTitle}>{category.title}</h1>
                </div>
                <div className={styles.blockList}>
                    {blocks.map((block, index) => (
                        <button
                            key={block.id}
                            className={`${styles.blockSidebarItem} ${index === activeBlockIndex ? styles.activeBlock : ''}`}
                            onClick={() => setActiveBlockIndex(index)}
                        >
                            <span className={styles.blockIndex}>{index + 1}</span>
                            <span className={styles.blockTitleSide}>{block.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    {blocks.length > 0 ? (
                        <>
                            <BlockRenderer block={activeBlock} />
                            <div className={styles.navigation}>
                                <button
                                    className={styles.navBtn}
                                    disabled={activeBlockIndex === 0}
                                    onClick={() => setActiveBlockIndex(activeBlockIndex - 1)}
                                >
                                    前のブロック
                                </button>
                                <button
                                    className={styles.navBtnPrimary}
                                    onClick={() => {
                                        if (activeBlockIndex < blocks.length - 1) {
                                            setActiveBlockIndex(activeBlockIndex + 1);
                                        } else {
                                            alert('すべてのブロックを完了しました！');
                                        }
                                    }}
                                >
                                    {activeBlockIndex === blocks.length - 1 ? '完了' : '次のブロックへ'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.empty}>このカテゴリにはまだブロックがありません。</div>
                    )}
                </div>
            </main>
        </div>
    );
}
