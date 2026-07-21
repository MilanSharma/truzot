import JSZip from "jszip";
import { supabase } from "@/lib/supabase/client";

export async function downloadAsZip(
  urls: string[],
  orderId: string,
  filename: string,
  onProgress?: (current: number, total: number) => void,
  /** Optional per-URL filenames (aligned with `urls`). Falls back to
   * headshot_N.jpg — pass category-based names for an organized deliverable. */
  names?: string[],
): Promise<{ failedCount: number }> {
  // Limit to 50 images to prevent browser memory crashes on mobile devices
  const MAX_ZIP_IMAGES = 50;
  if (urls.length > MAX_ZIP_IMAGES) {
    throw new Error(`Cannot download more than ${MAX_ZIP_IMAGES} images at once. Please download in smaller batches.`);
  }

  const zip = new JSZip();
  let completed = 0;
  const failedUrls: string[] = [];

  // Get authentication headers
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const downloadToken = searchParams.get("download_token");
  const emailToken = searchParams.get("email_token");

  // Download chunks in parallel to prevent browser hanging, but limit concurrency
  const chunkSize = 5;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (url, idx) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // Increased to 30s timeout

      try {
        // Pass tokens to the proxy securely
        let proxyUrl = `/api/download/proxy?url=${encodeURIComponent(url)}&orderId=${orderId}`;
        if (downloadToken) proxyUrl += `&download_token=${downloadToken}`;
        if (emailToken) proxyUrl += `&email_token=${emailToken}`;
        
        const res = await fetch(proxyUrl, { headers, signal: controller.signal });
        clearTimeout(timeout);
        
        if (res.ok) {
            const blob = await res.blob();
            zip.file(names?.[i + idx] || `headshot_${i + idx + 1}.jpg`, blob);
        } else {
          failedUrls.push(url);
        }
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') {
          console.warn(`Timeout fetching ${url}`);
        } else {
          console.warn("Failed to fetch image", e);
        }
        failedUrls.push(url);
      }
      completed++;
      onProgress?.(completed, urls.length);
    }));
  }

  // Show zipping phase separately
  onProgress?.(urls.length, urls.length + 1);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  onProgress?.(urls.length + 1, urls.length + 1);
  
  const dlUrl = URL.createObjectURL(zipBlob);
  try {
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  } finally {
    URL.revokeObjectURL(dlUrl);
  }

  return { failedCount: failedUrls.length };
}
