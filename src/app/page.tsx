"use client";

import EmbeddableLoginForm from "@/components/EmbeddableLoginForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">

        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Copy */}
          <div className="text-center md:text-left space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight">
                Luna Flow
              </h1>
              <p className="text-xl md:text-2xl font-bold text-indigo-600">
                “捨てない選択”が、<br className="md:hidden" />未来を変える。
              </p>
            </div>

            <p className="text-slate-500 leading-relaxed max-w-md mx-auto md:mx-0">
              日本の「もったいない精神」から生まれた、<br />
              再現性の高いサブスク型スクール。
            </p>

            {/* Optional: Trust indicators or tags */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                # サステナブル
              </span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                # リペア技術
              </span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                # 物販ビジネス
              </span>
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div>
            <EmbeddableLoginForm />
          </div>
        </div>

      </main>

      <footer className="py-6 text-center text-xs text-slate-400 relative z-10">
        © 2024 Luna Flow. All rights reserved.
      </footer>
    </div>
  );
}
