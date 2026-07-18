"""Aggregate video_metrics into per-entity daily rollups.
Run after update_records.py. Reads today's video_metrics, groups by
creator/sound, and upserts into daily_metrics.
"""
import os
from datetime import date
from collections import defaultdict
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
TODAY = date.today().isoformat()

def rollup(entity_type, group_field):
    videos = sb.table("videos").select(f"id,{group_field}").execute().data
    metrics = sb.table("video_metrics").select("video_id,view_count,like_count") \
        .gte("collected_at", TODAY).execute().data
    by_video = {m["video_id"]: m for m in metrics}

    agg = defaultdict(lambda: {"video_count": 0, "total_views": 0, "total_likes": 0})
    for v in videos:
        entity_id = v.get(group_field)
        if not entity_id or v["id"] not in by_video:
            continue
        m = by_video[v["id"]]
        agg[entity_id]["video_count"] += 1
        agg[entity_id]["total_views"] += m.get("view_count") or 0
        agg[entity_id]["total_likes"] += m.get("like_count") or 0

    for entity_id, stats in agg.items():
        sb.table("daily_metrics").upsert({
            "entity_type": entity_type,
            "entity_id": entity_id,
            "metric_date": TODAY,
            **stats,
        }, on_conflict="entity_type,entity_id,metric_date").execute()

if __name__ == "__main__":
    rollup("creator", "creator_id")
    rollup("sound", "sound_id")
    print(f"Daily rollups computed for {TODAY}")
