import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

function formatRelativeTime(iso: string | null) {
  if (!iso) return "No data yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const stats = await getStats();

  const { data: latest } = await supabase
    .from("videos")
    .select("last_collected_at")
    .order("last_collected_at", { ascending: false })
    .limit(1)
    .single();

  const cards = [
    { label: "Videos Tracked", value: stats.videos },
    { label: "Creators Identified", value: stats.creators },
    { label: "Sounds Indexed", value: stats.sounds },
  ];

  return (
    <div style={{
      padding: "64px 24px", maxWidth: 820, margin: "0 auto", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        display: "inline-block", fontSize: 11, color: "var(--spectrum-2)",
        background: "var(--card)", border: "1px solid var(--border-light)",
        borderRadius: 20, padding: "4px 14px", marginBottom: 20, letterSpacing: 0.5,
      }}>
        PHONK / TIKTOK · FIRST DEPLOYMENT
      </div>
      <h1 style={{
        fontSize: 40, margin: "0 0 12px 0", fontWeight: 700, letterSpacing: -1,
        background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>
        Chroma
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 40, fontSize: 15, maxWidth: 480 }}>
        Trend intelligence for scenes the big platforms track too late.
        We index the sound, not just the artist — before it has a name.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16, width: "100%" }}>
        {cards.map((c) => (
          <div key={c.label} className="card-hover" style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 16px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 4, fontFamily: "var(--font-display), sans-serif" }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 40 }}>
        Last collection run: <span style={{ color: "var(--text-dim)", fontWeight: 600 }}>{formatRelativeTime(latest?.last_collected_at ?? null)}</span>
      </div>

      <Link href="/videos" style={{
        display: "inline-block", padding: "12px 28px",
        background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
        color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14,
        fontFamily: "var(--font-display), sans-serif",
      }}>
        View Trending Now →
      </Link>
    </div>
  );
}
