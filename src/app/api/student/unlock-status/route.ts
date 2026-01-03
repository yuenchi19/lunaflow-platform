
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rules = await prisma.featureUnlock.findMany();
        const unlocks: Record<string, boolean> = {};

        for (const rule of rules) {
            let isUnlocked = true; // Default true if no conditions? Or false? 
            // If rule exists but no conditions, standard feature toggle says unlocked? 
            // The prompt says "Unlock by advancing curriculum". Implies default LOCKED.
            // But if rule has NO requiredCourseId, maybe it's unlocked? Admin UI says "Conditions: None (Immediate)".

            if (!rule.requiredCourseId) {
                isUnlocked = true;
            } else {
                // Check Course Completion
                // Get all published blocks in course
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
                    isUnlocked = true; // Empty course = completed?
                } else {
                    // Count completed blocks
                    const completedCount = await prisma.userProgress.count({
                        where: {
                            userId: user.id,
                            blockId: { in: blocks.map(b => b.id) },
                            status: 'completed'
                        }
                    });
                    isUnlocked = completedCount >= blocks.length;
                }
            }
            unlocks[rule.featureKey] = isUnlocked;
        }

        return NextResponse.json(unlocks);
    } catch (error) {
        console.error('Unlock check failed', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
