import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch full user profile to get plan
        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
            select: { id: true, plan: true, isLedgerEnabled: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const plan = user.plan || 'standard'; // Default to standard if null

        // Fetch rules for this plan
        const rules = await prisma.featureUnlock.findMany({
            where: { plan: plan }
        });

        const unlocks: Record<string, boolean> = {};
        const KNOWN_FEATURES = ['affiliate', 'inventory'];

        for (const feature of KNOWN_FEATURES) {
            const rule = rules.find(r => r.featureKey === feature);

            if (!rule) {
                // Default Locked if no rule exists for this plan
                unlocks[feature] = false;
                continue;
            }

            // Check Status
            if (rule.status === 'locked') {
                unlocks[feature] = false;
                continue;
            }

            // If active and no course requirement => Unlocked
            if (!rule.requiredCourseId) {
                unlocks[feature] = true;
                continue;
            }

            // Check Course Completion condition
            const blocks = await prisma.block.findMany({
                where: {
                    category: {
                        courseId: rule.requiredCourseId,
                        published: true
                    }
                },
                select: { id: true }
            });

            if (blocks.length === 0) {
                unlocks[feature] = true; // Empty course = completed
            } else {
                const completedCount = await prisma.userProgress.count({
                    where: {
                        userId: user.id,
                        blockId: { in: blocks.map(b => b.id) },
                        status: 'completed'
                    }
                });
                unlocks[feature] = completedCount >= blocks.length;
            }
        }

        if (unlocks['inventory'] && !user.isLedgerEnabled) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isLedgerEnabled: true }
            });
        }

        return NextResponse.json(unlocks);
    } catch (error) {
        console.error('Unlock check failed', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
