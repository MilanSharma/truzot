import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadActionSchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("upload");

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
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);
    if (!user)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const body = await req.json();
    const parsed = validate(uploadActionSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    const { action, filename, path } = parsed.data!;

    if (action === "get-upload-url") {
      const safeFilename = `${user.id}/dataset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.zip`;
      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .createSignedUploadUrl(safeFilename);
      if (error)
        return addCors(
          NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 },
          ),
          origin,
        );
      return addCors(
        NextResponse.json({
          signedUrl: data.signedUrl,
          token: data.token,
          path: data.path,
        }),
        origin,
      );
    }

    if (action === "get-download-url") {
      if (!path)
        return addCors(
          NextResponse.json({ error: "Missing path" }, { status: 400 }),
          origin,
        );
      if (!path.startsWith(`${user.id}/`)) {
        return addCors(
          NextResponse.json(
            { error: "Forbidden. You do not own this resource." },
            { status: 403 },
          ),
          origin,
        );
      }
      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .createSignedUrl(path, 7200);
      if (error || !data?.signedUrl)
        return addCors(
          NextResponse.json(
            { error: "Failed to generate download URL" },
            { status: 500 },
          ),
          origin,
        );
      return addCors(
        NextResponse.json({ zipUrl: data.signedUrl, storagePath: path }),
        origin,
      );
    }

    return addCors(
      NextResponse.json({ error: "Invalid action" }, { status: 400 }),
      origin,
    );
  } catch (err) {
    log.error({ err }, "Upload failed");
    return addCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      origin,
    );
  }
});
