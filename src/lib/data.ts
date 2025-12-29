import { Course, Category, Block, Feedback, User, UserProgress, Student, SentEmail, Plan, AffiliateEarnings, Payment, ProgressDetail } from "@/types";

export const MOCK_USERS: User[] = [
    {
        id: "u1",
        name: "山田 太郎",
        email: "alice@example.com",
        role: "student",
        plan: "premium",
        subscriptionStatus: "active",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        affiliateCode: "ALICE001",
        registrationDate: "2025-05-01", // 7+ months
        lifetimePurchaseTotal: 250000,
        address: "〒100-0001 東京都千代田区千代田1-1",
        phoneNumber: "090-1234-5678",
    },
    {
        id: "u2",
        name: "鈴木 先生",
        email: "bob@example.com",
        role: "admin",
        plan: "premium",
        subscriptionStatus: "active",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
    {
        id: "u3",
        name: "佐藤 花子",
        email: "hanako@example.com",
        role: "student",
        plan: "premium",
        subscriptionStatus: "active",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hanako",
        affiliateCode: "HANAKO001",
        referredBy: "ALICE001",
        registrationDate: "2025-11-01", // New user
        lifetimePurchaseTotal: 50000,
    },
    {
        id: "u4",
        name: "スタッフ A",
        email: "staff@example.com",
        role: "staff",
        plan: "standard",
        subscriptionStatus: "active",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Staff",
    },
    {
        id: "u5",
        name: "鈴木 一郎",
        email: "ichiro@example.com",
        role: "student",
        plan: "light",
        subscriptionStatus: "active",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ichiro",
        referredBy: "HANAKO001",
        registrationDate: "2025-01-01", // Almost done
        lifetimePurchaseTotal: 1000000, // Achieved
    },
];

// -- User Persistence Helpers --
export function getUsers(): User[] {
    if (typeof window === 'undefined') return MOCK_USERS;
    const stored = localStorage.getItem("luna_users");
    if (!stored) {
        // Initialize
        localStorage.setItem("luna_users", JSON.stringify(MOCK_USERS));
        return MOCK_USERS;
    }
    const users = JSON.parse(stored);

    // Merge any missing mock users (in case code updated with new mocks)
    // This is optional but good for dev
    if (users.length < MOCK_USERS.length) {
        return MOCK_USERS;
    }
    return users;
}

export function updateUser(updatedUser: User) {
    if (typeof window === 'undefined') return;
    const users = getUsers();
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem("luna_users", JSON.stringify(newUsers));
}

export function getUserById(id: string): User | undefined {
    return getUsers().find(u => u.id === id);
}


export function getAffiliateEarnings(userId: string): AffiliateEarnings {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user || !user.affiliateCode) return { directReferrals: 0, indirectReferrals: 0, monthlyEarnings: 0 };

    let directCount = 0;
    let indirectCount = 0;
    let totalEarnings = 0;

    // Simulate mock revenue based on plan
    const getPlanValue = (plan: Plan) => {
        if (plan === 'premium') return 29800;
        if (plan === 'standard') return 9800;
        return 0; // Light plan has no affiliate revenue sharing in this model (or maybe it does? Assuming yes for now if they pay)
    };

    // Level 1: Direct Referrals (7%)
    const directReferrals = MOCK_USERS.filter(u => u.referredBy === user.affiliateCode);
    directCount = directReferrals.length;

    directReferrals.forEach(direct => {
        // Assuming light plan also pays a fee, let's say 4980 for calculation, or 0 if free. 
        // For this mock, let's assume all plans generate revenue.
        // Light: 2980, Standard: 9800, Premium: 29800
        let revenue = 0;
        if (direct.plan === 'premium') revenue = 29800;
        else if (direct.plan === 'standard') revenue = 9800;
        else if (direct.plan === 'light') revenue = 2980;

        totalEarnings += Math.floor(revenue * 0.07);

        // Level 2: Indirect Referrals (3%)
        if (direct.affiliateCode) {
            const indirectReferrals = MOCK_USERS.filter(u => u.referredBy === direct.affiliateCode);
            indirectCount += indirectReferrals.length;

            indirectReferrals.forEach(indirect => {
                let indirectRevenue = 0;
                if (indirect.plan === 'premium') indirectRevenue = 29800;
                else if (indirect.plan === 'standard') indirectRevenue = 9800;
                else if (indirect.plan === 'light') indirectRevenue = 2980;

                totalEarnings += Math.floor(indirectRevenue * 0.03);
            });
        }
    });

    return {
        directReferrals: directCount,
        indirectReferrals: indirectCount,
        monthlyEarnings: totalEarnings
    };
}

