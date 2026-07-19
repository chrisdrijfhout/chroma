const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/insights", label: "AI Insights" },
];

// Client name shown next to the Chroma logo — change per deployment/label.
const CLIENT_NAME = "Tribal Music Group";

export default function Nav() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 4, padding: "16px 24px", borderBottom: "1px solid #222",
      background: "#0a0a0a", position: "sticky", top: 0, zIndex: 10,
    }}>
      <a href="/" style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 24, textDecoration: "none" }}>
        <span style={{ fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>CHROMA</span>
        <span style={{ fontSize: 12, color: "#555" }}>× {CLIENT_NAME}</span>
      </a>
      {links.map((l) => (
        <a key={l.href} href={l.href} style={{
          color: "#aaa", textDecoration: "none", fontSize: 14,
          padding: "6px 12px", borderRadius: 6,
        }}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
