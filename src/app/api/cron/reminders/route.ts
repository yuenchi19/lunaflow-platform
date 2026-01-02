import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lineClient } from '@/lib/line';
import { getLineSettings } from '@/lib/line-settings';

// This endpoint is meant to be called by a Cron Job (e.g., Vercel Cron)
// GET /api/cron/reminders
export async function GET(req: Request) {
    // 1. Check if feature is enabled via Settings (Mock Local for now, or DB)
    // In a real serverless cron, 'localStorage' might not persist settings set in Admin UI unless we use a DB.
    // We'll assume settings are in DB or we use the default for safety if env fails.
    // For this implementation, we will try to read from Supabase 'SystemSettings' table or similar,
    // or just hardcode the check logic to demonstrate the flow assuming 'settings' are passed or stored.

    // NOTE: 'getLineSettings' uses localStorage which DOES NOT work on server side API routes independently.
    // We need to fetch settings from DB.
    // For now, we will default to "enabled" for demonstration or read from a 'Settings' table.

    const settings = {
        enabled: true, // Force true for demo logic, or fetch from DB
        reminderDays: 7,
        reminderMessage: "こんにちは！LunaFlow事務局です。\n学習の進み具合はいかがでしょうか？\nもし操作方法や内容で分からないことがあれば、このLINEでいつでも質問してくださいね！\n\n▼ 学習を再開する\nhttps://www.lunaflow.space/"
    };

    if (!settings.enabled) {
        return NextResponse.json({ message: 'Reminder feature disabled' });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Find Inactive Users
        // Logic: last_sign_in_at < (now - 7 days) AND lineUserId IS NOT NULL
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - settings.reminderDays);

        // Supabase Auth 'users' table is not directly queryable for metadata filters easily in all modes,
        // but our public 'User' table has 'lineUserId'.
        // We need 'lastLoginDate'. We added this to the 'User' model in Phase 9 plan.

        const { data: inactiveUsers, error } = await supabaseAdmin
            .from('User')
            .select('*')
            .not('lineUserId', 'is', null) // Only linked users
            .lt('lastLoginDate', daysAgo.toISOString()); // Inactive

        if (error) throw error;

        if (!inactiveUsers || inactiveUsers.length === 0) {
            return NextResponse.json({ message: 'No inactive users found', count: 0 });
        }

        console.log(`[Cron] Found ${inactiveUsers.length} inactive users.`);

        // 3. Send Messages (Batch/Multicast)
        // LINE Multicast allows 500 users at a time.
        const userIds = inactiveUsers.map(u => u.lineUserId!);

        // Chunking
        const chunkSize = 500;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);

            // Send
            await fetch('https://api.line.me/v2/bot/message/multicast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    to: chunk,
                    messages: [{ type: 'text', text: settings.reminderMessage }]
                })
            });
        }

        return NextResponse.json({
            success: true,
            count: inactiveUsers.length,
            message: `Sent reminders to ${inactiveUsers.length} users.`
        });

    } catch (e: any) {
        console.error("Reminder Cron Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