export function getAffiliates(): User[] {
    return MOCK_USERS.filter(u => !!u.affiliateCode);
}

export function getAllAffiliateStats() {
    const affiliates = getAffiliates();
    let totalPendingPayout = 0;

    const stats = affiliates.map(affiliate => {
        const earnings = getAffiliateEarnings(affiliate.id);
        totalPendingPayout += earnings.monthlyEarnings;
        return {
            ...affiliate,
            earnings
        };
    });

    return {
        affiliates: stats,
        totalPendingPayout
    };
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
}

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: "a1",
        title: "年末年始のサポート体制について",
        content: "12月28日から1月4日までサポート業務をお休みさせていただきます。",
        date: "2025-12-22",
    },
    {
        id: "a2",
        title: "新コース「アドバンス・デザイン」公開！",
        content: "新しいデザイン講座が追加されました。マイベージより受講可能です。",
        date: "2025-12-15",
    }
];

export function getAnnouncements(): Announcement[] {
    return MOCK_ANNOUNCEMENTS;
}

export const MOCK_COURSES: Course[] = [
    {
        id: "course1",
        title: "テスト",
        description: "テスト講座へようこそ！まずは動画をご覧いただき、それから受講を開始してください！",
        thumbnailUrl: "https://picsum.photos/seed/course/800/450",
        expirationDate: "2026/03/21",
    }
];

// Mock Stripe Price IDs for integration testing
export const STRIPE_PRICES = {
    light: "price_1Sio8JEG3Sato8fA5bGnbvkD",
    standard: "price_1SMk15EG3Sato8fAltFsa5AQ",
    premium: "price_1Sio8pEG3Sato8fA1E7RxhW6",
};

export const STRIPE_INITIAL_FEE_PRICE_ID = "price_1S0douEG3Sato8fAOcBAGw1X";

export const MOCK_CATEGORIES: Category[] = [
    {
        id: "cat1",
        courseId: "course1",
        title: "サブ",
        order: 1,
        description: "基本のステップです。",
    },
    {
        id: "cat2",
        courseId: "course1",
        title: "サブ 2",
        order: 2,
        description: "応用のステップです。",
    }
];

export const MOCK_BLOCKS: Block[] = [
    {
        id: "b1",
        categoryId: "cat1",
        title: "テスト",
        type: "video",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        content: "どんなことができるのか？？",
        order: 1,
    },
    {
        id: "b2",
        categoryId: "cat2",
        title: "【奇跡】人生初のクリスマスマーケットで...",
        type: "video",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Dummy
        content: "動画を見て学習しましょう",
        order: 1,
        correctionType: 'ai', // Set this block to AI for testing
    }
];

