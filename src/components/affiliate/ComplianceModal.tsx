"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { setComplianceAgreement } from "@/lib/data";

interface ComplianceModalProps {
    isOpen: boolean;
    onAgree: () => void;
    userId: string;
}

export default function ComplianceModal({ isOpen, onAgree, userId }: ComplianceModalProps) {
    const [checked, setChecked] = useState(false);

    if (!isOpen) return null;

    const handleAgree = async () => {
        if (!checked) return;
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreedToCompliance: true })
            });
            if (res.ok) {
                onAgree();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`エラーが発生しました: ${errData.error || res.statusText}`);
                console.error("Compliance Error:", errData);
            }
        } catch (e: any) {
            console.error("Compliance Net Error:", e);
            alert(`通信エラーが発生しました: ${e.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="bg-rose-50 p-6 border-b border-rose-100 flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-full text-rose-600 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-rose-900 mb-1">パートナー利用規約および遵守事項</h2>
                        <p className="text-sm text-rose-800">
                            パートナー（アフィリエイト）活動を行うにあたり、以下の規約に同意いただく必要があります。
                        </p>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第1条（目的）</h3>
                        <p>本規約は、合同会社結縁地（以下「甲」といいます）が提供するサービス「Luna Flow」（以下「本サービス」といいます）のパートナープラン（アフィリエイトプログラム）への参加条件および権利義務関係を定めるものです。パートナー（以下「乙」といいます）は、本規約に同意した上で本プランに登録するものとします。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第2条（パートナーの定義と登録）</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>パートナー</strong>とは、本サービスの「パートナープラン」に申し込み、所定の初期費用および月額費用を支払い、甲が承認した者を指す。</li>
                            <li>甲は、乙が過去に規約違反等を行っていた場合や、その他甲が不適切と判断した場合、登録を拒否または取り消すことができる。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第3条（費用）</h3>
                        <p>乙は、パートナーとしての権利（紹介リンクの発行、管理画面の利用、報酬の受領等）を維持するために、以下の費用を支払うものとする。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>初期登録費用</strong>：5,980円（税込）</li>
                            <li><strong>システム利用料（月額）</strong>：1,980円（税込）</li>
                        </ul>
                        <p className="mt-2 text-xs text-slate-500">※月額費用の支払いが滞った場合、甲は乙への報酬支払いを停止し、アカウントを一時停止または削除することができる。<br />支払い不可月に報酬が発生していた場合には、システム利用料を引いた金額の支払いで報酬を受け取ることが可能。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第4条（業務内容）</h3>
                        <p>乙は、甲が発行する専用の識別コード（アフィリエイトリンク）を使用し、SNS、ブログ、メールマガジン等の媒体を通じて本サービスを紹介し、新規会員の獲得を行うものとします。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第5条（報酬）</h3>
                        <p>甲は乙に対し、以下の条件に基づき成果報酬を支払います。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>直接紹介報酬</strong>：乙の紹介リンク経由で入会した会員（以下「紹介会員」）の支払額（月額会費および甲が指定する仕入れ代金等）の <strong>7%</strong>。</li>
                            <li><strong>育成報酬（2ティア）</strong>：乙が紹介したパートナーが獲得した会員の支払額の <strong>3%</strong>。</li>
                        </ul>
                        <p className="mt-2 text-xs text-slate-500">
                            <strong>計算対象</strong>：消費税別の売上金額に対し、上記の料率を乗じて計算する。<br />
                            <strong>対象外</strong>：会員の決済が正常に完了しなかった場合、報酬は発生しない。パートナーのシステム利用料。
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第6条（支払条件）</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>締め日</strong>：毎月末日とします。</li>
                            <li><strong>支払日</strong>：締め日の翌月15日（土日祝の場合は翌営業日）に、乙が指定する銀行口座へ振り込み。</li>
                            <li><strong>振込手数料</strong>：甲が負担</li>
                            <li><strong>最低支払額</strong>：報酬の支払いは、未払報酬の合計が2,000円以上となった時点で支払いをする。</li>
                            <li><strong>登録銀行</strong>：ゆうちょ銀行での登録は不可。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第7条（禁止事項）</h3>
                        <p>乙は、以下の行為を行ってはなりません。違反が発覚した場合、甲は即時にパートナー契約を解除し、未払いの報酬全額を没収することができます。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>虚偽・誇大広告</strong>：「100%稼げる」「絶対に損しない」「何もしなくて良い」等、事実と異なる、または著しく誤認させる表現を用いること。</li>
                            <li><strong>スパム行為</strong>：SNSのコメント欄への無差別な書き込み、面識のない第三者への無理なDM送信、掲示板荒らし等、迷惑となる行為。</li>
                            <li><strong>法令違反</strong>：景品表示法、特定商取引法、その他関連法令に違反する行為。</li>
                            <li><strong>なりすまし</strong>：甲の運営スタッフや公式アカウントであるかのように装うこと。</li>
                            <li><strong>公序良俗違反</strong>：アダルト、暴力、差別的なコンテンツを含む媒体での紹介。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第8条（契約の解除・資格喪失）</h3>
                        <p>乙が本規約に違反した場合、またはパートナープランの月額費用の支払いを停止した場合、甲は催告なく乙のパートナー資格を剥奪できるものとします。資格喪失後は、将来にわたって発生するはずであった継続報酬（ストック報酬）を受け取る権利も消滅します。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第9条（秘密保持）</h3>
                        <p>乙は、本契約を通じて知り得た甲の技術上、営業上の秘密情報を第三者に漏洩してはなりません。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第10条（規約の変更）</h3>
                        <p>甲は、必要と認めた場合、乙に事前に通知することなく本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点から効力を生じるものとします。</p>
                    </section>

                    <section>
                        <h3 className="font-bold border-b border-slate-200 pb-1 mb-2">第11条（管轄裁判所）</h3>
                        <p>本契約に関し紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
                    </section>

                    <p className="text-right text-xs text-slate-400 mt-8">最終更新日：2026年1月3日</p>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors mb-4">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-slate-50'}`}>
                            {checked && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                        />
                        <span className={`text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-500'}`}>
                            上記の内容を確認し、同意します
                        </span>
                    </label>

                    <button
                        onClick={handleAgree}
                        disabled={!checked}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${checked
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        同意してダッシュボードへ進む
                    </button>
                </div>
            </div>
        </div>
    );
}
