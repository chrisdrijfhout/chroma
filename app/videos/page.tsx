import { supabase } from "@/lib/supabaseClient";

export default async function VideosPage() {
  const { data: latest } = await supabase
    .from("videos")
    .select("first_collected_at")
    .order("first_collected_at", { ascending: false })
    .limit(1)
    .single();

  let videos: any[] = [];
  let error: any = null;

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

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>Trending Videos</h1>
        <p style={{ color: "#8a8f98", fontSize: 13 }}>Top 10 by likes, from the most recent scrape</p>
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
              {v.thumbnail_url ? (
                <img
                  src={v.thumbnail_url}
                  alt={v.caption ?? ""}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 12 }}>
                  no thumbnail
                </div>
              )}
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
          No data yet — run the pipeline first.
        </div>
      )}
    </div>
  );
}
