import os, json
from collections import defaultdict
from datetime import date, timedelta, datetime, timezone
from supabase import create_client
import anthropic

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SEVEN_DAYS_AGO = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
EDIT_KEYWORDS = ["slowed", "sped up", "spdup", "sped-up", "speedup", "reverb", "nightcore", "speed up"]


def velocity(likes, published_at):
    if not published_at:
        return 0
    try:
        posted = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
    except Exception:
        return 0
    hours = max((datetime.now(timezone.utc) - posted).total_seconds() / 3600, 0.5)
    return likes / hours


def looks_like_edit(sound_name):
    text = (sound_name or "").lower()
    return any(kw in text for kw in EDIT_KEYWORDS)


def gather_week_data():
    videos = sb.table("videos").select(
        "id, caption, video_url, published_at, like_count_snapshot, last_collected_at, "
        "creators(tiktok_username), sounds(sound_name, is_original, original_artist)"
    ).gte("last_collected_at", SEVEN_DAYS_AGO).limit(300).execute().data or []

    for v in videos:
        v["_velocity"] = velocity(v.get("like_count_snapshot") or 0, v.get("published_at"))

    top_videos = sorted(videos, key=lambda v: v["_velocity"], reverse=True)[:12]

    original_videos = [
        v for v in videos
        if v.get("sounds", {}) and v["sounds"].get("is_original")
        and not looks_like_edit(v["sounds"].get("sound_name"))
    ]
    top_original = sorted(original_videos, key=lambda v: v["_velocity"], reverse=True)[:8]

    sound_map = {}
    for v in videos:
        s = v.get("sounds")
        if not s or not s.get("sound_name"):
            continue
        key = s["sound_name"]
        creator = (v.get("creators") or {}).get("tiktok_username")
        if key not in sound_map:
            sound_map[key] = {
                "sound_name": key,
                "is_original": s.get("is_original", False),
                "original_artist": s.get("original_artist"),
                "creators": set(),
                "video_count": 0,
            }
        sound_map[key]["video_count"] += 1
        if creator:
            sound_map[key]["creators"].add(creator)

    top_sounds = sorted(
        [{**s, "unique_creators": len(s["creators"])} for s in sound_map.values()],
        key=lambda s: s["unique_creators"], reverse=True
    )[:10]
    for s in top_sounds:
        del s["creators"]

    # Per-day breakdown, based on when each video was actually collected —
    # lets the model spot a standout day within the week, not just the
    # week as a whole.
    by_day = defaultdict(lambda: {"video_count": 0, "max_velocity": 0, "max_velocity_creator": None})
    for v in videos:
        collected = v.get("last_collected_at")
        if not collected:
            continue
        day_key = collected[:10]  # YYYY-MM-DD
        by_day[day_key]["video_count"] += 1
        if v["_velocity"] > by_day[day_key]["max_velocity"]:
            by_day[day_key]["max_velocity"] = round(v["_velocity"])
            by_day[day_key]["max_velocity_creator"] = (v.get("creators") or {}).get("tiktok_username")

    daily_breakdown = [
        {"date": d, **stats} for d, stats in sorted(by_day.items())
    ]

    return {
        "total_videos_tracked": len(videos),
        "top_videos_by_velocity": [
            {
                "creator": (v.get("creators") or {}).get("tiktok_username"),
                "sound": (v.get("sounds") or {}).get("sound_name"),
                "is_original_sound": (v.get("sounds") or {}).get("is_original", False),
                "likes": v.get("like_count_snapshot"),
                "likes_per_hour": round(v["_velocity"]),
                "url": v.get("video_url"),
            }
            for v in top_videos
        ],
        "top_original_unreleased_candidates": [
            {
                "creator": (v.get("creators") or {}).get("tiktok_username"),
                "sound": (v.get("sounds") or {}).get("sound_name"),
                "likes_per_hour": round(v["_velocity"]),
                "url": v.get("video_url"),
            }
            for v in top_original
        ],
        "top_spreading_sounds": top_sounds,
        "daily_breakdown": daily_breakdown,
    }


def get_previous_week_summary():
    """Pull last week's stored report (if any) so this week's report can
    reference whether things are heating up, cooling down, or steady."""
    cutoff = (date.today() - timedelta(days=8)).isoformat()
    result = sb.table("insights").select("summary, period_start, period_end") \
        .eq("report_type", "weekly") \
        .lt("period_end", date.today().isoformat()) \
        .order("period_end", desc=True).limit(1).execute()
    rows = result.data or []
    if not rows:
        return None
    try:
        parsed = json.loads(rows[0]["summary"])
        return {
            "period": f"{rows[0]['period_start']} to {rows[0]['period_end']}",
            "headline": parsed.get("headline"),
            "top_producers_last_week": [p.get("creator") for p in parsed.get("producers", [])],
        }
    except Exception:
        return None


