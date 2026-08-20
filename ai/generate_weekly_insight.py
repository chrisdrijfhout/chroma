import os, json
from datetime import date, timedelta, datetime, timezone
from statistics import median
from supabase import create_client
import anthropic

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

PRODUCER_SIGNALS = ["fl studio", "flstudio", "fruity loops", "ableton", "logic pro",
                     "cubase", "serum", "vst", "reason daw", "studio one"]


def velocity(likes, published_at):
    if not published_at:
        return 0
    posted = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
    hours = max((datetime.now(timezone.utc) - posted).total_seconds() / 3600, 0.5)
    return likes / hours


def gather_latest_batch():
    latest = sb.table("videos").select("last_collected_at").order("last_collected_at", desc=True).limit(1).execute().data
    if not latest:
        return None, []
    anchor = latest[0]["last_collected_at"]

    videos = sb.table("videos").select(
        "caption, video_url, published_at, like_count_snapshot, "
        "creators(tiktok_username), sounds(sound_name, is_original)"
    ).eq("last_collected_at", anchor).execute().data or []

    for v in videos:
        v["_velocity"] = velocity(v.get("like_count_snapshot") or 0, v.get("published_at"))
    return anchor, videos


def find_outliers(videos):
    if len(videos) < 3:
        return []
    velocities = [v["_velocity"] for v in videos]
    m = median(velocities)
    if m == 0:
        return []
    return [v for v in videos if v["_velocity"] > m * 2.5]


def find_producer_signals(videos):
    out = []
    for v in videos:
        text = (v.get("caption") or "").lower()
        hit = next((kw for kw in PRODUCER_SIGNALS if kw in text), None)
        if hit:
            out.append({**v, "_signal": hit})
    return out


def get_previous_report():
    result = sb.table("insights").select("summary").eq("report_type", "weekly").order("created_at", desc=True).limit(1).execute()
    if not result.data:
        return None
    try:
        return json.loads(result.data[0]["summary"])
    except Exception:
        return None


EMPTY = {"headline": "Not enough data yet", "fastest_moving": "Not enough data in the latest batch to report on.",
         "producers": [], "spreading_sounds": [], "recommendation": "",
         "outliers": [], "producer_signals": []}


def generate_report(videos, outliers, producer_signals, previous):
    if not videos:
        return EMPTY

    top_videos = sorted(videos, key=lambda v: v["_velocity"], reverse=True)[:12]
    data = {
        "batch_size": len(videos),
        "top_videos": [{"creator": v.get("creators", {}).get("tiktok_username"), "sound": v.get("sounds", {}).get("sound_name"),
                         "is_original": v.get("sounds", {}).get("is_original"), "likes_per_hour": round(v["_velocity"])} for v in top_videos],
        "outliers": [{"creator": v.get("creators", {}).get("tiktok_username"), "likes_per_hour": round(v["_velocity"]),
                       "caption": (v.get("caption") or "")[:100]} for v in outliers[:6]],
        "producer_signal_videos": [{"creator": v.get("creators", {}).get("tiktok_username"), "signal_keyword": v["_signal"],
                                     "likes_per_hour": round(v["_velocity"])} for v in producer_signals[:6]],
    }
    prev_context = f"\n\nPrevious report headline for comparison: {previous.get('headline')}" if previous else ""

    prompt = f"""You are an A&R analyst reviewing the LATEST single scrape batch from Chroma (a phonk TikTok tracker), not a weekly rollup.

Context:
- "outliers" are videos whose velocity is 2.5x+ the batch median — statistically unusual, worth flagging fast.
- "producer_signal_videos" mention actual production software (FL Studio, Ableton, etc.) in their caption — a strong real signal the poster is genuinely the producer, not just a reposter, since edit accounts almost never mention their DAW.
{prev_context}

Data:
{json.dumps(data, indent=2, default=str)}

Respond with ONLY valid JSON matching:
{{
  "headline": "one sentence on this batch's single biggest signal",
  "fastest_moving": "2-3 sentences on what's accelerating right now",
  "producers": [{{"creator": "username", "note": "why worth a listen"}}],
  "spreading_sounds": [],
  "recommendation": "1-2 sentences, the one actionable thing right now",
  "outliers": [{{"creator": "username", "note": "why this is a statistical outlier worth checking immediately"}}],
  "producer_signals": [{{"creator": "username", "note": "mentions their DAW — likely a genuine producer, not a repost account"}}]
}}
Leave any array empty if genuinely nothing qualifies. Be specific, no filler. Valid JSON only."""

    msg = claude.messages.create(model="claude-haiku-4-5-20251001", max_tokens=1500, messages=[{"role": "user", "content": prompt}])
    raw = "".join(b.text for b in msg.content if b.type == "text").strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].removeprefix("json")
    try:
        parsed = json.loads(raw)
        for k in EMPTY:
            parsed.setdefault(k, EMPTY[k])
        return parsed
    except Exception as e:
        print(f"Parse failed: {e}")
        return {**EMPTY, "headline": "Report error", "fastest_moving": raw[:500]}


def main():
    anchor, videos = gather_latest_batch()
    outliers = find_outliers(videos)
    producer_signals = find_producer_signals(videos)
    previous = get_previous_report()

    report = generate_report(videos, outliers, producer_signals, previous)

    sb.table("insights").insert({
        "report_type": "weekly",
        "period_start": date.today().isoformat(),
        "period_end": date.today().isoformat(),
        "summary": json.dumps(report),
        "full_report": {"batch_anchor": anchor, "batch_size": len(videos)},
    }).execute()
    print(f"Report generated from batch of {len(videos)} videos, {len(outliers)} outliers, {len(producer_signals)} producer signals")


if __name__ == "__main__":
    main()
