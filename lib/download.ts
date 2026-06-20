import { supabase } from "@/lib/supabase/client";

const ZIP_BATCH_SIZE = 100;

export async function serverSideDownload(
  urls: string[],
  orderId: string,
  filename: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const downloadBatch = async (batchUrls: string[], batchFilename: string) => {
    const response = await fetch("/api/download/zip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ imageUrls: batchUrls, orderId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Download failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = batchFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (urls.length <= ZIP_BATCH_SIZE) {
    onProgress?.(1, 1);
    await downloadBatch(urls, filename);
    onProgress?.(urls.length, urls.length);
    return;
  }

  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += ZIP_BATCH_SIZE)
    batches.push(urls.slice(i, i + ZIP_BATCH_SIZE));
  for (let i = 0; i < batches.length; i++) {
    onProgress?.(i + 1, batches.length);
    await downloadBatch(
      batches[i],
      `${filename.replace(".zip", "")}_part${i + 1}.zip`,
    );
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 500));
  }
}
