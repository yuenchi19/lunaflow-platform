
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.fksvpyrvrzxmhhvetqrx:UverLove2026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" // Hardcoded for script safety
        }
    }
});

const MOCK_COURSES = [
    {
        id: "course1",
        title: "テスト",
        description: "テスト講座へようこそ！まずは動画をご覧いただき、それから受講を開始してください！",
        label: "基礎編",
        thumbnailUrl: "https://picsum.photos/seed/course/800/450",
        published: true,
        order: 1
    }
];

const MOCK_CATEGORIES = [
    {
        id: "cat1",
        courseId: "course1",
        title: "サブ",
        order: 1,
    },
    {
        id: "cat2",
        courseId: "course1",
        title: "サブ 2",
        order: 2,
    }
];

const MOCK_BLOCKS = [
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
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        content: "動画を見て学習しましょう",
        order: 1,
        feedbackType: 'ai',
    }
];

async function main() {
    console.log('Seeding courses...');

    // Courses
    for (const course of MOCK_COURSES) {
        await prisma.course.upsert({
            where: { id: course.id },
            update: course,
            create: course
        });
        console.log(`Synced course: ${course.title}`);
    }

    // Categories
    for (const cat of MOCK_CATEGORIES) {
        await prisma.category.upsert({
            where: { id: cat.id },
            update: { ...cat },
            create: { ...cat }
        });
        console.log(`Synced category: ${cat.title}`);
    }

    // Blocks
    for (const block of MOCK_BLOCKS) {
        await prisma.block.upsert({
            where: { id: block.id },
            update: { ...block },
            create: { ...block }
        });
        console.log(`Synced block: ${block.title}`);
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
