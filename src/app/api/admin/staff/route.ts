
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    try {
        const { data: users, error } = await supabase
            .from('User')
            .select('*')
            .in('role', ['admin', 'staff', 'accounting']) // Include accounting as staff-like
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Error fetching staff:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedUsers = users.map((u: any) => ({
            id: u.id,
            name: u.name || 'No Name',
            email: u.email,
            role: u.role,
            status: u.status || 'inactive',
            avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`,
            joinedAt: u.createdAt,
        }));

        return NextResponse.json(formattedUsers);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const { email, name, role, status } = body;

        let userId: string;
        let inviteLink: string | undefined;

        // 1. Check Public User Table First (Source of Truth for Platform)
        const { data: existingPublicUser } = await supabase
            .from('User')
            .select('id, role')
            .eq('email', email)
            .single();

        if (existingPublicUser) {
            userId = existingPublicUser.id;
            console.log(`[StaffInvite] Found existing public user: ${userId}`);

            // Update Auth Metadata first to ensure consistency
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role: role }
            });
            if (updateError) console.warn(`[StaffInvite] Auth Metadata update warning: ${updateError.message}`);

        } else {
            // 2. Auth User Management (Find or Create)
            let authUser: any;

            // A. Try to find existing Auth User by Email
            const { data: { users: foundUsers }, error: listError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 100 // Minimal chance of overflow for staff, but safer to loop if huge. Assuming <100 staff/conflicts.
            });

            authUser = foundUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (authUser) {
                console.log(`[StaffInvite] Found existing Auth User: ${authUser.id}`);
                userId = authUser.id;
            } else {
                // B. Not found, Create new Auth User
                console.log(`[StaffInvite] Creating NEW Auth User for ${email}`);
                const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                    email: email,
                    email_confirm: true,
                    user_metadata: { name, role }
                });

                if (createError) {
                    // Edge Case: ListUsers didn't see it, but Create says specific error?
                    console.error(`[StaffInvite] FATAL: CreateUser failed but ListUsers didn't find match. ${createError.message}`);
                    return NextResponse.json({ error: `招待処理に失敗しました。管理者へお問い合わせください。(Create Error: ${createError.message})` }, { status: 400 });
                }

                const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                    type: 'recovery',
                    email: email,
                    options: { redirectTo: redirectUrl }
                });

                if (linkError) return NextResponse.json({ error: `Link Generation Failed: ${linkError.message}` }, { status: 500 });
                inviteLink = linkData.properties.action_link;
            }

            // 3. Upsert to Public DB
            const { error: dbError } = await supabase
                .from('User')
                .upsert({
                    id: userId,
                    email: email,
                    name: name,
                    role: role,
                    status: status || 'active',
                    updatedAt: new Date().toISOString()
                });

            if (dbError) {
                return NextResponse.json({ error: dbError.message }, { status: 500 });
            }

            // 4. Send Email via Resend
            if (resendApiKey) {
                const { Resend } = await import('resend');
                const resend = new Resend(resendApiKey);

                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'info@lunaflow.space',
                    to: email,
                    subject: '【LunaFlow】運営スタッフへの招待！',
                    html: `
<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
    <p>LunaFlow事務局です。</p>
    <p>あなたを当システムの運営スタッフとして招待しました。<br>
    以下のリンクよりパスワードを設定し、管理画面へログインしてください。</p>
    
    <div style="margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            パスワードを設定してログイン
        </a>
    </div>
    
    <p style="font-size: 0.9em; color: #666;">
        リンクURL: <br>
        <a href="${inviteLink}">${inviteLink}</a>
    </p>

    <p style="font-size: 0.8em; color: #999; margin-top: 40px;">
        ※本メールに心当たりがない場合は破棄してください。<br>
        ※リンク有効期限: 24時間
    </p>
</div>
                `
                });
            }

            return NextResponse.json({ success: true, userId });

        } catch (e: any) {
            console.error("Staff Invite Error:", e);
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }
