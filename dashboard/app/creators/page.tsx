import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreatorsPage({
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

  const { data: creators, error } = await supabase
    .from("creators")
    .select(`id, tiktok_username, follower_count, videos ( id, like_count_snapshot, last_collected_at )`);

  const ranked = (creators ?? [])
    .map((c: any) => {
      const relevantVideos = since ? (c.videos ?? []).filter((v: any) => v.last_collected_at >= since) : (c.videos ?? []);
      const videoCount = relevantVideos.length;
      const totalLikes = relevantVideos.reduce((sum: number, v: any) => sum + (v.like_count_snapshot ?? 0), 0);
      return { ...c, videoCount, totalLikes };
    })
    .filter((c: any) => c.videoCount > 0)
    .sort((a: any, b: any) => b.totalLikes - a.totalLikes)
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
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "var(--text)", fontWeight: 700 }}>Creators</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Ranked by total likes across tracked videos</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/creators?range=latest" style={tabStyle(range === "latest")}>Latest</a>
          <a href="/creators?range=week" style={tabStyle(range === "week")}>This Week</a>
          <a href="/creators?range=all" style={tabStyle(range === "all")}>All Time</a>
        </div>
      </div>

      {error && (
        <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid var(--danger)", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranked.map((c: any, i: number) => (
          <a
            key={c.id}
            href={`https://www.tiktok.com/@${c.tiktok_username}`}
            target="_blank"
            className="card-hover"
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
              textDecoration: "none", color: "var(--text)",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
              color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {c.tiktok_username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: 5, background: "var(--bg-elevated)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>@{c.tiktok_username}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {c.videoCount} video{c.videoCount !== 1 ? "s" : ""} tracked
                {c.follower_count ? ` · ${c.follower_count.toLocaleString()} followers` : ""}
              </div>
            </div>
            <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }}>
              ❤ {c.totalLikes.toLocaleString()}
            </div>
          </a>
        ))}
      </div>

      {ranked.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>No creator data for this range yet.</div>
      )}
    </div>
  );
}
