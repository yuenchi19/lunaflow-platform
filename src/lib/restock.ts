
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Logic to check restock and send emails
export async function checkAndNotifyRestock(productId: string, oldStock: number, newStock: number, productName: string) {
    if (oldStock <= 0 && newStock > 0) {
        console.log(`[Restock] Product ${productId} restocked! (${oldStock} -> ${newStock})`);

        // Find subscriptions
        const subs = await prisma.productRestockSubscription.findMany({
            where: { productId }
        });

        if (subs.length > 0) {
            console.log(`[Restock] Found ${subs.length} subscriptions.`);

            // Send Emails via Resend
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const { Resend } = await import('resend');
                const resend = new Resend(resendApiKey);

                // Batch send? Or loop. Resend has limits, loop is safer for small scale.
                for (const sub of subs) {
                    try {
                        await resend.emails.send({
                            from: 'LunaFlow Shop <shop@lunaflow.space>',
                            to: sub.email,
                            subject: '【LunaFlow】商品の再入荷のお知らせ',
                            html: `
<div style="font-family: sans-serif; padding: 20px;">
    <h2>再入荷のお知らせ</h2>
    <p>いつもご利用ありがとうございます。</p>
    <p>リクエストをいただいておりました以下の商品が再入荷いたしました。</p>
    
    <div style="background: #f4f4f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <strong>${productName}</strong>
    </div>

    <p><a href="https://lunaflow.space/student/store" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">ショップを見る</a></p>
    
    <p style="font-size: 0.8em; color: #666;">※本メールは自動配信です。</p>
</div>
                            `
                        });
                    } catch (e) {
                        console.error(`[Restock] Failed to send to ${sub.email}`, e);
                    }
                }
            }

            // Delete subscriptions (One-time notification)
            await prisma.productRestockSubscription.deleteMany({
                where: { productId }
            });
        }
    }
}
