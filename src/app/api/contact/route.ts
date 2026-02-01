
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Save to DB
        const inquiry = await prisma.inquiry.create({
            data: {
                name,
                email,
                subject: subject || "No Subject",
                message
            }
        });

        // TODO: Integrate Resend/SendGrid here to notify Admin.
        // For now, DB persistence allows Admin to view in dashboard.

        return NextResponse.json({ success: true, id: inquiry.id });

    } catch (error) {
        console.error("Contact API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
