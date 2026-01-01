import { Lock } from "lucide-react";
import Link from "next/link";

interface LockOverlayProps {
    isLocked: boolean;
    title?: string;
    message?: string;
    children: React.ReactNode;
}

export default function LockOverlay({ isLocked, title, message, children }: LockOverlayProps) {
    if (!isLocked) return <>{children}</>;

    return (
        <div className="relative group">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 grayscale transition-all duration-500">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-50/10 backdrop-blur-[1px]">
                <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-slate-200 max-w-sm">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">
                        {title || "機能制限されています"}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        {message || "この機能は特定のカリキュラムを完了後に利用可能になります。"}
                    </p>
                    <Link href="/manual" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">
                        利用条件を確認する &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
