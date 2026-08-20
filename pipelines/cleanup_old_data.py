import os
from datetime import datetime, timedelta, timezone
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
BUCKET = "thumbnails"

# Videos older than this get deleted entirely — including their stored
# thumbnail image, since images are what actually eats storage quota,
# not the small text rows. Deals are NEVER touched by this script,
# regardless of age — that's real business data, not scraped trend data.
DAYS_TO_KEEP = 30


def main():
    cutoff = (datetime.now(timezone.utc) - timedelta(days=DAYS_TO_KEEP)).isoformat()

    # Find old videos, but skip any that are linked to a deal — keep
    # those forever regardless of age, since that's a real record.
    old_videos = sb.table("videos").select("id, tiktok_video_id").lt("last_collected_at", cutoff).execute().data or []
    deal_video_ids = {d["video_id"] for d in sb.table("deals").select("video_id").execute().data or [] if d["video_id"]}

    deletable = [v for v in old_videos if v["id"] not in deal_video_ids]
    print(f"Found {len(old_videos)} videos older than {DAYS_TO_KEEP} days, {len(deletable)} eligible for deletion (excluding those linked to deals)")

    deleted_thumbnails = 0
    for v in deletable:
        try:
            import hashlib
            filename = f"{hashlib.md5(str(v['tiktok_video_id']).encode()).hexdigest()}.jpg"
            sb.storage.from_(BUCKET).remove([filename])
            deleted_thumbnails += 1
        except Exception:
            pass  # thumbnail may not exist — not an error worth stopping for

    video_ids = [v["id"] for v in deletable]
    if video_ids:
        sb.table("video_metrics").delete().in_("video_id", video_ids).execute()
        sb.table("videos").delete().in_("id", video_ids).execute()

    print(f"Deleted {len(deletable)} videos, {deleted_thumbnails} thumbnails removed from storage")


if __name__ == "__main__":
    main()
