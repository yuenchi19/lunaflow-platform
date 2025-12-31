import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, scheduledDate, note, plan, carrier } = body; // carrier added

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! }, // Use email as strict identifier
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // --- Address Sync Logic (Stripe -> User) ---
        // If user has no address, try to fetch from Stripe Customer and save to User
        if (!user.address || !user.zipCode) {
            // Find customer by email
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
                const customer = customers.data[0];
                if (customer.address) {
                    const newAddress = [customer.address.line1, customer.address.line2, customer.address.city, customer.address.state].filter(Boolean).join(" ");
                    const newZip = customer.address.postal_code || "";

                    if (newAddress) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                address: newAddress,
                                zipCode: newZip
                            }
                        });
                        console.log(`Synced address for user ${user.id} from Stripe.`);
                    }
                }
            }
        }

        // Create Purchase Request
        const purchaseRequest = await prisma.purchaseRequest.create({
            data: {
                userId: user.id,
                amount: typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g, '')) : amount,
                plan: plan || user.plan,
                status: "pending",
                note: note,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                carrier: carrier // Save carrier
            }
        });

        // Create Stripe Invoice
        let invoiceId = null;
        try {
            // 1. Get or Create Customer
            let customerId = "";
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    name: user.name || "",
                });
                customerId = newCustomer.id;
            }

            // 2. Create Invoice Item
            await stripe.invoiceItems.create({
                customer: customerId,
                amount: typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g, '')) : amount,
                currency: "jpy",
                description: `仕入れ購入申請 (${new Date().toLocaleDateString()}) - ${note || ''}`,
            });

            // 3. Create Invoice
            const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: true, // Auto-finalize
                collection_method: 'send_invoice', // Default to email
                days_until_due: 7, // 7 days payment terms
            });
            invoiceId = invoice.id;

            // Update Request with Invoice ID
            await prisma.purchaseRequest.update({
                where: { id: purchaseRequest.id },
                data: { stripeInvoiceId: invoiceId }
            });

            // Send Invoice Email (optional, Stripe does this if auto_advance is true)
            if (invoice.status === 'draft') {
                await stripe.invoices.finalizeInvoice(invoice.id);
            }

        } catch (stripeError) {
            console.error("Stripe Invoice Error:", stripeError);
            // Continue even if invoice fails, but log it. Request is saved.
        }

        return NextResponse.json({ success: true, purchaseRequest });

    } catch (error: any) {
        console.error("Purchase API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
