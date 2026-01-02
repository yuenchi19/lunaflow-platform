import { NextResponse } from 'next/server';
import { lineClient } from '@/lib/line';
import { MOCK_USERS } from '@/lib/data'; // In real app, DB would be used
import { createClient } from '@supabase/supabase-js';

// Simple in-memory store for linking codes (Use Redis/DB in prod)
// Map<Code, UserId>
// For this demo (which relies on local storage persistence patterns mainly), 
// we won't have a reliable server-side memory across lambdas in Vercel. 
// However, the prompt asks for "linking with system ID", implying we need a DB store.
// We'll simulate checking a "pending_links" table via Supabase if possible, 
// or fallback to a hardcoded check if we are purely local.

// Since the prompt provided Supabase key context earlier (via previous context summary), 
// we should try to use Supabase Admin if available, or just mock it.
// Given "No external tools", and "Direct API", we'll implement the logic.

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') as string;

    if (!lineClient.verifySignature(body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body).events[0];

    if (!event || event.type !== 'message' || event.message.type !== 'text') {
        return NextResponse.json({ received: true });
    }

    const messageText = event.message.text.trim();
    const lineUserId = event.source.userId;
    const replyToken = event.replyToken;

    // Check if message is a Linking Code (e.g., 6 digits)
    if (/^\d{6}$/.test(messageText)) {
        // Here we would look up the code in our DB to find the App User ID
        // For this implementation, we'll assume a "Link" table exists or mock it.
        // Let's assume we store these codes in Supabase 'verification_codes' table

        // MOCK LOGIC for "System"
        // In a real scenario, the user generated this code on the frontend.
        // We'll need a way for the frontend to have "set" this code.
        // Let's assume we use Supabase to look it up.

        try {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // 1. Find the code
            const { data: verification, error } = await supabaseAdmin
                .from('VerificationCode')
                .select('*')
                .eq('code', messageText)
                .single();

            if (verification) {
                // 2. Update User with LINE ID
                const { error: updateError } = await supabaseAdmin
                    .from('User')
                    .update({ lineUserId: lineUserId })
                    .eq('id', verification.userId);

                if (!updateError) {
                    // 3. Reply to user
                    await ReplyMessage(replyToken, "LINE連携が完了しました！\nこれからも学習頑張ってくださいね！");

                    // Cleanup code
                    await supabaseAdmin.from('VerificationCode').delete().eq('code', messageText);
                } else {
                    await ReplyMessage(replyToken, "連携に失敗しました。もう一度お試しください。");
                }
            } else {
                await ReplyMessage(replyToken, "無効なコード、または期限切れです。\nマイページから再度コードを発行してください。");
            }

        } catch (e) {
            console.error("Link Error", e);
            await ReplyMessage(replyToken, "システムエラーが発生しました。");
        }
    }

    return NextResponse.json({ received: true });
}

async function ReplyMessage(replyToken: string, text: string) {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: 'text', text: text }]
        })
    });
}
