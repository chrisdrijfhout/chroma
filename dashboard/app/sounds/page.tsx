export const dynamic = 'force-dynamic';
import { supabase } from "@/lib/supabaseClient";

export default async function SoundsPage() {
  const { data: sounds, error } = await supabase
    .from("sounds")
    .select(`
      id, sound_name, original_artist,
      videos ( id, like_count_snapshot, creator_id )
    `);

  const ranked = (sounds ?? [])
    .map((s: any) => {
      const videoCount = s.videos?.length ?? 0;
      const totalLikes = (s.videos ?? []).reduce((sum: number, v: any) => sum + (v.like_count_snapshot ?? 0), 0);
      const uniqueCreators = new Set((s.videos ?? []).map((v: any) => v.creator_id)).size;
      return { ...s, videoCount, totalLikes, uniqueCreators };
    })
    .filter((s: any) => s.videoCount > 0)
    .sort((a: any, b: any) => b.videoCount - a.videoCount)
    .slice(0, 20);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, color: "#fff", fontWeight: 700 }}>Sounds</h1>
        <p style={{ color: "#8a8f98", fontSize: 13 }}>Ranked by how many creators picked it up — the real early signal</p>
      </div>

      {error && (
        <pre style={{ color: "#f87171", background: "#1a1010", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid #3a1f1f", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranked.map((s: any, i: number) => (
          <div
            key={s.id}
            className="card-hover"
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
              background: "#111214", border: "1px solid #222427", borderRadius: 10,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: "#1a1c1f", color: "#5ac8fa",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.sound_name || "Untitled sound"}
              </div>
              <div style={{ fontSize: 12, color: "#8a8f98" }}>
                {s.original_artist || "Unattributed"} · {s.uniqueCreators} unique creator{s.uniqueCreators !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, color: "#5ac8fa", fontWeight: 700 }}>{s.videoCount} videos</div>
              <div style={{ fontSize: 11, color: "#54585f" }}>{s.totalLikes.toLocaleString()} likes</div>
            </div>
          </div>
        ))}
      </div>

      {ranked.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#54585f" }}>
          No sound data yet — run the pipeline first.
        </div>
      )}
    </div>
  );
}
