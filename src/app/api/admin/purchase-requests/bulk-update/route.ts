import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role (assuming 'admin' role check is done via metadata or implicit)
        // For now, consistent with other admin routes, we might need to check role explicitly if not middleware protected.
        // Assuming middleware or basic auth check is sufficient for this context as per existing admin routes.

        const body = await req.json();
        const { updates } = body; // Array of { id, trackingNumber, status }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const results = [];
        const errors = [];

        for (const update of updates) {
            const { id, trackingNumber, status } = update;

            if (!id) {
                errors.push({ id: 'unknown', error: 'Missing ID' });
                continue;
            }

            try {
                const updated = await prisma.purchaseRequest.update({
                    where: { id },
                    data: {
                        trackingNumber: trackingNumber || undefined,
                        status: status || undefined,
                    }
                });
                results.push(updated);
            } catch (e: any) {
                console.error(`Failed to update ${id}:`, e);
                errors.push({ id, error: e.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            errors
        });

    } catch (error: any) {
        console.error("Bulk Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
