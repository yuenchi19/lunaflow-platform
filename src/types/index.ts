export interface Category {
    id: string;
    courseId: string;
    title: string;
    order: number;
    description?: string;
}

export type BlockType = 'video' | 'text' | 'quiz' | 'link' | 'pdf' | 'audio' | 'article' | 'survey' | 'assignment';

export interface Block {
    id: string;
    categoryId: string;
    title: string;
    type: BlockType | 'assignment'; // Added assignment
    content?: any;
    videoUrl?: string; // Legacy?
    order: number;
    // Enhanced Features
    isRequired?: boolean; // General completion requirement
    feedbackRequired?: boolean; // Requires feedback submission
    feedbackType?: 'manual' | 'ai'; // If feedback is required
    assignmentFormat?: ('text' | 'image' | 'url')[]; // For assignment blocks
}

export interface Feedback {
    id: string;
    userId: string;
    blockId: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    staffComment?: string;
    submittedAt: string;
    updatedAt?: string;
    // Enhanced for Assignments
    type?: 'feedback' | 'assignment';
    attachmentUrls?: string[];
}

export interface UserProgress {
    userId: string;
    lessonId: string; // Used for blocks for now
    completed: boolean;
    score?: number;
    lastWatchedPosition?: number;
    stripeCustomerId?: string; // For linking to Stripe Customer
    lineUserId?: string; // For syncing with LINE Messaging API
    lastLoginDate?: string; // For inactivity reminders
    targetDate?: string; // For learning plan
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin' | 'accounting' | 'staff';
    plan: Plan;
    subscriptionStatus?: 'active' | 'inactive' | 'past_due';
    avatarUrl?: string;
    affiliateCode?: string;
    referredBy?: string;
    registrationDate?: string;
    lifetimePurchaseTotal?: number;
    payoutPreference?: 'bank_transfer' | 'offset_purchase';
    communityNickname?: string;
    zipCode?: string;
    address?: string;
    phoneNumber?: string;
    isLedgerEnabled?: boolean;
    lastLoginDate?: string;
    lineUserId?: string;
    initialPaymentDate?: string;
    githubId?: string;
    githubUsername?: string;
    githubInviteStatus?: 'none' | 'pending' | 'invited' | 'joined';
    complianceAgreed?: boolean;
    // Payout Info
    bankName?: string;
    bankBranch?: string;
    bankAccountType?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    invoiceRegistrationNumber?: string;
}

export interface StripeSettings {
    enabled: boolean;
    apiKey: string;
    targetCourseIds: string[];
}

export interface Student {
    id: string;
    name: string;
    email: string;
    customFields?: string;
    courses?: string[];
    startDate?: string;
    endDate?: string;
    registrationDate: string;
    progressStatus: 'completed' | 'excellent' | 'good' | 'stagnant' | 'dropout' | 'waiting' | 'all';
}

export interface SentEmail {
    id: string;
    recipientName: string;
    recipientEmail: string;
    subject: string;
    content: string;
    sentAt: string;
    status: 'waiting' | 'sent' | 'failed';
}

export type Plan = 'light' | 'standard' | 'premium' | 'partner';

export interface Channel {
    id: string;
    name: string;
    description: string;
    allowedPlans: Plan[];
    allowedRoles?: ('admin' | 'staff' | 'student')[];
    category?: string;
}

export interface Message {
    id: string;
    channelId: string;
    userId: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    user?: User;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string; // Removed duplicate
    expirationDate?: string;
    allowedPlans: Plan[]; // Changed from minTier
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    isCompleted?: boolean;
    duration?: number;
}

export interface Quiz {
    id: string;
    questions: any[];
    passingScore?: number;
}

// Affiliate Types
export interface RewardTransaction {
    id: string;
    userId: string;
    date: string;
    amount: number; // Negative for usage/payout, Positive for earnings
    type: 'offset_purchase' | 'bank_transfer_payout' | 'bank_transfer_fee' | 'earning';
    description: string;
    purchaseRequestId?: string;
    status: 'completed' | 'pending';
}

export interface AffiliateEarnings {
    directReferrals: number;
    indirectReferrals: number;
    monthlyEarnings: number; // This month's earnings
    totalBalance?: number; // Current claimable balance
}

export interface Payment {
    id: string;
    userId: string;
    date: string;
    amount: number;
    method: 'card' | 'bank_transfer' | 'other' | 'invoice';
    status: 'succeeded' | 'pending' | 'failed';
}

export interface ProgressDetail {
    userId: string;
    courseId: string;
    courseTitle: string;
    categoryId: string;
    categoryTitle: string;
    blockId: string;
    blockTitle: string;
    completedAt: string; // ISO Date
    status: 'completed' | 'viewed' | 'not_started';
    feedbackStatus?: 'pending' | 'completed';
    feedbackContent?: string;
    feedbackResponse?: string;
    feedbackAt?: string; // scheduled or actual feedback time
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseRequest {
    id: string;
    userId?: string; // Optional if coming from non-logged in user forms, but ideally linked
    email: string;
    name: string;
    postalCode: string;
    prefecture: string;
    address: string;
    phone: string;
    plan: string;
    amount: number; // changed from string to number for calculation
    carrier: string;
    payment: string;
    note: string;
    status: "pending" | "completed";
    date: string;
}

export interface InventoryItem {
    id: string;
    adminId: string;
    brand: string;
    name?: string;
    category?: string;
    costPrice: number;
    sellingPrice?: number;
    images: string[];
    damageImages: string[];
    status: 'IN_STOCK' | 'ASSIGNED' | 'RECEIVED' | 'SOLD';
    condition?: string;
    hasAccessories: boolean;
    accessories: string[];
    note?: string;
    assignedToUserId?: string;
    assignedToUser?: { name: string; email: string };
    createdAt: string;
    updatedAt: string;
}
