export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabaseClient";

async function getStats() {
  const [{ count: videoCount }, { count: creatorCount }, { count: soundCount }] = await Promise.all([
    supabase.from("videos").select("*", { count: "exact", head: true }),
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase.from("sounds").select("*", { count: "exact", head: true }),
  ]);
  return {
    videos: videoCount ?? 0,
    creators: creatorCount ?? 0,
    sounds: soundCount ?? 0,
  };
}

export default async function HomePage() {
  const stats = await getStats();

  const cards = [
    { label: "Videos Tracked", value: stats.videos },
    { label: "Creators", value: stats.creators },
    { label: "Sounds", value: stats.sounds },
  ];

  return (
    <div style={{ padding: "64px 24px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        display: "inline-block", fontSize: 11, color: "#5ac8fa", background: "#132025",
        border: "1px solid #1e3a44", borderRadius: 20, padding: "4px 14px", marginBottom: 20,
        letterSpacing: 0.5,
      }}>
        FIRST DEPLOYMENT · PHONK / TIKTOK
      </div>
      <h1 style={{ fontSize: 40, marginBottom: 12, fontWeight: 700, letterSpacing: -1 }}>Chroma</h1>
      <p style={{ color: "#8a8f98", marginBottom: 40, fontSize: 15, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
        Trend intelligence for scenes the big platforms track too late.
        We watch the sound, not just the artist — before it has a name.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 }}>
        {cards.map((c) => (
          <div key={c.label} style={{
            background: "#111214", border: "1px solid #222427", borderRadius: 12, padding: "20px 16px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#8a8f98" }}>{c.label}</div>
          </div>
        ))}
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
