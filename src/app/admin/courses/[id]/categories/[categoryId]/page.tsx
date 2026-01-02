"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';
import BlockRenderer from '@/components/BlockRenderer';
import { useToast } from "@/components/ui/ToastContext";

interface Block {
    id: string;
    type: string;
    title: string;
    content?: any;
}

interface Category {
    id: string;
    title: string;
    isPublic: boolean;
    blockCount: number;
}

export default function CategoryBlockEditPage({ params }: { params: { id: string, categoryId: string } }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);

    useEffect(() => {
        setBlocks(storage.getBlocks(params.categoryId));
    }, [params.categoryId]);

    const blockTypes = [
        { id: 'video', label: '動画', icon: '▶️' },
        { id: 'quiz', label: '練習問題/確認', icon: '✅' },
        { id: 'link', label: '外部リンク', icon: '🔗' },
        { id: 'text', label: 'テキスト', icon: '📄' },
        { id: 'article', label: '記事', icon: '📰' },
        { id: 'pdf', label: 'PDFファイル', icon: '📂' },
        { id: 'audio', label: '音声', icon: '🔊' },
        { id: 'survey', label: 'アンケート', icon: '🖊️' },
    ];

    const [activeType, setActiveType] = useState('video');
    const [quizOptions, setQuizOptions] = useState(['']);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizBody, setQuizBody] = useState('');
    const [quizExplanation, setQuizExplanation] = useState('');

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [surveyQuestions, setSurveyQuestions] = useState([{ type: 'text', title: '', options: [''] }]);

    const handleFileSelect = (name: string) => {
        setSelectedFile(name);
        showToast(`${name} を選択しました（モック機能）`, 'info');
    };

    const handleAddSurveyQuestion = () => {
        setSurveyQuestions([...surveyQuestions, { type: 'text', title: '', options: [''] }]);
    };

    const handleDeleteOption = (index: number) => {
        if (quizOptions.length > 1) {
            setQuizOptions(quizOptions.filter((_, i) => i !== index));
        }
    };

    const handleClearQuiz = () => {
        setQuizTitle('');
        setQuizBody('');
        setQuizExplanation('');
        setQuizOptions(['']);
    };

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const getPreviewBlock = (): Block => {
        // Construct a block object from current inputs
        return {
            id: 'preview',
            type: activeType,
            title: quizTitle || `${activeType} ブロック`,
            content: activeType === 'survey' ? { questions: surveyQuestions } :
                activeType === 'video' ? { url: quizBody } :
                    activeType === 'quiz' ? { body: quizBody, explanation: quizExplanation, options: quizOptions } :
                        activeType === 'article' || activeType === 'text' ? { body: quizBody } :
                            undefined
        };
    };

    const handlePreview = () => {
        setIsPreviewOpen(true);
    };

    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleEditBlock = (block: Block) => {
        setEditingBlockId(block.id);
        setActiveType(block.type);
        setQuizTitle(block.title);

        // Populate content based on type
        if (block.type === 'video' && block.content?.url) {
            setQuizBody(block.content.url); // Using quizBody for URL
        } else if (block.type === 'quiz') {
            setQuizBody(block.content?.body || ''); // Assuming body in content
            setQuizExplanation(block.content?.explanation || '');
            setQuizOptions(block.content?.options || ['']);
        } else if (block.type === 'survey') {
            setSurveyQuestions(block.content?.questions || [{ type: 'text', title: '', options: [''] }]);
        }

        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingBlockId) {
            // Update existing block
            const updated = blocks.map(b => {
                if (b.id === editingBlockId) {
                    return {
                        ...b,
                        type: activeType,
                        title: quizTitle || `${activeType} ブロック`,
                        content: activeType === 'survey' ? { questions: surveyQuestions } :
                            activeType === 'video' ? { url: quizBody } :
                                activeType === 'quiz' ? { body: quizBody, explanation: quizExplanation, options: quizOptions } : undefined
                    };
                }
                return b;
            });
            setBlocks(updated);
            storage.saveBlocks(params.categoryId, updated);
            showToast('ブロックを更新しました', 'success');
        } else {
            // Create New Block
            const newBlock: Block = {
                id: Math.random().toString(36).substr(2, 9),
                type: activeType,
                title: quizTitle || `${activeType} ブロック`,
                content: activeType === 'survey' ? { questions: surveyQuestions } :
                    activeType === 'video' ? { url: quizBody } :
                        activeType === 'quiz' ? { body: quizBody, explanation: quizExplanation, options: quizOptions } : undefined
            };
            const updated = [...blocks, newBlock];
            setBlocks(updated);
            storage.saveBlocks(params.categoryId, updated);

            // Update category block count in parent storage
            const categories: Category[] = storage.getCategories(params.id);
            const updatedCategories = categories.map((cat: Category) =>
                cat.id === params.categoryId ? { ...cat, blockCount: updated.length } : cat
            );
            storage.saveCategories(params.id, updatedCategories);
            showToast('ブロックを作成しました', 'success');
        }

        setIsModalOpen(false);
        setEditingBlockId(null);
        handleClearQuiz();
        setSelectedFile(null);
    };

    const handleDeleteBlock = (id: string) => {
        if (confirm('ブロックを削除しますか？')) {
            const updated = blocks.filter(b => b.id !== id);
            setBlocks(updated);
            storage.saveBlocks(params.categoryId, updated);

            const categories: Category[] = storage.getCategories(params.id);
            const updatedCategories = categories.map(cat =>
                cat.id === params.categoryId ? { ...cat, blockCount: updated.length } : cat
            );
            storage.saveCategories(params.id, updatedCategories);
            showToast('ブロックを削除しました', 'error');
        }
    };

    const renderModalContent = () => {
        switch (activeType) {
            case 'video':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>動画教材（YouTube限定公開URL）を追加できます。</p>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>動画タイトル</label>
                            <input
                                type="text"
                                placeholder="動画タイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>YouTube URL</label>
                            <input
                                type="text"
                                placeholder="https://youtu.be/..."
                                className={styles.modalInput}
                                value={quizBody} // Reusing quizBody as URL storage to avoid new state if possible, or add new state.
                                // Actually, let's check if there is a proper state for URL.
                                // The original code didn't seem to have a dedicated URL state, mostly mocked.
                                // Let's use quizBody as URL for now since it's a string, or add new state.
                                onChange={(e) => setQuizBody(e.target.value)}
                            />
                            <p className={styles.note}>※限定公開URLを入力してください。</p>
                        </div>

                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> サムネイル画像を設定する</label>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className={styles.modalContentArea}>
                        <div className={styles.contentHeader}>
                            <p>練習問題や確認問題を作成できます。</p>
                            <button className={styles.clearBtn} onClick={handleClearQuiz}>クリア</button>
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="問題タイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.inputGroup}>
                            <textarea
                                placeholder="問題文"
                                className={styles.modalTextarea}
                                value={quizBody}
                                onChange={(e) => setQuizBody(e.target.value)}
                            />
                        </div>
                        <div className={styles.quizSection}>
                            <h4 className={styles.sectionTitle}>回答用の選択肢</h4>
                            <p className={styles.sectionSub}>問題に対する選択肢を作成し、正解の選択肢にチェックを入れてください</p>
                            <div className={styles.optionsList}>
                                {quizOptions.map((opt, i) => (
                                    <div key={i} className={styles.optionItem}>
                                        <input type="radio" name="correct" />
                                        <input
                                            type="text"
                                            placeholder="選択肢の一文を入力してください"
                                            className={styles.modalInput}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...quizOptions];
                                                newOptions[i] = e.target.value;
                                                setQuizOptions(newOptions);
                                            }}
                                        />
                                        <button className={styles.deleteOption} onClick={() => handleDeleteOption(i)}>削除</button>
                                    </div>
                                ))}
                            </div>
                            <button className={styles.addOptionBtn} onClick={() => setQuizOptions([...quizOptions, ''])}>＋ 選択肢を追加</button>
                        </div>
                        <div className={styles.inputGroup}>
                            <textarea
                                placeholder="問題の解説"
                                className={styles.modalTextarea}
                                value={quizExplanation}
                                onChange={(e) => setQuizExplanation(e.target.value)}
                            />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                        </div>
                    </div>
                );
            case 'link':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>外部のサイトや参考記事などのURLを追加できます。</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="リンクタイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.inputGroup}>
                            <input type="text" placeholder="リンクURL" className={styles.modalInput} />
                        </div>
                        <div className={styles.inputGroup}>
                            <textarea placeholder="補足説明" className={styles.modalTextarea} />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                            <label className={styles.checkLabel}><input type="checkbox" /> 感想の提出を要求する</label>
                        </div>
                        <p className={styles.note}>チェックするとカテゴリーを完了するのに感想提出が必要となります。</p>
                    </div>
                );
            case 'text':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>ブロックとブロックの間に短いテキストを差し込めます。受講生はテキストを読んで、確認をするだけでこのブロックを完了できます。</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="タイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.inputGroup}>
                            <textarea placeholder="テキスト" className={styles.modalTextarea} />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                            <label className={styles.checkLabel}><input type="checkbox" /> 感想の提出を要求する</label>
                        </div>
                        <p className={styles.note}>チェックするとカテゴリーを完了するのに感想提出が必要となります。</p>
                    </div>
                );
            case 'article':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>記事コンテンツを作成できます。</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="記事タイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.inputGroup}>
                            <textarea placeholder="記事本文" className={styles.modalTextarea} style={{ height: '300px' }} />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                            <label className={styles.checkLabel}><input type="checkbox" /> 感想の提出を要求する</label>
                        </div>
                    </div>
                );
            case 'pdf':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>PDF教材をアップロードできます。</p>
                        <div className={styles.uploadBox}>
                            {selectedFile ? (
                                <div className={styles.selectedFileInfo}>
                                    <span className={styles.fileIcon}>📂</span>
                                    <span className={styles.fileName}>{selectedFile}</span>
                                    <button className={styles.removeFile} onClick={() => setSelectedFile(null)}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <p>ここにPDFファイルをドラッグまたは、<br />ボタンを押してファイルを選択してください。</p>
                                    <div className={styles.uploadIcon}>📂</div>
                                    <button className={styles.uploadBtn} onClick={() => handleFileSelect('handout.pdf')}>＋ PDFを選択</button>
                                </>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="PDFタイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                        </div>
                    </div>
                );
            case 'audio':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>音声教材をアップロードできます。</p>
                        <div className={styles.uploadBox}>
                            {selectedFile ? (
                                <div className={styles.selectedFileInfo}>
                                    <span className={styles.fileIcon}>🔊</span>
                                    <span className={styles.fileName}>{selectedFile}</span>
                                    <button className={styles.removeFile} onClick={() => setSelectedFile(null)}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <p>ここに音声ファイルをドラッグまたは、<br />ボタンを押してファイルを選択してください。</p>
                                    <div className={styles.uploadIcon}>🔊</div>
                                    <button className={styles.uploadBtn} onClick={() => handleFileSelect('audio_lesson.mp3')}>＋ 音声を選択</button>
                                </>
                            )}
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="音声タイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                        </div>
                    </div>
                );
            case 'survey':
                return (
                    <div className={styles.modalContentArea}>
                        <p className={styles.modalHelp}>受講生へのアンケートを作成できます。</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="アンケートタイトル"
                                className={styles.modalInput}
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                            />
                            <span className={styles.charCount}>{quizTitle.length} / 100</span>
                        </div>

                        <div className={styles.surveyQuestionsList}>
                            {surveyQuestions.map((q, i) => (
                                <div key={i} className={styles.surveyQuestionItem}>
                                    <div className={styles.questionHeader}>
                                        <span className={styles.questionIndex}>質問 {i + 1}</span>
                                        <select
                                            className={styles.questionTypeSelect}
                                            value={q.type}
                                            onChange={(e) => {
                                                const updated = [...surveyQuestions];
                                                updated[i].type = e.target.value;
                                                setSurveyQuestions(updated);
                                            }}
                                        >
                                            <option value="text">記述式</option>
                                            <option value="radio">単一選択</option>
                                            <option value="checkbox">複数選択</option>
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="質問文を入力してください"
                                        className={styles.modalInput}
                                        value={q.title}
                                        onChange={(e) => {
                                            const updated = [...surveyQuestions];
                                            updated[i].title = e.target.value;
                                            setSurveyQuestions(updated);
                                        }}
                                    />
                                    {(q.type === 'radio' || q.type === 'checkbox') && (
                                        <div className={styles.surveyOptions}>
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className={styles.surveyOptionItem}>
                                                    <input
                                                        type="text"
                                                        placeholder={`選択肢 ${oi + 1}`}
                                                        className={styles.modalInput}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...surveyQuestions];
                                                            updated[i].options[oi] = e.target.value;
                                                            setSurveyQuestions(updated);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                className={styles.addSurveyOption}
                                                onClick={() => {
                                                    const updated = [...surveyQuestions];
                                                    updated[i].options.push('');
                                                    setSurveyQuestions(updated);
                                                }}
                                            >＋ 選択肢を追加</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className={styles.addQuestionBtn} onClick={handleAddSurveyQuestion}>＋ 質問を追加</button>

                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkLabel}><input type="checkbox" /> 受講生のカテゴリー完了ステータスを維持する</label>
                            <label className={styles.checkLabel}><input type="checkbox" /> 回答を必須にする</label>
                        </div>
                    </div>
                );
            default:
                return <div className={styles.modalContentArea}>構築中...</div>;
        }
    };

    const getBlockIcon = (type: string) => {
        return blockTypes.find(t => t.id === type)?.icon || '❓';
    };

    return (
        <div className={styles.container}>
            {/* ... previous breadcrumb and alert ... */}
            {/* Plan Alert Removed */}

            <div className={styles.breadcrumb}>
                <div className={styles.breadcrumbLink}>
                    <Link href="/admin/courses">コース一覧</Link> /
                    <Link href={`/admin/courses/${params.id}`}> コース詳細</Link> / ブロック編集
                </div>
                <Link href={`/student/courses/${params.id}/categories/${params.categoryId}`} className={styles.previewAsStudent} target="_blank">
                    <span className={styles.previewIcon}>👁️</span> 受講生として表示
                </Link>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>ブロック編集</h1>
                <p className={styles.subtitle}>このカテゴリーの内容を追加していきましょう！</p>
            </div>

            <div className={styles.statsCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.categoryTitle}>サブ</span>
                    <button className={styles.previewBtn} onClick={handlePreview}>
                        <span className={styles.previewIcon}>👁️</span> プレビュー
                    </button>
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.mainStat}>
                        講座ブロック数 <span className={styles.mainStatNum}>{blocks.length}</span>
                    </div>

                    <div className={styles.statsGrid}>
                        {blockTypes.map(bt => (
                            <div key={bt.id} className={styles.statItem}>
                                <span className={styles.statIcon}>{bt.icon}</span> {bt.label}
                                <span className={styles.statNum}>{blocks.filter(b => b.type === bt.id).length}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.actionRow}>
                <button className={styles.addBlockTopBtn} onClick={() => setIsModalOpen(true)}>
                    <span className={styles.plusIcon}>✚</span> ブロックを追加
                </button>
            </div>

            <div className={styles.blocksList}>
                {blocks.map((block, index) => (
                    <div key={block.id} className={styles.blockItem}>
                        <div className={styles.blockIndex}>{index + 1}</div>
                        <div className={styles.blockIconMain}>{getBlockIcon(block.type)}</div>
                        <div className={styles.blockInfo}>
                            <div className={styles.blockTitle}>{block.title}</div>
                            <div className={styles.blockTypeLabel}>{blockTypes.find(t => t.id === block.type)?.label}</div>
                        </div>
                        <div className={styles.blockActions}>
                            <button className={styles.blockActionBtn} onClick={() => handleEditBlock(block)}>編集</button>
                            <button className={styles.blockActionBtn} onClick={() => handleDeleteBlock(block.id)}>削除</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Block Creation Modal (Images 4-7) */}
            {isModalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.detailedModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalSidebar}>
                            {blockTypes.map(type => (
                                <button
                                    key={type.id}
                                    className={`${styles.sidebarItem} ${activeType === type.id ? styles.sidebarActive : ''}`}
                                    onClick={() => setActiveType(type.id)}
                                >
                                    <span className={styles.typeIcon}>{type.icon}</span>
                                    <span className={styles.typeLabel}>{type.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className={styles.modalMain}>
                            {renderModalContent()}
                            <div className={styles.modalFooter}>
                                <button className={styles.modalCancelBtn} onClick={() => { setIsModalOpen(false); setEditingBlockId(null); }}>キャンセル</button>
                                <button className={styles.modalSaveBtn} onClick={handleSave}>保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className={styles.modalBackdrop} style={{ zIndex: 2000 }}>
                    <div className={styles.detailedModal} style={{ width: '800px', height: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>プレビュー (受講生視点)</h2>
                            <button onClick={() => setIsPreviewOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, background: '#fff' }}>
                            <BlockRenderer block={getPreviewBlock()} />
                            <div style={{ marginTop: '20px', padding: '10px', background: '#f8fafc', fontSize: '0.8rem', color: '#666' }}>
                                ※ これはプレビューです。実際の表示は端末サイズにより異なる場合があります。
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
