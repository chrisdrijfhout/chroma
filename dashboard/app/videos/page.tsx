import { supabase } from "@/lib/supabaseClient";
import SafeImage from "@/components/SafeImage";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EDIT_KEYWORDS = ["slowed", "sped up", "spdup", "sped-up", "speedup", "reverb", "nightcore"];

function looksLikeEdit(caption: string | null, soundName: string | null) {
  const text = `${caption ?? ""} ${soundName ?? ""}`.toLowerCase();
  return EDIT_KEYWORDS.some((kw) => text.includes(kw));
}

function formatPostedAt(iso: string | null) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// Likes-per-hour since posting — works from a single snapshot, unlike
// growth-rate scoring which needs two visits to the same video. A video
// with the same like count as another but posted more recently scores
// higher here, surfacing genuine early momentum instead of just raw size.
function velocityScore(likes: number, publishedAt: string | null) {
  if (!publishedAt) return 0;
  const hoursSincePosted = Math.max(
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60),
    0.5 // floor, so a video posted seconds ago doesn't divide by ~0
  );
  return likes / hoursSincePosted;
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { range?: string; only?: string };
}) {
  const range = searchParams?.range === "week" ? "week" : "latest";
  const producersOnly = searchParams?.only === "producers";

  let videos: any[] = [];
  let error: any = null;

  const videoSelect = `
    id, caption, video_url, published_at, thumbnail_url, like_count_snapshot,
    creators ( tiktok_username ),
    sounds ( sound_name, is_original )
  `;

  if (range === "week") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await supabase
      .from("videos")
      .select(videoSelect)
      .gte("last_collected_at", sevenDaysAgo)
      .limit(150);
    videos = result.data ?? [];
    error = result.error;
  } else {
    const { data: latest } = await supabase
      .from("videos")
      .select("last_collected_at")
      .order("last_collected_at", { ascending: false })
      .limit(1)
      .single();

    if (latest?.last_collected_at) {
      const cutoff = new Date(
        new Date(latest.last_collected_at).getTime() - 60 * 60 * 1000
      ).toISOString();
      const result = await supabase
        .from("videos")
        .select(videoSelect)
        .gte("last_collected_at", cutoff)
        .limit(150);
      videos = result.data ?? [];
      error = result.error;
    }
  }

  if (producersOnly) {
    videos = videos.filter((v: any) =>
      v.sounds?.is_original === true && !looksLikeEdit(v.caption, v.sounds?.sound_name)
    );
  }

  videos = videos
    .map((v: any) => ({
      ...v,
      _velocity: velocityScore(v.like_count_snapshot ?? 0, v.published_at),
    }))
    .sort((a: any, b: any) => b._velocity - a._velocity)
    .slice(0, 10);

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    background: active ? "#5ac8fa" : "#111214",
    color: active ? "#0a0a0a" : "#8a8f98",
    border: `1px solid ${active ? "#5ac8fa" : "#222427"}`,
  });

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ range, ...(producersOnly ? { only: "producers" } : {}), ...params });
    return `/videos?${sp.toString()}`;
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>Trending Videos</h1>
          <p style={{ color: "#8a8f98", fontSize: 13 }}>
            Ranked by likes-per-hour since posting {producersOnly && "· original sounds, edits filtered out"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={buildUrl({ range: "latest" })} style={tabStyle(range === "latest")}>Latest Scrape</a>
          <a href={buildUrl({ range: "week" })} style={tabStyle(range === "week")}>This Week</a>
          <span style={{ width: 1, background: "#222427", margin: "0 4px" }} />
          <a
            href={producersOnly ? `/videos?range=${range}` : `/videos?range=${range}&only=producers`}
            style={tabStyle(producersOnly)}
            title="Original sounds only, with common edit/repost keywords filtered out"
          >
            🎹 Producers Only
          </a>
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
                position: "absolute", top: 8, right: 8,
                background: "linear-gradient(135deg, #ff6b6b, #ffa94d)", color: "#0a0a0a",
                fontWeight: 700, fontSize: 10, borderRadius: 5, padding: "3px 6px",
              }}>
                🔥 {v._velocity.toFixed(0)}/hr
              </div>
              {v.sounds?.is_original && (
                <div style={{
                  position: "absolute", top: 30, right: 8,
                  background: "#a78bfa", color: "#0a0a0a",
                  fontWeight: 700, fontSize: 9, borderRadius: 5, padding: "2px 6px",
                }}>
                  ORIGINAL
                </div>
              )}
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
              <div style={{ fontSize: 11, color: "#8a8f98", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.sounds?.sound_name ?? "—"}
              </div>
              <div style={{ fontSize: 10, color: "#54585f", marginBottom: 6 }}>
                Posted {formatPostedAt(v.published_at)}
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
          {producersOnly ? "No original, non-edit videos in this range yet." : "No data yet for this range."}
        </div>
      )}
    </div>
  );
}
