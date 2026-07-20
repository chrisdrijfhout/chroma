export const dynamic = 'force-dynamic';
import RefreshButton from "./RefreshButton";
import { supabase } from "@/lib/supabaseClient";

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/insights", label: "AI Insights" },
];

const CLIENT_NAME = "Tribal Music Group";

export default async function Nav() {
  const { data: latest } = await supabase
    .from("videos")
    .select("first_collected_at")
    .order("first_collected_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 4, padding: "14px 24px",
      borderBottom: "1px solid #1c1e21", background: "rgba(10,10,10,0.9)",
      position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32, textDecoration: "none" }}>
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
      {links.map((l) => (
        <a key={l.href} href={l.href} className="nav-link" style={{
          color: "#8a8f98", textDecoration: "none", fontSize: 13,
          padding: "7px 14px", borderRadius: 6, fontWeight: 500,
        }}>
          {l.label}
        </a>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <RefreshButton lastRunAt={latest?.first_collected_at ?? null} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#54585f" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          Live
        </div>
      </div>
    </nav>
  );
}
