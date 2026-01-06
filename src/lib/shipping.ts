export type Carrier = 'jp' | 'ym' | 'sg';

export const PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const REGIONS: { [key: string]: string[] } = {
    'Hokkaido': ['北海道'],
    'Tohoku': ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    'Kanto': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '山梨県'], // Placing Yamanashi in Kanto or Shinetsu? Table said "Kanto... Yamanashi"
    'Shinetsu': ['新潟県', '長野県'],
    'Hokuriku': ['富山県', '石川県', '福井県'],
    'Tokai': ['岐阜県', '静岡県', '愛知県', '三重県'],
    'Kinki': ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    'Chugoku': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
    'Shikoku': ['徳島県', '香川県', '愛媛県', '高知県'],
    'Kyushu': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'],
    'Okinawa': ['沖縄県']
};

// Rate structure: [JP, YM, SG]
const RATES: { [key: string]: { jp: number, ym: number, sg: number } } = {
    'Hokkaido': { jp: 1200, ym: 1300, sg: 1250 },
    'Tohoku': { jp: 900, ym: 950, sg: 920 },
    'Kanto': { jp: 800, ym: 850, sg: 820 },
    'Shinetsu': { jp: 800, ym: 850, sg: 820 },
    'Hokuriku': { jp: 800, ym: 850, sg: 820 },
    'Tokai': { jp: 800, ym: 850, sg: 820 },
    'Kinki': { jp: 900, ym: 950, sg: 920 },
    'Chugoku': { jp: 1000, ym: 1050, sg: 1020 },
    'Shikoku': { jp: 1000, ym: 1050, sg: 1020 },
    'Kyushu': { jp: 1100, ym: 1150, sg: 1120 },
    'Okinawa': { jp: 1500, ym: 1800, sg: 1600 },
};

export function getShippingFee(prefecture: string, carrier: Carrier): number {
    // Normalize pref (handle missing '県' etc if needed, but assuming user selects from list)
    let regionKey = 'Kanto'; // Default fallback

    for (const [region, prefs] of Object.entries(REGIONS)) {
        if (prefs.some(p => prefecture.startsWith(p) || p.startsWith(prefecture))) {
            regionKey = region;
            break;
        }
    }

    const rates = RATES[regionKey];
    return rates[carrier] || 1000;
}
