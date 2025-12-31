import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ShippingCostsPage() {
    return (
        <div className="min-h-screen bg-[#FDFCFB] p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link href="/student/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span>ダッシュボードに戻る</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">配送料金一覧</h1>
                    <p className="text-sm text-slate-500 mt-2">
                        お住まいの地域と配送業者ごとの送料一覧です。
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="p-4 font-bold">地域</th>
                                <th className="p-4 font-bold text-red-600">日本郵便 (JP)</th>
                                <th className="p-4 font-bold text-yellow-600">ヤマト運輸 (YM)</th>
                                <th className="p-4 font-bold text-blue-600">佐川急便 (SG)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {/* Dummy Data matching the image request roughly */}
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">北海道</td>
                                <td className="p-4">¥1,200</td>
                                <td className="p-4">¥1,300</td>
                                <td className="p-4">¥1,250</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">東北 (青森/岩手/秋田/宮城/山形/福島)</td>
                                <td className="p-4">¥900</td>
                                <td className="p-4">¥950</td>
                                <td className="p-4">¥920</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">関東 (東京/神奈川/埼玉/千葉/茨城/栃木/群馬/山梨)</td>
                                <td className="p-4">¥800</td>
                                <td className="p-4">¥850</td>
                                <td className="p-4">¥820</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">信越 (新潟/長野)</td>
                                <td className="p-4">¥800</td>
                                <td className="p-4">¥850</td>
                                <td className="p-4">¥820</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">北陸 (富山/石川/福井)</td>
                                <td className="p-4">¥800</td>
                                <td className="p-4">¥850</td>
                                <td className="p-4">¥820</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">東海 (静岡/愛知/岐阜/三重)</td>
                                <td className="p-4">¥800</td>
                                <td className="p-4">¥850</td>
                                <td className="p-4">¥820</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">近畿 (大阪/京都/兵庫/奈良/和歌山/滋賀)</td>
                                <td className="p-4">¥900</td>
                                <td className="p-4">¥950</td>
                                <td className="p-4">¥920</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">中国 (鳥取/島根/岡山/広島/山口)</td>
                                <td className="p-4">¥1,000</td>
                                <td className="p-4">¥1,050</td>
                                <td className="p-4">¥1,020</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">四国 (徳島/香川/愛媛/高知)</td>
                                <td className="p-4">¥1,000</td>
                                <td className="p-4">¥1,050</td>
                                <td className="p-4">¥1,020</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">九州 (福岡/佐賀/長崎/熊本/大分/宮崎/鹿児島)</td>
                                <td className="p-4">¥1,100</td>
                                <td className="p-4">¥1,150</td>
                                <td className="p-4">¥1,120</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-4 font-bold">沖縄</td>
                                <td className="p-4">¥1,500</td>
                                <td className="p-4">¥1,800</td>
                                <td className="p-4">¥1,600</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
