import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = createClient();

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { githubUsername } = await req.json();

        if (!githubUsername) {
            return NextResponse.json({ error: 'GitHub Username is required' }, { status: 400 });
        }

        // 2. Check Plan Status & Existing GitHub ID
        const { data: dbUser, error: dbError } = await supabase
            .from('User')
            .select('plan, role, githubId, githubInviteStatus')
            .eq('id', user.id)
            .single();

        if (dbError || !dbUser) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const allowedPlans = ['standard', 'premium'];
        const isStaff = dbUser.role === 'admin' || dbUser.role === 'staff';

        if (!allowedPlans.includes(dbUser.plan) && !isStaff) {
            return NextResponse.json({ error: 'Plan restriction: Upgrade required' }, { status: 403 });
        }

        // 3. Send GitHub Invite via Octokit
        if (!process.env.GITHUB_ACCESS_TOKEN || !process.env.GITHUB_ORG_NAME) {
            console.error("Missing GitHub config");
            return NextResponse.json({ error: 'Server Authorization Config Missing' }, { status: 500 });
        }

        const octokit = new Octokit({
            auth: process.env.GITHUB_ACCESS_TOKEN
        });

        // 3.1 Get GitHub User ID from Username
        let githubUser;
        try {
            const { data } = await octokit.rest.users.getByUsername({
                username: githubUsername
            });
            githubUser = data;
        } catch (e: any) {
            return NextResponse.json({ error: `GitHub User '${githubUsername}' not found` }, { status: 404 });
        }

        // 3.2 Send Org Invite
        try {
            // Check if already member
            try {
                const checkMembership = await octokit.rest.orgs.checkMembershipForUser({
                    org: process.env.GITHUB_ORG_NAME,
                    username: githubUsername,
                });

                if ((checkMembership.status as number) === 204) {
                    // Already a member
                    await supabase.from('User').update({
                        githubId: githubUser.id.toString(),
                        githubUsername: githubUsername,
                        githubInviteStatus: 'joined'
                    }).eq('id', user.id);

                    return NextResponse.json({
                        success: true,
                        message: 'Already a member',
                        status: 'joined'
                    });
                }
            } catch (e) {
                // Not a member, proceed to invite
            }

            // Invite
            const invite = await octokit.rest.orgs.createInvitation({
                org: process.env.GITHUB_ORG_NAME,
                invitee_id: githubUser.id,
                role: 'direct_member'
            });

            // 4. Update DB
            await supabase.from('User').update({
                githubId: githubUser.id.toString(),
                githubUsername: githubUsername,
                githubInviteStatus: 'invited'
            }).eq('id', user.id);

            return NextResponse.json({
                success: true,
                message: 'Invitation sent',
                inviteUrl: (invite.data as any).html_url
            });

        } catch (e: any) {
            console.error("GitHub Invite Error:", e);
            return NextResponse.json({
                error: 'Failed to send GitHub invitation',
                details: e.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
