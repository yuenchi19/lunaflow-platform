"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Heart, Image as ImageIcon, Send, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import Link from "next/link";

interface TimelinePost {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    user: {
        name: string | null;
        communityNickname: string | null;
        avatarUrl: string | null;
    };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
}

export default function TimelinePage() {
    const [posts, setPosts] = useState<TimelinePost[]>([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const { showToast } = useToast();

    // Simplify image upload for now: just a text input for URL or future implementation
    // For this MVP, we'll skip actual file upload to S3/Storage and just allow text or maybe a placeholder for "image upload coming soon"
    // Or if I really want to impress, I can use the existing image upload logic from Inventory if available, but that's complex.
    // Let's stick to text for now, maybe simple URL input if needed, but text is safer for MVP velocity.

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/student/timeline');
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePost = async () => {
        if (!newPostContent.trim()) return;

        setPosting(true);
        try {
            const res = await fetch('/api/student/timeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newPostContent }),
            });

            if (res.ok) {
                setNewPostContent("");
                showToast("投稿しました！", "success");
                fetchPosts();
            } else {
                showToast("投稿に失敗しました。", "error");
            }
        } catch (error) {
            showToast("エラーが発生しました。", "error");
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId: string) => {
        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
                };
            }
            return p;
        }));

        try {
            await fetch(`/api/student/timeline/${postId}/like`, { method: 'POST' });
        } catch (error) {
            console.error("Like failed", error);
            // Revert on error could be implemented here
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <header className="flex justify-between items-center py-4">
                    <h1 className="text-2xl font-bold text-slate-800">タイムライン</h1>
                    <Link href="/student/dashboard" className="text-sm text-indigo-600 hover:underline">
                        ダッシュボードへ戻る
                    </Link>
                </header>

                {/* Post Input */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <UserIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <textarea
                                className="w-full resize-none border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-base min-h-[80px]"
                                placeholder="活動の進捗や学びをシェアしよう..."
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                                <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full transition-colors disabled:opacity-50" disabled>
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handlePost}
                                    disabled={!newPostContent.trim() || posting}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    <Send className="w-4 h-4" />
                                    {posting ? "送信中..." : "投稿する"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Post Feed */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">読み込み中...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">まだ投稿がありません。一番乗りで投稿しよう！</div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                                <div className="flex gap-3 mb-3">
                                    {post.user.avatarUrl ? (
                                        <img src={post.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold">
                                            {post.user.name?.[0] || "?"}
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800">{post.user.name || "名無し"}</span>
                                            {post.user.communityNickname && (
                                                <span className="text-xs text-slate-500">@{post.user.communityNickname}</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-slate-700 whitespace-pre-wrap mb-4 pl-14">
                                    {post.content}
                                </div>

                                {/* Image display would go here */}

                                <div className="flex items-center gap-6 pl-14 pt-2 border-t border-slate-50">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-pink-500 font-bold' : 'text-slate-400 hover:text-pink-500'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                        <span>{post.likesCount}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>{post.commentsCount}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