export const MOCK_CHANNELS: import("@/types").Channel[] = [
    // --- WELCOME (Onboarding) ---
    {
        id: "c1",
        name: "はじめに①",
        description: "コミュニティのルールを確認しましょう。",
        allowedPlans: ["light", "standard", "premium"],
        category: "WELCOME",
    },
    {
        id: "c2",
        name: "はじめに②",
        description: "学習の進め方について。",
        allowedPlans: ["light", "standard", "premium"], // Adjusted to be accessible to all for onboarding flow continuity
        category: "WELCOME",
    },

    // --- 実践エリア (Practice Area) ---

    {
        id: "c_practice_2",
        name: "今日の売上報告",
        description: "日々の売上を報告しましょう！",
        allowedPlans: ["standard", "premium"],
        category: "実践エリア",
    },
    {
        id: "c_practice_3",
        name: "成功事例アーカイブ",
        description: "成功した事例を共有・閲覧できます。",
        allowedPlans: ["standard", "premium"],
        category: "実践エリア",
    },
    {
        id: "c_practice_5",
        name: "困った時のお悩み相談",
        description: "学習や実践での悩み相談。",
        allowedPlans: ["light", "standard", "premium"],
        category: "実践エリア",
    },
    {
        id: "c_practice_4",
        name: "リペア実践",
        description: "リペア技術に関する実践報告。",
        allowedPlans: ["standard", "premium"],
        category: "実践エリア",
    },

    // --- 成果 (Results) ---
    {
        id: "c_result_1",
        name: "今週の売上",
        description: "週ごとの売上成果。",
        allowedPlans: ["standard", "premium"],
        category: "成果",
    },
    {
        id: "c_result_2",
        name: "ランキング発表",
        description: "売上ランキングの発表。",
        allowedPlans: ["standard", "premium"],
        category: "成果",
    },
    {
        id: "c_result_3",
        name: "今週の売上TOP3",
        description: "トップ3の発表。",
        allowedPlans: ["standard", "premium"],
        category: "成果",
    },

    // --- 在庫ヘッジ (Inventory Hedge) ---
    {
        id: "c_hedge_1",
        name: "スタートアップ",
        description: "在庫管理の基礎。",
        allowedPlans: ["standard", "premium"],
        category: "在庫ヘッジ",
    },
    {
        id: "c_hedge_2",
        name: "在庫シェア・委託",
        description: "在庫のシェアや委託販売について。",
        allowedPlans: ["standard", "premium"],
        category: "在庫ヘッジ",
    },
];

export const MOCK_MESSAGES: import("@/types").Message[] = [
    {
        id: "m1",
        channelId: "c1",
        userId: "u1",
        content: "こんにちは！Reactの勉強を始めました。",
        createdAt: "2025-12-20T10:00:00Z",
    },
];

// Helper to get all categories for a course
export function getCategories(courseId: string): Category[] {
    return MOCK_CATEGORIES.filter(c => c.courseId === courseId).sort((a, b) => a.order - b.order);
}

// Helper to get blocks for a category
export function getBlocks(categoryId: string): Block[] {
    return MOCK_BLOCKS.filter(b => b.categoryId === categoryId).sort((a, b) => a.order - b.order);
}

// Global Feedbacks (using localStorage for simulation)
export function getFeedbacks(): Feedback[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem("luna_feedbacks");
    return saved ? JSON.parse(saved) : [];
}

export function submitFeedback(feedback: Omit<Feedback, "id" | "submittedAt" | "status">) {
    if (typeof window === 'undefined') return;
    const feedbacks = getFeedbacks();
    const newFeedback: Feedback = {
        ...feedback,
        id: `f_${Date.now()}`,
        status: "pending",
        submittedAt: new Date().toISOString(),
    };
    localStorage.setItem("luna_feedbacks", JSON.stringify([...feedbacks, newFeedback]));
}

export function updateFeedbackStatus(feedbackId: string, status: Feedback['status'], staffComment?: string) {
    if (typeof window === 'undefined') return;
    const feedbacks = getFeedbacks();
    const updated = feedbacks.map(f => f.id === feedbackId ? { ...f, status, staffComment, updatedAt: new Date().toISOString() } : f);
    localStorage.setItem("luna_feedbacks", JSON.stringify(updated));
}

// Helper to check if a block is completed (Feedback approved)
export function isBlockCompleted(userId: string, blockId: string): boolean {
    const feedbacks = getFeedbacks();
    return feedbacks.some(f => f.userId === userId && f.blockId === blockId && f.status === 'approved');
}

