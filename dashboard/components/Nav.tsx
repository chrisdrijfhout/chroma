import RefreshButton from "./RefreshButton";
import ThemeToggle from "./ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
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
      borderBottom: "1px solid var(--border)", background: "var(--bg)",
      position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 20, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0,
          boxShadow: "0 0 16px rgba(139,124,246,0.25)",
        }}>
          C
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, letterSpacing: 0.5, fontSize: 15,
            background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            CHROMA
          </span>
          <span style={{ fontSize: 10, color: "var(--text-faint)" }}>× {CLIENT_NAME}</span>
        </div>
      </a>

      <div style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-dim)",
        borderLeft: "1px solid var(--border)", paddingLeft: 16, marginRight: 24,
      }}>
        <span style={{ color: "var(--text-faint)" }}>Last collection:</span>
        <span style={{ color: "var(--text)", fontWeight: 600 }}>{formatRelativeTime(lastRunAt)}</span>
      </div>

      {links.map((l) => (
        <a key={l.href} href={l.href} className="nav-link" style={{
          color: "var(--text-dim)", textDecoration: "none", fontSize: 13,
          padding: "7px 14px", borderRadius: 6, fontWeight: 500,
        }}>
          {l.label}
        </a>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <RefreshButton lastRunAt={lastRunAt} />
        <ThemeToggle />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-faint)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
          Live
        </div>
      </div>
    </nav>
  );
}
