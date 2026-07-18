"""Compute trend scores for videos, creators, sounds.
Formulas documented in ARCHITECTURE.md — kept simple and auditable,
components stored in trend_scores.components for debugging.
"""
import os
from datetime import date
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
TODAY = date.today().isoformat()

def normalize(values):
    if not values:
        return {}
    lo, hi = min(values.values()), max(values.values())
    span = (hi - lo) or 1
    return {k: (v - lo) / span for k, v in values.items()}

def score_videos():
    videos = sb.table("videos").select("id,published_at").execute().data
    raw = {}
    for v in videos:
        metrics = sb.table("video_metrics").select("view_count,like_count,comment_count,share_count,collected_at") \
            .eq("video_id", v["id"]).order("collected_at", desc=True).limit(2).execute().data
        if not metrics:
            continue
        latest = metrics[0]
        prev = metrics[1] if len(metrics) > 1 else latest
        growth = (latest["view_count"] - prev["view_count"]) / max(prev["view_count"], 1)
        engagement = (latest["like_count"] + latest["comment_count"] * 2 + latest["share_count"] * 3) / max(latest["view_count"], 1)
        raw[v["id"]] = {"growth": growth, "engagement": engagement}

    growth_n = normalize({k: r["growth"] for k, r in raw.items()})
    eng_n = normalize({k: r["engagement"] for k, r in raw.items()})

    for vid_id in raw:
        score = (0.5 * growth_n.get(vid_id, 0) + 0.3 * eng_n.get(vid_id, 0) + 0.2 * 0.5) * 100
        sb.table("trend_scores").upsert({
            "entity_type": "video", "entity_id": vid_id, "score_date": TODAY,
            "score": score, "score_version": "v1",
            "components": {"growth": raw[vid_id]["growth"], "engagement": raw[vid_id]["engagement"]},
        }, on_conflict="entity_type,entity_id,score_date,score_version").execute()

if __name__ == "__main__":
    score_videos()
    # creator/sound scoring follows the same normalize-and-upsert pattern
    # against daily_metrics — extend here as the dataset grows.
    print(f"Trend scores computed for {TODAY}")
