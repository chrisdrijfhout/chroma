import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SoundsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (["latest", "week", "all"].includes(searchParams?.range ?? "") ? searchParams.range : "week") as "latest" | "week" | "all";

  let since: string | null = null;
  if (range === "week") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "latest") {
    const { data: latest } = await supabase.from("videos").select("last_collected_at").order("last_collected_at", { ascending: false }).limit(1).single();
    if (latest?.last_collected_at) {
      since = new Date(new Date(latest.last_collected_at).getTime() - 60 * 60 * 1000).toISOString();
    }
  }

  const { data: sounds, error } = await supabase
    .from("sounds")
    .select(`id, sound_name, original_artist, is_original, videos ( id, like_count_snapshot, creator_id, last_collected_at )`);

  const ranked = (sounds ?? [])
    .map((s: any) => {
      const relevantVideos = since ? (s.videos ?? []).filter((v: any) => v.last_collected_at >= since) : (s.videos ?? []);
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
    background: active ? "var(--accent)" : "var(--card)",
    color: active ? "#0a0a0a" : "var(--text-dim)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "var(--text)", fontWeight: 700 }}>Sounds</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Ranked by unique creators — the real early signal</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/sounds?range=latest" style={tabStyle(range === "latest")}>Latest</a>
          <a href="/sounds?range=week" style={tabStyle(range === "week")}>This Week</a>
          <a href="/sounds?range=all" style={tabStyle(range === "all")}>All Time</a>
        </div>
      </div>

      {error && (
        <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid var(--danger)", fontSize: 12 }}>
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
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 5, background: "var(--bg-elevated)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.sound_name || "Untitled sound"}
                </div>
                {s.is_original && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#0a0a0a", background: "var(--spectrum-1)", borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>
                    ORIGINAL
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {s.original_artist || "Unattributed"} · {s.uniqueCreators} unique creator{s.uniqueCreators !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700 }}>{s.videoCount} videos</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{s.totalLikes.toLocaleString()} likes</div>
            </div>
          </div>
        ))}
      </div>

      {ranked.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>No sound data for this range yet.</div>
      )}
    </div>
  );
}
