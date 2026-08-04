import os, json
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
        "id, caption, video_url, published_at, like_count_snapshot, "
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

    # Sounds by unique creator spread — the real "catching it early" signal
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
    }


def generate_report(data):
    if data["total_videos_tracked"] == 0:
        return "Not enough data collected yet this week to generate a meaningful report. Check back after a few more collection runs."

    prompt = f"""You are an A&R analyst producing a weekly brief for Tribal Music Group, covering the phonk scene on TikTok.

Context on what this data means:
- "likes_per_hour" measures how fast a video is accelerating right now, not just its total size — a smaller video with high likes_per_hour is often a stronger early signal than an older video with more total likes.
- "is_original_sound" / "top_original_unreleased_candidates" are videos using a sound the creator made themselves, filtered to exclude common edit/remix patterns (slowed, sped up, reverb, etc). These are the closest thing to genuinely unreleased, unsigned work — the highest-value scouting targets.
- "top_spreading_sounds" ranks by how many DIFFERENT creators are using a sound, not just view count — a sound spreading across many accounts is an early-movement signal, distinct from one video simply going viral.

Data from the last 7 days:
{json.dumps(data, indent=2, default=str)}

Write a concise, direct weekly brief for a label owner. Structure it as:
1. **Fastest-moving content this week** — 2-3 sentences on what's accelerating, referencing specific creators/sounds by name.
2. **Producers worth a direct listen** — from top_original_unreleased_candidates specifically, name 2-4 concrete creators to check out and why, since these are unreleased/unsigned candidates.
3. **Sounds gaining real spread** — from top_spreading_sounds, flag anything moving across multiple creators, which often precedes a track breaking wider.
4. **One clear recommendation** — the single most actionable thing to do this week based on this data.

Keep it under 400 words. Be specific and concrete — reference actual names and numbers from the data, not generic observations. No filler, no hedging, write like someone who actually looked at the data and has an opinion."""

    msg = claude.messages.create(
        model="claude-sonnet-5",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def main():
    data = gather_week_data()
    report = generate_report(data)

    sb.table("insights").insert({
        "report_type": "weekly",
        "period_start": (date.today() - timedelta(days=7)).isoformat(),
        "period_end": date.today().isoformat(),
        "summary": report,
        "full_report": data,
    }).execute()
    print("Weekly insight generated")
    print(f"Based on {data['total_videos_tracked']} videos tracked this week")


if __name__ == "__main__":
    main()
