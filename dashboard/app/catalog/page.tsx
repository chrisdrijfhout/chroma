import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalize(name: string) {
  return name.toLowerCase().trim();
}

export default async function CatalogPage() {
  const { data: tracks, error } = await supabase
    .from("label_playlist_tracks")
    .select("*")
    .order("added_to_playlist_at", { ascending: false });

  const { data: tiktokCreators } = await supabase
    .from("creators")
    .select("tiktok_username");

  const tiktokNames = new Set(
    (tiktokCreators ?? []).map((c: any) => normalize(c.tiktok_username ?? ""))
  );

  const enriched = (tracks ?? []).map((t: any) => {
    const artistList = (t.artist_names ?? "").split(",").map((a: string) => a.trim());
    const overlap = artistList.some((a: string) => tiktokNames.has(normalize(a)));
    return { ...t, overlap };
  });

  const overlapCount = enriched.filter((t) => t.overlap).length;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4, color: "var(--text)", fontWeight: 700 }}>Label Catalog</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          {enriched.length} tracks from the label&apos;s Spotify playlist
          {overlapCount > 0 && (
            <span style={{ color: "var(--accent)", fontWeight: 600 }}> · {overlapCount} also appearing in TikTok trend data</span>
          )}
        </p>
      </div>

      {error && (
        <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid var(--danger)", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {enriched.map((t: any) => (
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.track_name}
                </div>
                {t.overlap && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "var(--accent)", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                    ALSO ON TIKTOK
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{t.artist_names}</div>
            </div>
          </a>
        ))}
      </div>

      {enriched.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
          No catalog data yet — run the Spotify fetch first.
        </div>
      )}
    </div>
  );
}
