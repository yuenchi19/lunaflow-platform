
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { generateLineMagicLinkUrl } from '@/lib/line-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user details from DB to mimic real customer data
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: 'RESEND_API_KEY is missing' }, { status: 500 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Generate Magic Link for the current admin user
        const magicLinkUrl = await generateLineMagicLinkUrl(dbUser.id);

        // Mock data similar to Stripe webhook
        const customerName = dbUser.name || '管理者様(テスト)';
        const tempPassword = "test-password-1234";

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: user.email,
            subject: '【テスト】Luna Flowへようこそ！アカウント登録が完了しました ✨',
            html: `
                <div style="background-color: #f3f4f6; padding: 20px;">
                    <p style="color: red; font-weight: bold; text-align: center;">※これは管理者によるテスト送信メールです</p>
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <p>${customerName} 様</p>

                        <p>Luna Flowへの入会誠にありがとうございます。<br>
                        お客様のアカウント作成が完了いたしました！</p>

                        <p>これからの新しい一歩を、私たちが全力でサポートいたします。<br>
                        理想の毎日を一緒に叶えていきましょう！</p>

                        <p><strong>▼ 面倒な入力なしで、今すぐスタート！</strong><br>
                        以下のボタンを押すだけで、<strong>自動的にログインし、同時にLINE連携も完了します。</strong><br>
                        （推奨：スマートフォンからタップしてください）</p>

                        <p style="text-align: center; margin: 24px 0;">
                            <a href="${magicLinkUrl}" style="display:inline-block; background-color:#E64A19; color:#ffffff; padding:15px 30px; text-decoration:none; border-radius:5px; font-weight:bold; font-size:16px;">
                                🚀 今すぐ学習を始める
                            </a>
                        </p>
                        <p style="text-align: center; margin-bottom: 24px;"><small>※このリンクはセキュリティのため72時間有効です。</small></p>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">

                        <p><strong>■ 通常のログイン情報（PCやリンク切れの場合）</strong><br>
                        もし上記ボタンから入れない場合は、以下の情報でログインしてください。</p>
                        
                        <p style="background-color: #f9f9f9; padding: 16px; border-radius: 8px;">
                        ・ログインURL： ${process.env.NEXT_PUBLIC_APP_URL}<br>
                        ・メールアドレス： ${user.email}<br>
                        ・初期パスワード： ${tempPassword}
                        </p>
                        
                        <p>※ログイン後、マイページの「設定」からパスワードを変更可能です。</p>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">

                        <p><strong>■ 公式LINEについて</strong><br>
                        上記のボタンからスタートすると、公式LINEとの連携もスムーズに完了します。</p>

                        <p>これから始まるLuna Flowでの体験が、${customerName} 様にとって輝かしいものとなりますように。</p>

                        <p>Luna Flow 運営事務局</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, email: user.email });

    } catch (e: any) {
        console.error('Test Send Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
