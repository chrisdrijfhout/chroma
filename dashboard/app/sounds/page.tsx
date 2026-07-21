import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

export default async function SoundsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (["latest", "week", "all"].includes(searchParams?.range ?? "") ? searchParams.range : "week") as "latest" | "week" | "all";

  let since: string | null = null;
  if (range === "week") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "latest") {
    const { data: latest } = await supabase
      .from("videos").select("first_collected_at")
      .order("first_collected_at", { ascending: false }).limit(1).single();
    if (latest?.first_collected_at) {
      since = new Date(new Date(latest.first_collected_at).getTime() - 60 * 60 * 1000).toISOString();
    }
  }

  const { data: sounds, error } = await supabase
    .from("sounds")
    .select(`
      id, sound_name, original_artist,
      videos ( id, like_count_snapshot, creator_id, first_collected_at )
    `);

  const ranked = (sounds ?? [])
    .map((s: any) => {
      const relevantVideos = since
        ? (s.videos ?? []).filter((v: any) => v.first_collected_at >= since)
        : (s.videos ?? []);
      const videoCount = relevantVideos.length;
      const totalLikes = relevantVideos.reduce((sum: number, v: any) => sum + (v.like_count_snapshot ?? 0), 0);
      const uniqueCreators = new Set(relevantVideos.map((v: any) => v.creator_id)).size;
      return { ...s, videoCount, totalLikes, uniqueCreators };
    })
    .filter((s: any) => s.videoCount > 0)
    .sort((a: any, b: any) => b.uniqueCreators - a.uniqueCreators)
    .slice(0, 20);

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    background: active ? "#5ac8fa" : "#111214",
    color: active ? "#0a0a0a" : "#8a8f98",
    border: `1px solid ${active ? "#5ac8fa" : "#222427"}`,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>Sounds</h1>
          <p style={{ color: "#8a8f98", fontSize: 13 }}>Ranked by unique creators — the real early signal</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/sounds?range=latest" style={tabStyle(range === "latest")}>Latest</a>
          <a href="/sounds?range=week" style={tabStyle(range === "week")}>This Week</a>
          <a href="/sounds?range=all" style={tabStyle(range === "all")}>All Time</a>
        </div>
      </div>

      {error && (
        <pre style={{ color: "#f87171", background: "#1a1010", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid #3a1f1f", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranked.map((s: any, i: number) => (
          <div
            key={s.id}
            className="card-hover"
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
              background: "#111214", border: "1px solid #222427", borderRadius: 10,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: "#1a1c1f", color: "#5ac8fa",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.sound_name || "Untitled sound"}
              </div>
              <div style={{ fontSize: 12, color: "#8a8f98" }}>
                {s.original_artist || "Unattributed"} · {s.uniqueCreators} unique creator{s.uniqueCreators !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, color: "#5ac8fa", fontWeight: 700 }}>{s.videoCount} videos</div>
              <div style={{ fontSize: 11, color: "#54585f" }}>{s.totalLikes.toLocaleString()} likes</div>
            </div>
          </div>
        ))}
      </div>

      {ranked.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#54585f" }}>
          No sound data for this range yet.
        </div>
      )}
    </div>
  );
}
