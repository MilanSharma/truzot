import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-ads";

// One-time diagnostic: confirms the GOOGLE_ADS_* OAuth env vars actually
// exchange for a valid access token, without touching real conversion data.
// Delete after running once.
const ONE_TIME_SECRET = "f7a2c916e4b83d0a5f6c9127e8b04d3a1c5e7f92b6d4038a";

export async function GET(req: Request) {
  const authHeader = req.headers.get("x-truzot-secret");
  if (authHeader !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getAccessToken();
    return NextResponse.json({
      ok: true,
      message: "OAuth token exchange succeeded",
      tokenPreview: `${token.slice(0, 12)}...`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