// Helper to check if a user can access a block (Sequential logic)
export function canAccessBlock(userId: string, blockId: string): boolean {
    const block = MOCK_BLOCKS.find(b => b.id === blockId);
    if (!block) return false;

    // Get all blocks in order
    const allBlocks = [...MOCK_BLOCKS].sort((a, b) => {
        const catA = MOCK_CATEGORIES.find(c => c.id === a.categoryId)!;
        const catB = MOCK_CATEGORIES.find(c => c.id === b.categoryId)!;
        if (catA.order !== catB.order) return catA.order - catB.order;
        return a.order - b.order;
    });

    const index = allBlocks.findIndex(b => b.id === blockId);
    if (index === 0) return true; // First block is always accessible

    // Check if the previous block is completed
    const prevBlock = allBlocks[index - 1];
    return isBlockCompleted(userId, prevBlock.id);
}

// Target Dates for Learning Plan
export function getTargetDates(userId: string): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(`luna_target_dates_${userId}`);
    return saved ? JSON.parse(saved) : {};
}

export function saveTargetDate(userId: string, categoryId: string, date: string) {
    if (typeof window === 'undefined') return;
    const dates = getTargetDates(userId);
    dates[categoryId] = date;
    localStorage.setItem(`luna_target_dates_${userId}`, JSON.stringify(dates));
}

// --- Traditional helpers adaptions ---

export function getChannels(): import("@/types").Channel[] {
    return MOCK_CHANNELS;
}

export function getMessages(channelId: string): import("@/types").Message[] {
    if (typeof window === 'undefined') return MOCK_MESSAGES.filter(m => m.channelId === channelId);
    const savedInputs = localStorage.getItem(`luna_messages_${channelId}`);
    const localMessages = savedInputs ? JSON.parse(savedInputs) : [];
    const mock = MOCK_MESSAGES.filter(m => m.channelId === channelId);
    const deletedIds = JSON.parse(localStorage.getItem(`luna_deleted_messages_${channelId}`) || "[]");
    return [...mock, ...localMessages].filter(m => !deletedIds.includes(m.id));
}

export function deleteMessage(channelId: string, messageId: string) {
    if (typeof window === 'undefined') return;
    const deletedIds = JSON.parse(localStorage.getItem(`luna_deleted_messages_${channelId}`) || "[]");
    localStorage.setItem(`luna_deleted_messages_${channelId}`, JSON.stringify([...deletedIds, messageId]));
}

export function sendMessage(channelId: string, userId: string, content: string) {
    if (typeof window === 'undefined') return;
    const newMessage: import("@/types").Message = {
        id: `m_${Date.now()}`,
        channelId,
        userId,
        content,
        createdAt: new Date().toISOString(),
    };
    const savedInputs = localStorage.getItem(`luna_messages_${channelId}`);
    const localMessages = savedInputs ? JSON.parse(savedInputs) : [];
    localStorage.setItem(`luna_messages_${channelId}`, JSON.stringify([...localMessages, newMessage]));
}

export function getUnreadMessageCount(userId: string): number {
    if (typeof window === 'undefined') return 0;
    const channels = getChannels();
    let totalUnread = 0;

    channels.forEach(channel => {
        const lastSeen = localStorage.getItem(`luna_last_seen_${userId}_${channel.id}`) || "0";
        const messages = getMessages(channel.id);
        const unread = messages.filter(m => m.userId !== userId && m.createdAt > lastSeen).length;
        totalUnread += unread;
    });

    return totalUnread;
}

export function markMessagesAsRead(channelId: string, userId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`luna_last_seen_${userId}_${channelId}`, new Date().toISOString());
}

export function getStripeSettings(): import("@/types").StripeSettings {
    if (typeof window === 'undefined') return { enabled: false, apiKey: "", targetCourseIds: [] };
    const saved = localStorage.getItem("luna_stripe_settings");
    return saved ? JSON.parse(saved) : { enabled: false, apiKey: "", targetCourseIds: [] };
}

