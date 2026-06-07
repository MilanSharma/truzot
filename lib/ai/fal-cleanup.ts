import "server-only";
import { createLogger } from "@/lib/logger";

const log = createLogger("fal-cleanup");

const FAL_REST_BASE = "https://rest.fal.ai/storage";

function extractFileId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname.includes("fal.media") &&
      !parsed.hostname.includes("fal.ai")
    ) {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "files" && parts.length >= 3) {
      return parts.slice(1).join("/");
    }
    const filename = parts[parts.length - 1];
    return filename || null;
  } catch {
    return null;
  }
}

export async function deleteFalFile(url: string): Promise<boolean> {
  try {
    const falKey = process.env.FAL_KEY;
    if (!falKey) return false;

    let fileId = extractFileId(url);
    if (!fileId) {
      if (url.startsWith("http")) return false;
      fileId = url;
    }
    if (!fileId) return false;

    const encoded = fileId.includes("/") ? fileId : encodeURIComponent(fileId);
    const res = await fetch(`${FAL_REST_BASE}/${encoded}`, {
      method: "DELETE",
      headers: { Authorization: `Key ${falKey}` },
    });

    if (res.ok || res.status === 404) return true;
    log.warn({ url, fileId, status: res.status }, "Fal file delete failed");
    return false;
  } catch (err) {
    log.warn({ err, url }, "Fal file delete error");
    return false;
  }
}

export async function deleteFalFiles(
  urls: string[],
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  for (const url of urls) {
    const ok = await deleteFalFile(url);
    if (ok) deleted++;
    else failed++;
  }
  return { deleted, failed };
}
