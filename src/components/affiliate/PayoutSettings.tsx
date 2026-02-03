"use client";

import { useState } from "react";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import AvatarUpload from "./AvatarUpload";

interface PayoutSettingsProps {
    user: User;
    onUpdate?: () => void;
}

export default function PayoutSettings({ user, onUpdate }: PayoutSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            avatarUrl: formData.get('avatarUrl'), // Added avatarUrl
            bankName: formData.get('bankName'),
            bankBranch: formData.get('bankBranch'),
            bankAccountType: formData.get('bankAccountType'),
            bankAccountNumber: formData.get('bankAccountNumber'),
            bankAccountHolder: formData.get('bankAccountHolder'),
            invoiceRegistrationNumber: formData.get('invoiceRegistrationNumber'),
        };

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('保存に失敗しました');

            setMessage({ type: 'success', text: '口座情報を保存しました' });
            if (onUpdate) onUpdate(); // Call callback
        } catch (error) {
            setMessage({ type: 'error', text: 'エラーが発生しました' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">報酬振込先設定</h2>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Profile Edit Section (Requested) */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span>👤</span> プロフィール情報
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-2">プロフィール画像</label>
                            <AvatarUpload
                                currentAvatarUrl={user.avatarUrl ?? null}
                                onUploadComplete={(url) => {
                                    // Update hidden input or state if needed, but we'll submit it with form via hidden input
                                    // or just let a separate call handle it? 
                                    // Implementation Plan said API update. Let's use a hidden input to submit with the form for simplicity 
                                    // OR update state to submit.
                                    const input = document.getElementById('avatarUrlInput') as HTMLInputElement;
                                    if (input) input.value = url;
                                }}
                            />
                            <input type="hidden" name="avatarUrl" id="avatarUrlInput" defaultValue={user.avatarUrl || ''} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">お名前</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={user.name || ''}
                                className="w-full p-2 border border-slate-200 rounded outline-none focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">銀行名</label>
                        <input
                            name="bankName"
                            type="text"
                            defaultValue={user.bankName || ''}
                            placeholder="例）三井住友銀行"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Branch Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">支店名</label>
                        <input
                            name="bankBranch"
                            type="text"
                            defaultValue={user.bankBranch || ''}
                            placeholder="例）渋谷支店"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">口座種別</label>
                        <select
                            name="bankAccountType"
                            defaultValue={user.bankAccountType || 'ordinary'}
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                        >
                            <option value="ordinary">普通</option>
                            <option value="current">当座</option>
                        </select>
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">口座番号</label>
                        <input
                            name="bankAccountNumber"
                            type="text"
                            defaultValue={user.bankAccountNumber || ''}
                            placeholder="1234567"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Account Holder */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">口座名義（カタカナ）</label>
                        <input
                            name="bankAccountHolder"
                            type="text"
                            defaultValue={user.bankAccountHolder || ''}
                            placeholder="例）ヤマダ タロウ"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Invoice Number (Optional) */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            インボイス登録番号 <span className="text-xs font-normal text-slate-400 ml-1">（任意 / Optional）</span>
                        </label>
                        <input
                            name="invoiceRegistrationNumber"
                            type="text"
                            defaultValue={user.invoiceRegistrationNumber || ''}
                            placeholder="例）T1234567890123"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        保存する
                    </button>
                </div>
            </form>
        </div>
    );
}