export function saveStripeSettings(settings: import("@/types").StripeSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem("luna_stripe_settings", JSON.stringify(settings));
}

export function isUserSubscriptionActive(user: User): boolean {
    const settings = getStripeSettings();
    if (!settings.enabled) return true;
    if (user.role === 'admin') return true;
    return user.subscriptionStatus === 'active';
}

export interface EmailSettings {
    gmailAddress: string;
    appPassword: string;
    senderName: string;
    notificationEnabled: boolean;
    signature: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
    gmailAddress: "admin@lunaflow.com",
    appPassword: "",
    senderName: "LunaFlow 事務局",
    notificationEnabled: true,
    signature: "宜しくお願いいたします。\n\nLunaFlow 事務局"
};

export function getEmailSettings(): EmailSettings {
    if (typeof window === 'undefined') return DEFAULT_EMAIL_SETTINGS;
    const saved = localStorage.getItem("luna_email_settings");
    return saved ? JSON.parse(saved) : DEFAULT_EMAIL_SETTINGS;
}

export function saveEmailSettings(settings: EmailSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem("luna_email_settings", JSON.stringify(settings));
}

export function sendEmail(email: Omit<SentEmail, "id" | "sentAt" | "status">) {
    if (typeof window === 'undefined') return;
    const settings = getEmailSettings();
    const newEmail: SentEmail = {
        ...email,
        id: `e_${Date.now()}`,
        sentAt: new Date().toLocaleString('ja-JP'),
        status: "sent"
    };
    const saved = localStorage.getItem("luna_sent_emails");
    const sentEmails = saved ? JSON.parse(saved) : [];
    localStorage.setItem("luna_sent_emails", JSON.stringify([...sentEmails, newEmail]));
}

export function getSentEmails(): SentEmail[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem("luna_sent_emails");
    const local = saved ? JSON.parse(saved) : [];
    return local;
}

export const MOCK_STUDENTS: Student[] = [
    {
        id: "s1",
        name: "田中 健太",
        email: "t.kenta@example.com",
        registrationDate: "2025/12/20",
        progressStatus: "excellent",
    },
];

// --- Legacy Placeholders for Build Compatibility ---
export const MOCK_LESSONS: any[] = [];
export const MOCK_QUIZZES: any[] = [];
export const MOCK_EMAILS: any[] = [];
export const MOCK_PROGRESS: any[] = [];

export function saveUserProgress(userId: string, lessonId: string, completed: boolean) {
    if (typeof window === 'undefined') return;
    const progress = JSON.parse(localStorage.getItem(`luna_progress_${userId}`) || "{}");
    progress[lessonId] = completed;
    localStorage.setItem(`luna_progress_${userId}`, JSON.stringify(progress));
}

export function getUserProgress(userId: string): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    const progress = localStorage.getItem(`luna_progress_${userId}`);
    return progress ? JSON.parse(progress) : {};
}

export function hasAgreedToRules(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`luna_rules_agreed_${userId}`) === 'true';
}

export function setAgreedToRules(userId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`luna_rules_agreed_${userId}`, 'true');
}

export function hasReadIntro2(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`luna_intro2_read_${userId}`) === 'true';
}

export function setReadIntro2(userId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`luna_intro2_read_${userId}`, 'true');
}

export const MOCK_PAYMENTS: Payment[] = [
    { id: "pay1", userId: "u1", date: "2025-05-01", amount: 29800, method: "card", status: "succeeded" },
    { id: "pay2", userId: "u1", date: "2025-06-01", amount: 29800, method: "card", status: "succeeded" },
    { id: "pay3", userId: "u1", date: "2025-07-01", amount: 29800, method: "card", status: "succeeded" },
    // ... simulate recurring payments
    { id: "pay4", userId: "u3", date: "2025-11-01", amount: 29800, method: "card", status: "succeeded" },
    { id: "pay5", userId: "u3", date: "2025-12-01", amount: 29800, method: "card", status: "succeeded" },

    { id: "pay6", userId: "u5", date: "2025-01-01", amount: 2980, method: "card", status: "succeeded" },
    { id: "pay7", userId: "u5", date: "2025-02-01", amount: 2980, method: "card", status: "succeeded" },
];

