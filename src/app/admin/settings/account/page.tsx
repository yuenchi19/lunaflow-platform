"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastContext";
import { Lock } from "lucide-react";

export default function AccountSettingsPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const { showToast } = useToast();
    const supabase = createClient();

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;

        setEmailLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            showToast("確認メールを送信しました。新しいメールアドレスを確認してください。", "success");
            setNewEmail("");
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "メールアドレスの変更に失敗しました", "error");
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("パスワードが一致しません", "error");
            return;
        }

        if (password.length < 6) {
            showToast("パスワードは6文字以上で設定してください", "error");
            return;
        }

        setPasswordLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            showToast("パスワードを変更しました", "success");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "パスワードの変更に失敗しました", "error");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">アカウント設定</h1>

            {/* Email Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <span className="text-xl">✉️</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">メールアドレス変更</h2>
                        <p className="text-xs text-slate-500">ログイン用のメールアドレスを変更します</p>
                    </div>
                </div>

                <form onSubmit={handleEmailUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            新しいメールアドレス
                        </label>
                        <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="new@example.com"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            ※ 変更後、新しいメールアドレスに確認メールが送信されます。リンクをクリックして変更を完了してください。
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={emailLoading || !newEmail}
                            className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {emailLoading ? "送信中..." : "変更確認メールを送信"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">パスワード変更</h2>
                        <p className="text-xs text-slate-500">新しいパスワードを設定します</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            新しいパスワード
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            placeholder="6文字以上"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            パスワードの確認
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            placeholder="もう一度入力してください"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full sm:w-auto bg-slate-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                        >
                            {passwordLoading ? "更新中..." : "パスワードを変更する"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
