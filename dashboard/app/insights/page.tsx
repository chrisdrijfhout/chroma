export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabaseClient";

export default async function InsightsPage() {
  const { data: latest, error } = await supabase
    .from("insights")
    .select("*")
    .eq("report_type", "weekly")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div style={{ padding: "32px 24px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>AI Insights</h1>
        <p style={{ color: "#8a8f98", fontSize: 13 }}>Weekly executive read on what moved in the scene</p>
      </div>

      {error && (
        <pre style={{ color: "#f87171", background: "#1a1010", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid #3a1f1f", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {latest ? (
        <div style={{ background: "#111214", border: "1px solid #222427", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: "#54585f", marginBottom: 16 }}>
            {latest.period_start} → {latest.period_end}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#dcdde0", whiteSpace: "pre-wrap" }}>
            {latest.summary}
          </div>
        </div>
      ) : (
        <div style={{
          background: "#111214", border: "1px dashed #2a2d31", borderRadius: 12,
          padding: 40, textAlign: "center", color: "#54585f",
        }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>No report generated yet</div>
          <div style={{ fontSize: 12 }}>Runs automatically once a week, once there&apos;s enough trend history to summarize.</div>
        </div>
      )}
    </div>
  );
}
