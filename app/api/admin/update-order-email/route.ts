import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { isAdminUser } from "@/lib/admin";
import { emailField } from "@/lib/validations";

const log = createLogger("admin-update-order-email");

export const POST = withContext(async (req: Request) => {
 try {
 const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!authHeader) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 const {
 data: { user },
 error: authError,
 } = await supabaseAdmin.auth.getUser(authHeader);
 if (authError || !user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 if (!(await isAdminUser(user.id))) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const { orderId, newEmail } = await req.json() as { orderId?: string; newEmail?: string };
 if (!orderId || !newEmail || !emailField.safeParse(newEmail).success) {
 return NextResponse.json(
 { error: "orderId and newEmail are required" },
 { status: 400 },
 );
 }

 const { error } = await supabaseAdmin
 .from("orders")
 .update({ email: newEmail })
 .eq("id", orderId);

 if (error) {
 log.error({ err: error, orderId }, "Failed to update order email");
 return NextResponse.json(
 { error: "Failed to update order email" },
 { status: 500 },
 );
 }

 return NextResponse.json({ success: true });
 } catch (err) {
 log.error({ err }, "Admin update-order-email error");
 return NextResponse.json(
 { error: "Internal server error" },
 { status: 500 },
 );
 }
});