EMPTY_REPORT = {
    "headline": "Not enough data yet",
    "fastest_moving": "Not enough data collected yet this week to generate a meaningful report. Check back after a few more collection runs.",
    "producers": [],
    "spreading_sounds": [],
    "recommendation": "",
    "week_comparison": "",
    "standout_day": "",
}


def generate_report(data, previous_week):
    if data["total_videos_tracked"] == 0:
        return EMPTY_REPORT

    prev_context = (
        f"\n\nLast week's report for comparison:\n{json.dumps(previous_week, indent=2)}"
        if previous_week else
        "\n\nNo prior week's report exists yet — this is the first one, so skip week-over-week comparison."
    )

    prompt = f"""You are an A&R analyst producing a weekly brief for Tribal Music Group, covering the phonk scene on TikTok.

Context on what this data means:
- "likes_per_hour" measures how fast a video is accelerating right now — a smaller video with high likes_per_hour is often a stronger early signal than an older video with more total likes.
- "top_original_unreleased_candidates" are videos using a sound the creator made themselves, filtered to exclude common edit/remix patterns. These are the closest thing to genuinely unreleased, unsigned work.
- "top_spreading_sounds" ranks by how many DIFFERENT creators are using a sound — a sound spreading across many accounts is an early-movement signal.
- "daily_breakdown" shows per-day activity within this week — use it to spot if one specific day had unusually high velocity or volume compared to the rest of the week.

This week's data:
{json.dumps(data, indent=2, default=str)}
{prev_context}

Respond with ONLY valid JSON (no markdown, no code fences, no commentary outside the JSON) matching exactly this shape:

{{
  "headline": "one short punchy sentence summarizing the week's single biggest signal",
  "fastest_moving": "2-4 sentences on what's accelerating this week, naming specific creators/sounds and numbers",
  "producers": [
    {{"creator": "username", "note": "1-2 sentences on why they're worth a direct listen"}}
  ],
  "spreading_sounds": [
    {{"sound": "sound name", "note": "1 sentence on the spread signal, e.g. creator count"}}
  ],
  "recommendation": "1-3 sentences — the single most actionable thing to do this week",
  "week_comparison": "1-2 sentences comparing this week to last week's report — busier, quieter, same names resurfacing, or a genuinely new signal. Leave as an empty string if no prior week exists to compare against.",
  "standout_day": "1 sentence flagging a specific day from daily_breakdown if one clearly stood out (e.g. unusually high peak velocity or video count that day), naming the date and why. Leave as an empty string if no single day clearly stood out from the rest."
}}

Include 2-4 items in "producers" and up to 4 in "spreading_sounds", only the genuinely notable ones. Be specific and concrete, reference actual names, numbers, and dates. Don't force a week_comparison or standout_day if there's nothing genuinely notable to say — empty string is a valid, honest answer. No filler, no hedging. Valid JSON only."""

    msg = claude.messages.create(
        model="claude-sonnet-5",
        max_tokens=1400,
        messages=[{"role": "user", "content": prompt}],
    )
    # Find the actual text block rather than assuming content[0] — the
    # response can include a thinking block before the text block.
    text_blocks = [b.text for b in msg.content if b.type == "text"]
    raw = "".join(text_blocks).strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        parsed = json.loads(raw)
        for key in EMPTY_REPORT:
            parsed.setdefault(key, EMPTY_REPORT[key])
        return parsed
    except Exception as e:
        print(f"Failed to parse model output as JSON: {e}")
        return {**EMPTY_REPORT, "headline": "Report generation error", "fastest_moving": raw[:1000]}


def main():
    data = gather_week_data()
    previous_week = get_previous_week_summary()
    report = generate_report(data, previous_week)

    sb.table("insights").insert({
        "report_type": "weekly",
        "period_start": (date.today() - timedelta(days=7)).isoformat(),
        "period_end": date.today().isoformat(),
        "summary": json.dumps(report),
        "full_report": data,
    }).execute()
    print("Weekly insight generated")
    print(f"Based on {data['total_videos_tracked']} videos tracked this week")
    print(f"Previous week found for comparison: {previous_week is not None}")


if __name__ == "__main__":
    main()
