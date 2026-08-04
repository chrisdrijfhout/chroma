export default function MinimalNav() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", padding: "14px 16px",
      borderBottom: "1px solid var(--border)", background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0,
          boxShadow: "0 0 16px rgba(139,124,246,0.25)",
        }}>
          C
        </div>
        <span style={{
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 700, letterSpacing: 0.5, fontSize: 15,
          background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          CHROMA
        </span>
      </div>
    </nav>
  );
}
