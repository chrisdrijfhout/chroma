import { supabase } from "@/lib/supabaseClient";
import AddDealButton from "@/components/AddDealButton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DealsPage() {
  const { data: deals, error } = await supabase.from("deals").select("*").order("updated_at", { ascending: false });
  const statusColor = (s: string) => s === "Signed" ? "var(--success)" : s === "Passed" ? "var(--danger)" : "var(--accent)";

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, fontWeight: 700 }}>Deals</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 16 }}>{deals?.length ?? 0} deal{(deals?.length ?? 0) !== 1 ? "s" : ""} tracked</p>
      </div>

      <AddDealButton />

      {error && <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, fontSize: 12 }}>{JSON.stringify(error, null, 2)}</pre>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(deals ?? []).map((d: any) => (
          <div key={d.id} className="card-hover" style={{ padding: 18, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{d.artist_name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{d.tiktok_handle} {d.instagram_handle && `· ${d.instagram_handle}`}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: statusColor(d.status), borderRadius: 12, padding: "4px 10px", whiteSpace: "nowrap" }}>{d.status}</span>
            </div>
            {d.next_step && <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10, fontStyle: "italic" }}>Next: {d.next_step}</div>}
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-faint)", marginBottom: 12 }}>
              {d.tiktok_views_override && <span>👁 {d.tiktok_views_override}</span>}
              {d.spotify_monthly_listeners && <span>🎧 {d.spotify_monthly_listeners}</span>}
              {d.email && <span>✉️ {d.email}</span>}
            </div>
            <a href={`/api/export-deal-pdf?id=${d.id}`} target="_blank" style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#fff", background: "linear-gradient(90deg,var(--spectrum-2),var(--spectrum-3))", padding: "7px 14px", borderRadius: 6, textDecoration: "none" }}>📄 Export PDF</a>
          </div>
        ))}
      </div>
      {(!deals || deals.length === 0) && !error && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>No deals yet — use 🤝 on a video, or add one manually above.</div>}
    </div>
  );
}
