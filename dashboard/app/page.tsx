import { supabase } from "@/lib/supabaseClient";
import MiniBarChart from "@/components/MiniBarChart";

export const dynamic = 'force-dynamic';

async function getStats(range: "today" | "week" | "all") {
  let since: string | null = null;
  if (range === "today") since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (range === "week") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const videoQuery = supabase.from("videos").select("*", { count: "exact", head: true });
  const creatorQuery = supabase.from("creators").select("*", { count: "exact", head: true });
  const soundQuery = supabase.from("sounds").select("*", { count: "exact", head: true });

  if (since) {
    videoQuery.gte("last_collected_at", since);
    creatorQuery.gte("last_seen_at", since);
    soundQuery.gte("last_seen_at", since);
  }

  const [{ count: videoCount }, { count: creatorCount }, { count: soundCount }] = await Promise.all([
    videoQuery, creatorQuery, soundQuery,
  ]);

  return {
    videos: videoCount ?? 0,
    creators: creatorCount ?? 0,
    sounds: soundCount ?? 0,
  };
}

async function getDailyActivity() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("videos")
    .select("last_collected_at")
    .gte("last_collected_at", sevenDaysAgo);

  const counts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    counts[key] = 0;
  }
  (data ?? []).forEach((row: any) => {
    const key = new Date(row.last_collected_at).toLocaleDateString("en-US", { weekday: "short" });
    if (key in counts) counts[key] += 1;
  });

  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (["today", "week", "all"].includes(searchParams?.range ?? "") ? searchParams.range : "all") as "today" | "week" | "all";

  const [stats, activity] = await Promise.all([getStats(range), getDailyActivity()]);

  const cards = [
    { label: "Videos Tracked", value: stats.videos },
    { label: "Creators", value: stats.creators },
    { label: "Sounds", value: stats.sounds },
  ];

  const rangeTabStyle = (active: boolean) => ({
    padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    background: active ? "#5ac8fa" : "transparent",
    color: active ? "#0a0a0a" : "#8a8f98",
    border: `1px solid ${active ? "#5ac8fa" : "#2a2d31"}`,
  });

  return (
    <div style={{ padding: "56px 24px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        display: "inline-block", fontSize: 11, color: "#5ac8fa", background: "#132025",
        border: "1px solid #1e3a44", borderRadius: 20, padding: "4px 14px", marginBottom: 20,
        letterSpacing: 0.5,
      }}>
        FIRST DEPLOYMENT · PHONK / TIKTOK
      </div>
      <h1 style={{ fontSize: 40, marginBottom: 12, fontWeight: 700, letterSpacing: -1 }}>Chroma</h1>
      <p style={{ color: "#8a8f98", marginBottom: 32, fontSize: 15, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
        Trend intelligence for scenes the big platforms track too late.
        We watch the sound, not just the artist — before it has a name.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
        <a href="/?range=today" style={rangeTabStyle(range === "today")}>Today</a>
        <a href="/?range=week" style={rangeTabStyle(range === "week")}>This Week</a>
        <a href="/?range=all" style={rangeTabStyle(range === "all")}>All Time</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} style={{
            background: "#111214", border: "1px solid #222427", borderRadius: 12, padding: "20px 16px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#8a8f98" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "#111214", border: "1px solid #222427", borderRadius: 12, padding: "18px 20px", marginBottom: 32, textAlign: "left",
      }}>
        <div style={{ fontSize: 12, color: "#8a8f98", marginBottom: 12 }}>Videos scraped, last 7 days</div>
        <MiniBarChart data={activity} />
      </div>

      <a href="/videos" style={{
        display: "inline-block", padding: "12px 28px", background: "#5ac8fa",
        color: "#000", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14,
      }}>
        View Trending Now →
      </a>
    </div>
  );
}
