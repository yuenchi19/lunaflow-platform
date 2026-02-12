import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuota } from "@/lib/quota";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quota = await getQuota(user.id);

        return NextResponse.json(quota);
    } catch (error: any) {
        console.error("Fetch Quota Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