export function getStudentPayments(userId: string): Payment[] {
    // In real app, filter by userId from DB
    const payments = MOCK_PAYMENTS.filter(p => p.userId === userId);

    let extra: Payment[] = [];
    if (typeof window !== 'undefined') {
        extra = JSON.parse(localStorage.getItem("luna_extra_payments") || "[]").filter((p: Payment) => p.userId === userId);
    }

    // Merge
    const all = [...payments, ...extra];

    if (all.length === 0) {
        // Generate dummy if none found for demo purposes
        return [
            { id: `mock_${userId}_1`, userId, date: "2025-12-01", amount: 9800, method: "card", status: "succeeded" }
        ];
    }
    return all;
}

export function savePayment(payment: Payment) {
    if (typeof window === 'undefined') return;
    const current = getStudentPayments(payment.userId); // This gets mock + local theoretically, but we need raw local storage

    // We need to manage a separate "local_payments" or merge everything.
    // For simplicity, let's keep a "luna_extra_payments" list in local storage and merge it.
    const extra = JSON.parse(localStorage.getItem("luna_extra_payments") || "[]");
    localStorage.setItem("luna_extra_payments", JSON.stringify([...extra, payment]));
}


export const MOCK_PROGRESS_DETAILS: ProgressDetail[] = [
    {
        userId: "u1",
        courseId: "course1",
        courseTitle: "テスト",
        categoryId: "cat1",
        categoryTitle: "サブ",
        blockId: "b1",
        blockTitle: "テスト",
        completedAt: "2025-12-21T10:30:00",
        status: "completed"
    },
    {
        userId: "u1",
        courseId: "course1",
        courseTitle: "テスト",
        categoryId: "cat2",
        categoryTitle: "サブ 2",
        blockId: "b2",
        blockTitle: "【奇跡】人生初のクリスマスマーケットで...",
        completedAt: "2025-12-22T14:15:00",
        status: "completed"
    },
    // Student 5 (Ichiro) - Fast progress
    {
        userId: "u5",
        courseId: "course1",
        courseTitle: "テスト",
        categoryId: "cat1",
        categoryTitle: "サブ",
        blockId: "b1",
        blockTitle: "テスト",
        completedAt: "2025-01-02T09:00:00",
        status: "completed"
    },
];

export function getStudentProgressDetail(userId: string): ProgressDetail[] {
    // Return sorted by completion date desc
    const logs = MOCK_PROGRESS_DETAILS.filter(p => p.userId === userId);

    // Merge with Local Storage
    let localLogs: ProgressDetail[] = [];
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`luna_progress_details_${userId}`);
        if (stored) {
            localLogs = JSON.parse(stored);
        }
    }

    // Check for AI Feedback Completion on Load (Lazy Evaluation)
    const now = new Date();
    let hasUpdates = false;
    const allLogs = [...logs, ...localLogs].map(log => {
        if (log.feedbackStatus === 'pending' && log.feedbackAt && new Date(log.feedbackAt) <= now) {
            // "Release" the feedback
            hasUpdates = true;
            return {
                ...log,
                feedbackStatus: 'completed' as const,
                status: 'completed' as const // Ensure main status is completed too
            };
        }
        return log;
    });

    if (hasUpdates && typeof window !== 'undefined') {
        // We only persist the LOCAL ones back to storage, but MOCK ones are in-memory relative to the page load unless we deep merge.
        // For this demo, let's just update the local storage ones.
        const updatedLocal = allLogs.filter(l => localLogs.some(local => local.blockId === l.blockId));
        localStorage.setItem(`luna_progress_details_${userId}`, JSON.stringify(updatedLocal));
    }

    return allLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

