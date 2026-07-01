export function isAllowedDomain(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isFalMedia = hostname === "fal.media" || hostname.endsWith(".fal.media");
    let isSupabase = false;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        isSupabase = hostname === supabaseUrl.hostname || hostname.endsWith("." + supabaseUrl.hostname);
      } catch {
        isSupabase = hostname.endsWith(".supabase.co") || hostname === "supabase.co";
      }
    } else {
      isSupabase = hostname.endsWith(".supabase.co") || hostname === "supabase.co";
    }
    return isFalMedia || isSupabase;
  } catch {
    return false;
  }
}
