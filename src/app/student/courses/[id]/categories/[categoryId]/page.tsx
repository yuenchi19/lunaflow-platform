"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';

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

    const renderBlockContent = (block: any) => {
        if (!block) return null;

        switch (block.type) {
            case 'video':
                return (
                    <div className={styles.videoPlayer}>
                        <div className={styles.videoPlaceholder}>
                            <span className={styles.playBtn}>▶</span>
                            <p>動画コンテンツ: {block.title}</p>
                        </div>
                    </div>
                );
            case 'text':
            case 'article':
                return (
                    <div className={styles.textContent}>
                        <h2>{block.title}</h2>
                        <div className={styles.textBody}>
                            {block.type === 'article' ? '記事の本文がここに表示されます。管理画面で入力した内容が反映されます。' : '短いテキストがここに表示されます。'}
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className={styles.quizContent}>
                        <h2>{block.title}</h2>
                        <div className={styles.quizQuestion}>
                            問題の本文がここに表示されます。
                        </div>
                        <div className={styles.quizOptions}>
                            <button className={styles.quizOptionBtn}>選択肢 1</button>
                            <button className={styles.quizOptionBtn}>選択肢 2</button>
                            <button className={styles.quizOptionBtn}>選択肢 3</button>
                        </div>
                    </div>
                );
            case 'survey':
                return (
                    <div className={styles.surveyContent}>
                        <h2>{block.title}</h2>
                        <p>アンケートへのご協力をお願いします。</p>
                        <div className={styles.surveyQuestions}>
                            {block.content?.questions?.map((q: any, i: number) => (
                                <div key={i} className={styles.surveyQuestionItem}>
                                    <p className={styles.qTitle}>{i + 1}. {q.title || '無題の質問'}</p>
                                    {q.type === 'text' ? (
                                        <textarea className={styles.surveyTextarea} placeholder="回答を入力"></textarea>
                                    ) : (
                                        <div className={styles.qOptions}>
                                            {q.options?.map((opt: string, oi: number) => (
                                                <label key={oi} className={styles.qOptionLabel}>
                                                    <input type={q.type} name={`q${i}`} /> {opt || `選択肢 ${oi + 1}`}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) || <p>質問が設定されていません。</p>}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={styles.otherContent}>
                        <div className={styles.otherIcon}>{block.type === 'pdf' ? '📂' : block.type === 'audio' ? '🔊' : '🔗'}</div>
                        <h3>{block.title}</h3>
                        <p>{block.type.toUpperCase()} コンテンツ</p>
                        <button className={styles.downloadBtn}>
                            {block.type === 'link' ? 'リンクを開く' : 'ファイルをダウンロード'}
                        </button>
                    </div>
                );
        }
    };

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
                            {renderBlockContent(activeBlock)}
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
