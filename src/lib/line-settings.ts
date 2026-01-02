export interface LineSettings {
    enabled: boolean;
    reminderDays: number;
    reminderMessage: string;
}

const DEFAULT_SETTINGS: LineSettings = {
    enabled: false,
    reminderDays: 7,
    reminderMessage: "こんにちは！LunaFlow事務局です。\n学習の進み具合はいかがでしょうか？\nもし操作方法や内容で分からないことがあれば、このLINEでいつでも質問してくださいね！\n\n▼ 学習を再開する\nhttps://www.lunaflow.space/"
};

export function getLineSettings(): LineSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem('luna_line_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}

export function saveLineSettings(settings: LineSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('luna_line_settings', JSON.stringify(settings));
}
