import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalize(name: string) {
  return name.toLowerCase().trim();
}

export default async function CatalogPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tracks, error } = await supabase
    .from("label_playlist_tracks")
    .select("*");

  const { data: history } = await supabase
    .from("label_track_popularity_history")
    .select("spotify_track_id, popularity, snapshot_date")
    .order("snapshot_date", { ascending: true });

  // Earliest available snapshot per track within the lookback window —
  // used as the "before" point to measure change against.
  const earliestByTrack: Record<string, number> = {};
  (history ?? []).forEach((h: any) => {
    if (!(h.spotify_track_id in earliestByTrack) && h.popularity != null) {
      earliestByTrack[h.spotify_track_id] = h.popularity;
    }
  });

  // Real TikTok usage: count videos in the last 7 days whose sound name
  // or the video's own caption/creator mentions this track's artist(s).
  const { data: recentVideos } = await supabase
    .from("videos")
    .select("caption, last_collected_at, creators(tiktok_username), sounds(sound_name, original_artist)")
    .gte("last_collected_at", sevenDaysAgo);

  const enriched = (tracks ?? []).map((t: any) => {
    const artistList = (t.artist_names ?? "").split(",").map((a: string) => normalize(a));
    const tiktokUses = (recentVideos ?? []).filter((v: any) => {
      const soundName = normalize(v.sounds?.sound_name ?? "");
      const soundArtist = normalize(v.sounds?.original_artist ?? "");
      const creator = normalize(v.creators?.tiktok_username ?? "");
      return artistList.some((a: string) => a && (soundName.includes(a) || soundArtist.includes(a) || creator.includes(a)));
    }).length;

    const earlier = earliestByTrack[t.spotify_track_id];
    const delta = earlier != null && t.popularity != null ? t.popularity - earlier : null;

    return { ...t, tiktokUses, popularityDelta: delta };
  });

  const ranked = enriched.sort((a: any, b: any) => {
    if (b.tiktokUses !== a.tiktokUses) return b.tiktokUses - a.tiktokUses;
    return (b.popularityDelta ?? 0) - (a.popularityDelta ?? 0);
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, color: "var(--text)", fontWeight: 700 }}>Label Catalog</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Ranked by TikTok usage this week, then Spotify popularity trend
        </p>
      </div>

      {error && (
        <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid var(--danger)", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranked.map((t: any, i: number) => (
          <a
            key={t.id}
            href={t.spotify_url}
            target="_blank"
            className="card-hover"
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
              background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
              textDecoration: "none", color: "var(--text)",
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 5, background: "var(--bg-elevated)", color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.track_name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.artist_names}
              </div>
            </div>

            <div style={{ textAlign: "center", flexShrink: 0, minWidth: 70 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tiktokUses > 0 ? "var(--accent)" : "var(--text-faint)" }}>
                {t.tiktokUses > 0 ? `🔥 ${t.tiktokUses}` : "—"}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase" }}>TikTok uses</div>
            </div>

            <div style={{ textAlign: "center", flexShrink: 0, minWidth: 80 }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: t.popularityDelta == null ? "var(--text-faint)"
                  : t.popularityDelta > 0 ? "var(--success)"
                  : t.popularityDelta < 0 ? "var(--danger)"
                  : "var(--text-dim)",
              }}>
                {t.popularity ?? "—"}
                {t.popularityDelta != null && t.popularityDelta !== 0 && (
                  <span> {t.popularityDelta > 0 ? "↑" : "↓"}{Math.abs(t.popularityDelta)}</span>
                )}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-faint)", textTransform: "uppercase" }}>Popularity</div>
            </div>
          </a>
        ))}
      </div>

      {ranked.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
          No catalog data yet — run the Spotify fetch first.
        </div>
      )}

      {ranked.length > 0 && Object.keys(earliestByTrack).length === 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
          Popularity trend will appear once stats have been collected on at least two different days.
        </div>
      )}
    </div>
  );
}
