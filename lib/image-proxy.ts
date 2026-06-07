const FAL_DOMAINS = ["fal.media", "storage.fal.ai"];

export function isFalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return FAL_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

export function getProxyUrl(url: string): string {
  if (!isFalUrl(url)) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
