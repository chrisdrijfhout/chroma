import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SafeImage from "@/components/SafeImage";
import PitchButton from "@/components/PitchButton";
import MarkDealButton from "@/components/MarkDealButton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function looksLikeMarketingRepost(caption: string | null) {
  return (caption ?? "").toLowerCase().includes("slowed");
}

function formatPostedAt(iso: string | null) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return "unknown";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function velocityScore(likes: number, publishedAt: string | null) {
  if (!publishedAt) return 0;
  const hoursSincePosted = Math.max((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60), 0.5);
  return likes / hoursSincePosted;
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { range?: string; only?: string; hideReposts?: string; unreleased?: string; q?: string };
}) {
  const range = ["week", "all"].includes(searchParams?.range ?? "") ? searchParams.range : "latest";
  const originalOnly = searchParams?.only === "producers";
  const hideReposts = searchParams?.hideReposts === "1";
  const unreleasedOnly = searchParams?.unreleased === "1";
  const q = (searchParams?.q ?? "").toLowerCase().trim();

  let videos: any[] = [];
  let error: any = null;

  const videoSelect = `
    id, caption, video_url, published_at, thumbnail_url, like_count_snapshot, last_collected_at,
    creators ( tiktok_username ),
    sounds ( sound_name, is_original )
  `;

  const { data: latestRow } = await supabase
    .from("videos")
    .select("last_collected_at")
    .order("last_collected_at", { ascending: false })
    .limit(1)
    .single();

  const anchor = latestRow?.last_collected_at ? new Date(latestRow.last_collected_at) : null;

  if (range === "all") {
    // No date filter at all — every video ever collected, capped at a
    // generous pull limit for query performance, then narrowed to a
    // top-N for display after scoring/sorting below.
    const result = await supabase.from("videos").select(videoSelect).limit(1000);
    videos = result.data ?? [];
    error = result.error;
  } else if (anchor) {
    if (range === "week") {
      const sevenDaysBeforeAnchor = new Date(anchor.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = await supabase.from("videos").select(videoSelect).gte("last_collected_at", sevenDaysBeforeAnchor).limit(300);
      videos = result.data ?? [];
      error = result.error;
    } else {
      // All videos from one run now share the exact same timestamp
      // (see update_records.py's RUN_TIMESTAMP), so an exact match finds
      // precisely the latest scrape — no wide buffer that could merge in
      // a previous run's data.
      const result = await supabase.from("videos").select(videoSelect).eq("last_collected_at", latestRow?.last_collected_at).limit(300);
      videos = result.data ?? [];
      error = result.error;
    }
  }

  if (hideReposts) {
    videos = videos.filter((v: any) => !looksLikeMarketingRepost(v.caption));
  }
  if (originalOnly) {
    videos = videos.filter((v: any) => v.sounds?.is_original === true);
  }
  if (unreleasedOnly) {
    videos = videos.filter((v: any) => (v.caption ?? "").toLowerCase().includes("unreleased"));
  }
  if (q) {
    videos = videos.filter((v: any) =>
      (v.caption ?? "").toLowerCase().includes(q) ||
      (v.creators?.tiktok_username ?? "").toLowerCase().includes(q) ||
      (v.sounds?.sound_name ?? "").toLowerCase().includes(q)
    );
  }

  videos = videos
    .map((v: any) => ({ ...v, _velocity: velocityScore(v.like_count_snapshot ?? 0, v.published_at) }))
    .sort((a: any, b: any) => b._velocity - a._velocity);

  if (range === "all") {
    videos = videos.slice(0, 50);
  }

  const collectionTimes = videos.map((v: any) => v.last_collected_at).filter(Boolean).sort();
  const oldestCollected = collectionTimes[0] ?? null;
  const newestCollected = collectionTimes[collectionTimes.length - 1] ?? null;

  const tabStyle = (active: boolean) => ({
    padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
    textDecoration: "none", cursor: "pointer",
    background: active ? "var(--accent)" : "var(--card)",
    color: active ? "#fff" : "var(--text-dim)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
  });

  const currentToggles = () => ({
    range,
    ...(originalOnly ? { only: "producers" } : {}),
    ...(hideReposts ? { hideReposts: "1" } : {}),
    ...(unreleasedOnly ? { unreleased: "1" } : {}),
  });

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ ...currentToggles(), ...params });
    return `/videos?${sp.toString()}`;
  };

  const toggleHideReposts = () => {
    const sp = new URLSearchParams(currentToggles());
    if (hideReposts) sp.delete("hideReposts"); else sp.set("hideReposts", "1");
    return `/videos?${sp.toString()}`;
  };

  const toggleOriginalOnly = () => {
    const sp = new URLSearchParams(currentToggles());
    if (originalOnly) sp.delete("only"); else sp.set("only", "producers");
    return `/videos?${sp.toString()}`;
  };

  const toggleUnreleasedOnly = () => {
    const sp = new URLSearchParams(currentToggles());
    if (unreleasedOnly) sp.delete("unreleased"); else sp.set("unreleased", "1");
    return `/videos?${sp.toString()}`;
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4, color: "var(--text)", fontWeight: 700 }}>Trending Videos</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 4 }}>
            {range === "all"
              ? `Top ${videos.length} of all time, ranked by likes-per-hour since posting`
              : `${videos.length} video${videos.length !== 1 ? "s" : ""}, ranked by likes-per-hour since posting`}
          </p>
          {oldestCollected && newestCollected && (
            <p style={{ color: "var(--text-faint)", fontSize: 11 }}>
              {oldestCollected === newestCollected
                ? `Stats collected ${formatRelativeTime(newestCollected)}`
                : `Stats collected between ${formatRelativeTime(oldestCollected)} and ${formatRelativeTime(newestCollected)}`}
            </p>
          )}
        </div>
        <form style={{ display: "flex" }}>
          <input type="hidden" name="range" value={range} />
          <input
            name="q" defaultValue={q} placeholder="Search creator, sound, caption…"
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", width: 200 }}
          />
        </form>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={buildUrl({ range: "latest" })} style={tabStyle(range === "latest")}>Just In</Link>
          <Link href={buildUrl({ range: "week" })} style={tabStyle(range === "week")}>This Week</Link>
          <Link href={buildUrl({ range: "all" })} style={tabStyle(range === "all")}>All Time</Link>
          <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
          <Link href={toggleOriginalOnly()} style={tabStyle(originalOnly)}>🎹 Original Audio</Link>
          <Link href={toggleHideReposts()} style={tabStyle(hideReposts)}>🚫 Hide Reposts</Link>
          <Link href={toggleUnreleasedOnly()} style={tabStyle(unreleasedOnly)}>🆕 Unreleased Only</Link>
        </div>
      </div>

      {error && (
        <pre style={{ color: "var(--danger)", background: "var(--card)", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", border: "1px solid var(--danger)", fontSize: 12 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
        {videos.map((v: any, i: number) => (
          <a
            key={v.id}
            href={v.video_url}
            target="_blank"
            className="card-hover"
            style={{
              display: "block", background: "var(--card)", borderRadius: 12, overflow: "hidden",
              textDecoration: "none", color: "var(--text)", border: "1px solid var(--border)",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "9/16", background: "#000" }}>
              <SafeImage src={v.thumbnail_url} alt={v.caption ?? ""} />
              <div style={{ position: "absolute", top: 8, left: 8, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 11, borderRadius: 5, padding: "3px 7px" }}>
                #{i + 1}
              </div>
              <div style={{ position: "absolute", top: 8, right: 8, background: "linear-gradient(135deg, #ff6b6b, #ffa94d)", color: "#0a0a0a", fontWeight: 700, fontSize: 10, borderRadius: 5, padding: "3px 6px" }}>
                🔥 {v._velocity.toFixed(0)}/hr
              </div>
              {v.sounds?.is_original && (
                <div style={{ position: "absolute", top: 30, right: 8, background: "var(--spectrum-1)", color: "#fff", fontWeight: 700, fontSize: 9, borderRadius: 5, padding: "2px 6px" }}>
                  ORIGINAL
                </div>
              )}
              <PitchButton />
              <MarkDealButton videoId={v.id} creatorHandle={`@${v.creators?.tiktok_username ?? "unknown"}`} videoUrl={v.video_url} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 10px 10px", background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>@{v.creators?.tiktok_username ?? "unknown"}</div>
              </div>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.sounds?.sound_name ?? "—"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 6 }}>Posted {formatPostedAt(v.published_at)}</div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>❤ {v.like_count_snapshot?.toLocaleString() ?? "—"}</div>
            </div>
          </a>
        ))}
      </div>

      {videos.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
          No videos match this combination of filters yet.
        </div>
      )}
    </div>
  );
}
