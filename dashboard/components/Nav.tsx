import RefreshButton from "./RefreshButton";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/insights", label: "AI Insights" },
];

const CLIENT_NAME = "Tribal Music Group";

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

export default async function Nav() {
  const { data: latest } = await supabase
    .from("videos")
    .select("last_collected_at")
    .order("last_collected_at", { ascending: false })
    .limit(1)
    .single();

  const lastRunAt = latest?.last_collected_at ?? null;

  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 4, padding: "14px 24px",
      borderBottom: "1px solid #1c1e21", background: "rgba(10,10,10,0.9)",
      position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 20, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #5ac8fa, #a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 15, color: "#0a0a0a", flexShrink: 0,
        }}>
          C
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontWeight: 700, color: "#fff", letterSpacing: 0.5, fontSize: 15 }}>CHROMA</span>
          <span style={{ fontSize: 10, color: "#54585f" }}>× {CLIENT_NAME}</span>
        </div>
      </a>

      <div style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8a8f98",
        borderLeft: "1px solid #222427", paddingLeft: 16, marginRight: 24,
      }}>
        <span style={{ color: "#54585f" }}>Last refresh:</span>
        <span style={{ color: "#dcdde0", fontWeight: 600 }}>{formatRelativeTime(lastRunAt)}</span>
      </div>

      {links.map((l) => (
        <a key={l.href} href={l.href} className="nav-link" style={{
          color: "#8a8f98", textDecoration: "none", fontSize: 13,
          padding: "7px 14px", borderRadius: 6, fontWeight: 500,
        }}>
          {l.label}
        </a>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <RefreshButton lastRunAt={lastRunAt} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#54585f" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          Live
        </div>
      </div>
    </nav>
  );
}
