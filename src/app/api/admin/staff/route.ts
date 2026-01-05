
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
            .in('role', ['admin', 'staff', 'accounting'])
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

        console.log(`[StaffInvite] Processing invite for: ${email}`);

        // 1. Try to create new Auth User
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (createError) {
            // If error is NOT "Email already registered" (approximate check), return error
            // Supabase error message for existing user varies, check status or message
            console.log(`[StaffInvite] CreateUser result: ${createError.message}`);

            // Fallback: Check if user exists
            const { data: { users: foundUsers }, error: listError } = await supabase.auth.admin.listUsers({
                page: 1,
                perPage: 100
            });
            const existingUser = foundUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (existingUser) {
                console.log(`[StaffInvite] User already exists: ${existingUser.id}. Updating role.`);
                userId = existingUser.id;
                // Update role
                await supabase.auth.admin.updateUserById(userId, { user_metadata: { role } });
            } else {
                // Real error
                console.error(`[StaffInvite] Failed to create and failed to find user.`);
                return NextResponse.json({ error: createError.message }, { status: 400 });
            }
        } else {
            userId = createData.user.id;
            console.log(`[StaffInvite] Created new user: ${userId}`);
        }

        // 2. Generate Link (Always)
        const origin = new URL(req.url).origin;
        const redirectUrl = `${origin}/student/dashboard`; // Redirect to dashboard or admin login? Admin login seems safer for staff.
        // Actually for setup password, it might go to a specific update-password page?
        // Using common logic:
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: { redirectTo: `${origin}/admin/login` }
        });

        if (linkError) {
            console.error(`[StaffInvite] Link generation failed: ${linkError.message}`);
            return NextResponse.json({ error: '招待リンクの生成に失敗しました' }, { status: 500 });
        }
        inviteLink = linkData.properties.action_link;

        // 3. Upsert to Public DB
        // First, check for potential conflict (Orphaned user record with same email but different ID)
        const { data: existingPublicUser } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

        if (existingPublicUser && existingPublicUser.id !== userId) {
            console.log(`[StaffInvite] Found orphaned public user (${existingPublicUser.id}) for email ${email}. Deleting to allow new link.`);
            await supabase.from('User').delete().eq('id', existingPublicUser.id);
        }

        const { error: dbError } = await supabase
            .from('User')
            .upsert({
                id: userId,
                email: email,
                name: name,
                role: role,
                status: status || 'pending', // Mark as pending if new
                updatedAt: new Date().toISOString()
            });

        if (dbError) {
            console.error(`[StaffInvite] DB Upsert failed: ${dbError.message}`);
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
    以下のリンクよりパスワードを設定し、システムへログインしてください。</p>
    
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
