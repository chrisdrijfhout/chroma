import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import NavClient from "./NavClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatRelativeTime(iso: string | null) {
  if (!iso) return "No data yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function Nav() {
  const cookieStore = cookies();
  const theme = cookieStore.get("chroma-theme")?.value === "dark" ? "dark" : "light";

  const { data: latestVideo } = await supabase
    .from("videos")
    .select("last_collected_at")
    .order("last_collected_at", { ascending: false })
    .limit(1)
    .single();

  const { data: latestTrigger } = await supabase
    .from("refresh_triggers")
    .select("triggered_at")
    .order("triggered_at", { ascending: false })
    .limit(1)
    .single();

  // Cooldown is based on whichever is more recent: real completed data,
  // or a refresh that was triggered but hasn't finished yet. This makes
  // it correct even on a fresh page load, not just within one browser tab.
  const dataTime = latestVideo?.last_collected_at ? new Date(latestVideo.last_collected_at).getTime() : 0;
  const triggerTime = latestTrigger?.triggered_at ? new Date(latestTrigger.triggered_at).getTime() : 0;
  const effectiveLastRunAt = triggerTime > dataTime
    ? latestTrigger!.triggered_at
    : latestVideo?.last_collected_at ?? null;

  const { data: insight } = await supabase
    .from("insights")
    .select("summary, period_start, period_end")
    .eq("report_type", "weekly")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <NavClient
      lastCollectedText={formatRelativeTime(latestVideo?.last_collected_at ?? null)}
      theme={theme}
      lastRunAt={effectiveLastRunAt}
      insightSummary={insight?.summary ?? null}
      insightPeriod={insight ? `${insight.period_start} → ${insight.period_end}` : null}
    />
  );
}
