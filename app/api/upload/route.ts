import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadActionSchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("upload");

function isValidPath(path: string): boolean {
 // Reject path traversal sequences and absolute paths
 if (path.includes("..")) return false;
 if (path.startsWith("/")) return false;
 // Only allow alphanumeric, dashes, underscores, slashes, dots
 return /^[\w\-./]+$/.test(path);
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 let ownerId: string | null = null;

 if (token) {
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(token);
 if (user) ownerId = user.id;
 }

 const body = await req.json() as Record<string, unknown>;
 const parsed = validate(uploadActionSchema, body);
 if (parsed.error)
 return addCors(
 NextResponse.json({ error: parsed.error }, { status: 400 }),
 origin,
 );
 const { action, filename, path } = parsed.data!;

 if (action === "get-upload-url") {
 const prefix = ownerId ?? crypto.randomUUID();
 const safeFilename = `${prefix}/dataset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.zip`;
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

 if (action === "check") {
 if (!path || !isValidPath(path))
 return addCors(
 NextResponse.json({ error: "Invalid path" }, { status: 400 }),
 origin,
 );
 const parentPath = path.split("/").slice(0, -1).join("/");
 const fileName = path.split("/").pop();
 const { data: files } = await supabaseAdmin.storage
 .from("uploads")
 .list(parentPath);
 const exists = files?.some((f) => f.name === fileName);
 if (!exists)
 return addCors(
 NextResponse.json({ error: "File not found" }, { status: 404 }),
 origin,
 );
 return addCors(NextResponse.json({ ok: true }), origin);
 }

 if (action === "get-download-url") {
 if (!path || !isValidPath(path))
 return addCors(
 NextResponse.json({ error: "Invalid path" }, { status: 400 }),
 origin,
 );
 if (ownerId && !path.startsWith(`${ownerId}/`)) {
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
