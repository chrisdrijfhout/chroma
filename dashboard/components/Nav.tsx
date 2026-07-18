const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/insights", label: "AI Insights" },
];

export default function Nav() {
  return (
    <nav style={{
      display: "flex", gap: 4, padding: "16px 24px", borderBottom: "1px solid #222",
      background: "#0a0a0a", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ fontWeight: 700, marginRight: 24, color: "#fff", letterSpacing: 0.5 }}>
        PHONK RADAR
      </div>
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
