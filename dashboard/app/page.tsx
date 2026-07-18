export default function HomePage() {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Chroma</h1>
      <p style={{ color: "#888", marginBottom: 8 }}>
        Trend intelligence across every scene, before it's obvious.
      </p>
      <p style={{ color: "#555", marginBottom: 24, fontSize: 13 }}>
        First deployment: phonk / TikTok
      </p>
      <a href="/videos" style={{
        display: "inline-block", padding: "10px 20px", background: "#6cf",
        color: "#000", borderRadius: 6, textDecoration: "none", fontWeight: 600,
      }}>
        View Trending Videos →
      </a>
    </div>
  );
}
