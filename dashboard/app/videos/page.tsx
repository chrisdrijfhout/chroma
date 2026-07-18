import { supabase } from "@/lib/supabaseClient";

export default async function VideosPage() {
  const { data: videos, error } = await supabase
    .from("videos")
    .select(`
      id, caption, video_url, published_at,
      creators ( tiktok_username ),
      sounds ( sound_name ),
      video_metrics ( view_count, like_count, comment_count, share_count, collected_at )
    `)
    .order("published_at", { ascending: false });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16, color: "#fff" }}>Trending Videos</h1>

      {error && (
        <pre style={{ color: "#f66", background: "#200", padding: 12, borderRadius: 6, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333", color: "#888" }}>
            <th style={{ padding: 8 }}>Creator</th>
            <th style={{ padding: 8 }}>Sound</th>
            <th style={{ padding: 8 }}>Caption</th>
            <th style={{ padding: 8 }}>Views</th>
            <th style={{ padding: 8 }}>Likes</th>
            <th style={{ padding: 8 }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {videos?.map((v: any) => {
            const latest = v.video_metrics?.[v.video_metrics.length - 1];
            return (
              <tr key={v.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: 8 }}>{v.creators?.tiktok_username ?? "—"}</td>
                <td style={{ padding: 8 }}>{v.sounds?.sound_name ?? "—"}</td>
                <td style={{ padding: 8 }}>{v.caption}</td>
                <td style={{ padding: 8 }}>{latest?.view_count?.toLocaleString() ?? "—"}</td>
                <td style={{ padding: 8 }}>{latest?.like_count?.toLocaleString() ?? "—"}</td>
                <td style={{ padding: 8 }}>
                  <a href={v.video_url} target="_blank" style={{ color: "#6cf" }}>open</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(!videos || videos.length === 0) && !error && (
        <p style={{ marginTop: 16, color: "#666" }}>No videos yet.</p>
      )}
    </div>
  );
}
