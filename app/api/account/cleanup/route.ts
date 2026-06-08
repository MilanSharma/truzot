import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { deleteFalFiles } from "@/lib/ai/fal-cleanup";

const log = createLogger("account-cleanup");

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id);

    if (orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);

      const { data: headshots } = await supabaseAdmin
        .from("headshots")
        .select("image_url")
        .in("order_id", orderIds);

      const { data: trainings } = await supabaseAdmin
        .from("trainings")
        .select("model_id")
        .in("order_id", orderIds)
        .not("model_id", "is", null);

      const falUrls: string[] = [];
      if (headshots) {
        for (const h of headshots) {
          if (h.image_url) falUrls.push(h.image_url);
        }
      }
      if (trainings) {
        for (const t of trainings) {
          if (t.model_id) falUrls.push(t.model_id);
        }
      }
      if (falUrls.length > 0) {
        await deleteFalFiles(falUrls);
      }
    }

    return addCors(NextResponse.json({ success: true }), origin);
  } catch (err) {
    log.error({ err }, "Account cleanup failed");
    return addCors(
      NextResponse.json({ error: "Cleanup failed" }, { status: 500 }),
      origin,
    );
  }
});
