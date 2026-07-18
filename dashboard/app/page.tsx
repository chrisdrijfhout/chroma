export default function HomePage() {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Phonk Radar</h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        Trend intelligence for the global phonk scene.
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