// AI Feedback Timing Logic
function calculateAIFeedbackTime(now: Date): Date {
    const startHour = 9;
    const startMinute = 30;
    const endHour = 22;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isBusinessHours =
        (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) &&
        currentHour < endHour;

    if (isBusinessHours) {
        // Business Hours: Random 30m to 2h delay
        const minDelay = 30 * 60 * 1000; // 30 mins
        const maxDelay = 2 * 60 * 60 * 1000; // 2 hours
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        return new Date(now.getTime() + delay);
    } else {
        // Night Time: Next day 9:30 + random small delay (0-30m)
        const nextDay = new Date(now);
        if (currentHour >= endHour) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        nextDay.setHours(9, 30, 0, 0);

        // Random slightly to avoid bot-like exactness
        const randomDelay = Math.floor(Math.random() * 30 * 60 * 1000);
        return new Date(nextDay.getTime() + randomDelay);
    }
}

// Generate Mock AI Feedback Content
function generateAIFeedback(name: string, blockTitle: string): string {
    const templates = [
        `${name}さん、課題の提出ありがとうございます！「${blockTitle}」の内容、拝見しました。非常に丁寧に取り組まれていて素晴らしいです。特に着眼点が鋭く、今後の成長が楽しみです。次はもう少し具体的な数字も意識してみるとさらに良くなると思います！`,
        `お疲れ様です、${name}さん！「${blockTitle}」の課題、確認しました。全体的によくまとまっていますね。${name}さんらしい工夫が見られて嬉しく思います。引き続きこの調子で頑張りましょう！`,
        `${name}さん、提出ありがとうございます。今回の「${blockTitle}」は少し難しかったかもしれませんが、よく食らいつきましたね！基礎はバッチリですので、自信を持って次のステップへ進んでください。応援しています！`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

export function submitAssignment(userId: string, blockId: string, content: string) {
    if (typeof window === 'undefined') return;

    const user = getUserById(userId);
    const block = MOCK_BLOCKS.find(b => b.id === blockId);

    if (!block || !user) return;

    // Determine correction type
    const correctionType = block.correctionType || 'manual';

    const now = new Date();
    let feedbackStatus: 'pending' | 'completed' = 'pending';
    let feedbackContent = "";
    let feedbackAt: string | undefined = undefined;

    if (correctionType === 'ai') {
        // Schedule AI logic
        const scheduledTime = calculateAIFeedbackTime(now);
        feedbackAt = scheduledTime.toISOString();
        feedbackContent = generateAIFeedback(user.name, block.title);
        // Status remains pending until time passes
    }

    const category = MOCK_CATEGORIES.find(c => c.id === block.categoryId);
    const course = MOCK_COURSES.find(c => c.id === category?.courseId);

    const newSubmission: ProgressDetail = {
        userId,
        courseId: course?.id || "unknown",
        courseTitle: course?.title || "Unknown",
        categoryId: category?.id || "unknown",
        categoryTitle: category?.title || "Unknown",
        blockId,
        blockTitle: block.title,
        completedAt: now.toISOString(),
        status: correctionType === 'ai' ? 'viewed' : 'completed', // 'viewed' for pending AI? Or just completed? 
        // Actually user wants feedback, so maybe 'viewed' (submitted) until feedback implies completion.
        // But typically submission = completion of TASK, feedback is extra.
        // Let's use 'viewed' as "Submitted/Pending" and 'completed' as "Feedback Received".
        feedbackStatus: 'pending',
        feedbackContent, // Store it but hidden until time
        feedbackAt
    };

    // Store in LocalStorage
    const stored = localStorage.getItem(`luna_progress_details_${userId}`);
    const current = stored ? JSON.parse(stored) : [];
    // Remove old submission for same block if any
    const filtered = current.filter((p: ProgressDetail) => p.blockId !== blockId);
    localStorage.setItem(`luna_progress_details_${userId}`, JSON.stringify([...filtered, newSubmission]));
}
