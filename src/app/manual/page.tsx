import { Metadata } from 'next';
import { Book, PlayCircle, MessageSquare, User, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: '受講生マニュアル | LunaFlow',
    description: 'LunaFlowの基本的な使い方をご案内します。',
};

export default function ManualPage() {
    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <Book className="w-12 h-12 mx-auto mb-4 text-rose-500" />
                    <h1 className="text-3xl font-bold font-serif mb-4">LunaFlow ご利用マニュアル</h1>
                    <p className="text-slate-300">受講の進め方や、コミュニティの活用方法について</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Sidebar Navigation (Sticky) */}
                <div className="hidden md:block col-span-1">
                    <div className="sticky top-24 space-y-2">
                        <p className="font-bold text-slate-900 mb-4 px-3">目次</p>
                        <a href="#course-flow" className="block px-3 py-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-sm">
                            1. コース受講の流れ
                        </a>
                        <a href="#feedback" className="block px-3 py-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-sm">
                            2. 感想の提出と承認
                        </a>
                        <a href="#community" className="block px-3 py-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-sm">
                            3. コミュニティ機能
                        </a>
                        <a href="#account" className="block px-3 py-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-sm">
                            4. アカウント設定
                        </a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-1 md:col-span-2 space-y-16">

                    {/* Section 1 */}
                    <section id="course-flow" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">1</div>
                            <h2 className="text-2xl font-bold text-slate-900">コース受講の流れ</h2>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex gap-4">
                                <PlayCircle className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">動画講義を視聴する</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        コース一覧またはマイページから受講したいコースを選択します。<br />
                                        各レッスンの動画は最後まで視聴することで、学習完了とみなされます。
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">ステップごとの進捗</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        レッスンは「ブロック」単位で構成されています。<br />
                                        前のブロックを完了しないと、次のブロックへ進むことはできません。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section id="feedback" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">2</div>
                            <h2 className="text-2xl font-bold text-slate-900">感想の提出と承認</h2>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                各カテゴリー（章）の最後には「アウトプット（感想提出）」のステップがあります。<br />
                                ここでの学びや気づきを投稿してください。
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900">
                                <strong>重要：承認制について</strong><br />
                                提出された感想は講師が確認し、「承認」されると次のカテゴリーが解放されます。<br />
                                内容が不十分な場合は「再提出」となることがあります。
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section id="community" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">3</div>
                            <h2 className="text-2xl font-bold text-slate-900">コミュニティ機能</h2>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex gap-4">
                                <MessageSquare className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">仲間と交流する</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        ヘッダーの「コミュニティ」から、他の受講生や講師とチャットができます。<br />
                                        質問や学習報告など、自由にご活用ください。
                                    </p>
                                </div>
                            </div>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 pl-2">
                                <li>一般チャンネル：雑談や自己紹介</li>
                                <li>学習サポート：学習内容に関する質問</li>
                                <li>通知機能：新着メッセージがあるとヘッダーにバッジがつきます</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section id="account" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">4</div>
                            <h2 className="text-2xl font-bold text-slate-900">アカウント設定</h2>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex gap-4">
                                <User className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">登録情報の変更</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        マイページから、お名前・メールアドレス・パスワードの変更が可能です。<br />
                                        プロフィール画像の設定もこちらから行えます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
