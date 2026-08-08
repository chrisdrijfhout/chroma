import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center",
    }}>
      <h1 style={{
        fontSize: 40, margin: "0 0 12px 0", fontWeight: 700, letterSpacing: -1,
        background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>
        Chroma
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 32, fontSize: 15, maxWidth: 440 }}>
        Trend intelligence for scenes the big platforms track too late.
        We index the sound, not just the artist — before it has a name.
      </p>
      <Link href="/videos" style={{
        display: "inline-block", padding: "14px 32px",
        background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
        color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15,
        fontFamily: "var(--font-display), sans-serif",
        boxShadow: "0 4px 16px -4px rgba(139,124,246,0.4)",
      }}>
        View Trending Now →
      </Link>
    </div>
  );
}
