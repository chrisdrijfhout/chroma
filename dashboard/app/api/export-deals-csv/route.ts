import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");

  let query = sb.from("deals").select("*").order("updated_at", { ascending: false });
  if (filter === "signed") query = query.eq("status", "Signed");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ["Artist Name", "TikTok Handle", "Instagram Handle", "Email", "Status", "Next Step", "TikTok Views", "Spotify Monthly Listeners", "TikTok URL"];
  const rows = (data ?? []).map((d: any) => [
    d.artist_name, d.tiktok_handle, d.instagram_handle, d.email, d.status,
    d.next_step, d.tiktok_views_override, d.spotify_monthly_listeners, d.tiktok_url,
  ]);

  const escape = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

  const filename = filter === "signed" ? "Chroma_Signed_Deals.csv" : "Chroma_All_Deals.csv";
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
