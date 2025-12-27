"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function EmbeddableLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/student/dashboard");
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: email.split("@")[0],
                        },
                    },
                });
                if (error) throw error;
                setMessage("確認メールを送信しました。メール内のリンクから登録を完了してください。");
            }
        } catch (err: any) {
            setError(err.message || "エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
            {/* Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 mb-8">
                <button
                    onClick={() => { setMode('login'); setError(""); setMessage(""); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LogIn className="w-4 h-4" />
                    ログイン
                </button>
                <button
                    onClick={() => { setMode('signup'); setError(""); setMessage(""); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserPlus className="w-4 h-4" />
                    新規登録
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
                {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold">{error}</div>}
                {message && <div className="p-3 rounded-lg bg-green-50 text-green-600 text-xs font-bold">{message}</div>}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">メールアドレス</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                            placeholder="mail@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">パスワード</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group mt-6"
                >
                    {isLoading ? "処理中..." : (mode === 'login' ? "ログインして始める" : "無料でアカウント作成")}
                    {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 mt-4">
                        保護された通信で安全にログインできます
                    </p>
                </div>
            </form>
        </div>
    );
}
