import { Lock } from "lucide-react";
import Link from "next/link";

interface LockOverlayProps {
    isLocked: boolean;
    title?: string;
    message?: string;
    children: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    actionLink?: string;
    blur?: 'none' | 'sm' | 'md' | 'lg'; // Added
}

export default function LockOverlay({ isLocked, title, message, children, actionLabel, onAction, actionLink, blur = 'sm' }: LockOverlayProps) {
    if (!isLocked) return <>{children}</>;

    const blurClass = {
        'none': '',
        'sm': 'blur-sm',
        'md': 'blur-md',
        'lg': 'blur-lg'
    }[blur];

    return (
        <div className="relative group overflow-hidden rounded-2xl">
            {/* Blurred Content */}
            <div className={`filter ${blurClass} select-none pointer-events-none opacity-60 grayscale-[50%] transition-all duration-500`}>
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-slate-50/20 backdrop-blur-[2px]">
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/60 w-full max-w-[90%] md:max-w-sm mx-auto ring-1 ring-slate-900/5">
                    <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 ring-1 ring-slate-200">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2 break-words">
                        {title || "機能制限されています"}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed break-words font-medium">
                        {message || "この機能は特定のカリキュラムを完了後に利用可能になります。"}
                    </p>

                    {actionLabel && actionLink ? (
                        <Link href={actionLink} className="block w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-200 text-sm mb-1">
                            {actionLabel}
                        </Link>
                    ) : actionLabel && onAction ? (
                        <button onClick={onAction} className="block w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-200 text-sm mb-1">
                            {actionLabel}
                        </button>
                    ) : (
                        <p className="text-xs font-bold text-slate-500 bg-slate-100/50 py-2 rounded-lg">
                            規定のカリキュラムを完了することで、<br />利用可能になります。
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
