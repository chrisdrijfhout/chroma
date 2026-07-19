const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/insights", label: "AI Insights" },
];

const CLIENT_NAME = "Tribal Music Group";

export default function Nav() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 4, padding: "16px 24px",
      borderBottom: "1px solid #1c1e21", background: "#0a0a0a",
      position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 28, textDecoration: "none" }}>
        <span style={{ fontWeight: 700, color: "#fff", letterSpacing: 1, fontSize: 15 }}>CHROMA</span>
        <span style={{ fontSize: 11, color: "#54585f" }}>× {CLIENT_NAME}</span>
      </a>
      {links.map((l) => (
        <a key={l.href} href={l.href} className="nav-link" style={{
          color: "#8a8f98", textDecoration: "none", fontSize: 13,
          padding: "7px 14px", borderRadius: 6, fontWeight: 500,
        }}>
          {l.label}
        </a>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#54585f" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        Live
      </div>
    </nav>
  );
}
