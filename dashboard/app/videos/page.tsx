import { supabase } from "@/lib/supabaseClient";

export default async function VideosPage() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: videos, error } = await supabase
    .from("videos")
    .select(`
      id, caption, video_url, published_at, thumbnail_url, like_count_snapshot,
      creators ( tiktok_username ),
      sounds ( sound_name )
    `)
    .gte("published_at", twentyFourHoursAgo)
    .order("like_count_snapshot", { ascending: false })
    .limit(10);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 4, color: "#fff" }}>Top 10 — Last 24 Hours</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>Ranked by likes, published in the last 24h</p>

      {error && (
        <pre style={{ color: "#f66", background: "#200", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {videos?.map((v: any, i: number) => (
          <a
            key={v.id}
            href={v.video_url}
            target="_blank"
            style={{
              display: "block", background: "#111", borderRadius: 10, overflow: "hidden",
              textDecoration: "none", color: "#eee", border: "1px solid #222",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "9/16", background: "#000" }}>
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#444" }}>
                  no thumbnail
                </div>
              )}
              <div style={{
                position: "absolute", top: 8, left: 8, background: "#6cf", color: "#000",
                fontWeight: 700, fontSize: 12, borderRadius: 4, padding: "2px 6px",
              }}>
                #{i + 1}
              </div>
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                @{v.creators?.tiktok_username ?? "unknown"}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                {v.sounds?.sound_name ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "#6cf" }}>
                ❤ {v.like_count_snapshot?.toLocaleString() ?? "—"} likes
              </div>
            </div>
          </a>
        ))}
      </div>

      {(!videos || videos.length === 0) && !error && (
        <p style={{ marginTop: 16, color: "#666" }}>Nothing published in the last 24 hours yet.</p>
      )}
    </div>
  );
}
