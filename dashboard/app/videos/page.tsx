import { supabase } from "@/lib/supabaseClient";
import SafeImage from "@/components/SafeImage";

export const dynamic = 'force-dynamic';

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = searchParams?.range === "week" ? "week" : "latest";

  let videos: any[] = [];
  let error: any = null;

  if (range === "week") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await supabase
      .from("videos")
      .select(`
        id, caption, video_url, published_at, thumbnail_url, like_count_snapshot,
        creators ( tiktok_username ),
        sounds ( sound_name )
      `)
      .gte("first_collected_at", sevenDaysAgo)
      .order("like_count_snapshot", { ascending: false })
      .limit(10);
    videos = result.data ?? [];
    error = result.error;
  } else {
    const { data: latest } = await supabase
      .from("videos")
      .select("first_collected_at")
      .order("first_collected_at", { ascending: false })
      .limit(1)
      .single();

    if (latest?.first_collected_at) {
      const cutoff = new Date(
        new Date(latest.first_collected_at).getTime() - 60 * 60 * 1000
      ).toISOString();
      const result = await supabase
        .from("videos")
        .select(`
          id, caption, video_url, published_at, thumbnail_url, like_count_snapshot,
          creators ( tiktok_username ),
          sounds ( sound_name )
        `)
        .gte("first_collected_at", cutoff)
        .order("like_count_snapshot", { ascending: false })
        .limit(10);
      videos = result.data ?? [];
      error = result.error;
    }
  }

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    background: active ? "#5ac8fa" : "#111214",
    color: active ? "#0a0a0a" : "#8a8f98",
    border: `1px solid ${active ? "#5ac8fa" : "#222427"}`,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>Trending Videos</h1>
          <p style={{ color: "#8a8f98", fontSize: 13 }}>Top 10 by likes</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/videos?range=latest" style={tabStyle(range === "latest")}>Latest Scrape</a>
          <a href="/videos?range=week" style={tabStyle(range === "week")}>This Week</a>
        </div>
      </div>

      {error && (
        <pre style={{ color: "#f87171", background: "#1a1010", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid #3a1f1f", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
        {videos.map((v: any, i: number) => (
          <a
            key={v.id}
            href={v.video_url}
            target="_blank"
            className="card-hover"
            style={{
              display: "block", background: "#111214", borderRadius: 12, overflow: "hidden",
              textDecoration: "none", color: "#eee", border: "1px solid #222427",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "9/16", background: "#000" }}>
              <SafeImage src={v.thumbnail_url} alt={v.caption ?? ""} />
              <div style={{
                position: "absolute", top: 8, left: 8, background: "#5ac8fa", color: "#000",
                fontWeight: 700, fontSize: 11, borderRadius: 5, padding: "3px 7px",
              }}>
                #{i + 1}
              </div>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 10px 10px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  @{v.creators?.tiktok_username ?? "unknown"}
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "#8a8f98", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.sounds?.sound_name ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "#5ac8fa", fontWeight: 600 }}>
                ❤ {v.like_count_snapshot?.toLocaleString() ?? "—"}
              </div>
            </div>
          </a>
        ))}
      </div>

      {videos.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#54585f" }}>
          No data yet for this range.
        </div>
      )}
    </div>
  );
}
