import os, json, hashlib
import requests
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
BUCKET = "thumbnails"

def get(d, *keys, default=None):
    for k in keys:
        if isinstance(d, dict) and k in d and d[k] is not None:
            return d[k]
    return default

def upsert_creator(item):
    author = get(item, "authorMeta", "author", default={}) or {}
    username = get(author, "name", "uniqueId", "username") or get(item, "authorName", "webVideoUrl")
    row = {
        "tiktok_username": username or "unknown",
        "tiktok_user_id": get(author, "id", "userId"),
        "follower_count": get(author, "fans", "followerCount"),
    }
    res = sb.table("creators").upsert(row, on_conflict="tiktok_username").execute()
    return res.data[0]["id"]

def upsert_sound(item):
    music = get(item, "musicMeta", "music", default={}) or {}
    music_id = get(music, "musicId", "id")
    if not music_id:
        return None
    row = {
        "tiktok_sound_id": music_id,
        "sound_name": get(music, "musicName", "title"),
        "original_artist": get(music, "musicAuthor", "authorName"),
    }
    res = sb.table("sounds").upsert(row, on_conflict="tiktok_sound_id").execute()
    return res.data[0]["id"]

def mirror_thumbnail(tiktok_thumbnail_url, video_id_raw):
    """Download the thumbnail server-side (bypasses browser hotlink protection)
    and re-host it in Supabase Storage. Returns our own public URL, or None
    if anything goes wrong — never lets a bad thumbnail crash the whole run."""
    if not tiktok_thumbnail_url:
        return None
    try:
        resp = requests.get(tiktok_thumbnail_url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.tiktok.com/",
        })
        resp.raise_for_status()
        filename = f"{hashlib.md5(str(video_id_raw).encode()).hexdigest()}.jpg"
        sb.storage.from_(BUCKET).upload(
            filename, resp.content,
            {"content-type": "image/jpeg", "upsert": "true"},
        )
        return sb.storage.from_(BUCKET).get_public_url(filename)
    except Exception as e:
        print(f"  (thumbnail mirror skipped for {video_id_raw}: {e})")
        return None

def upsert_video(item, creator_id, sound_id):
    thumb_raw = get(item, "covers", default={})
    if isinstance(thumb_raw, dict):
        thumb_raw = get(thumb_raw, "default", "origin", "dynamic")
    if not thumb_raw:
        video_meta = get(item, "videoMeta", default={}) or {}
        thumb_raw = get(video_meta, "coverUrl") or get(item, "coverUrl")

    video_id_raw = get(item, "id", "videoId") or get(item, "webVideoUrl")
    thumbnail_url = mirror_thumbnail(thumb_raw, video_id_raw)

    row = {
        "tiktok_video_id": str(video_id_raw),
        "video_url": get(item, "webVideoUrl", "url") or "",
        "creator_id": creator_id,
        "sound_id": sound_id,
        "caption": get(item, "text", "desc", "caption"),
        "published_at": get(item, "createTimeISO", "createTime"),
        "thumbnail_url": thumbnail_url,
        "like_count_snapshot": get(item, "diggCount", "likeCount", default=0),
    }
    res = sb.table("videos").upsert(row, on_conflict="tiktok_video_id").execute()
    video_id = res.data[0]["id"]

    sb.table("video_metrics").insert({
        "video_id": video_id,
        "view_count": get(item, "playCount", "viewCount", default=0),
        "like_count": get(item, "diggCount", "likeCount", default=0),
        "comment_count": get(item, "commentCount", default=0),
        "share_count": get(item, "shareCount", default=0),
    }).execute()
    return video_id

def main():
    with open("raw_tiktok.json") as f:
        items = json.load(f)

    if not items:
        print("No items in raw_tiktok.json — nothing to process")
        return

    processed = 0
    failed = 0
    for item in items:
        try:
            creator_id = upsert_creator(item)
            sound_id = upsert_sound(item)
            upsert_video(item, creator_id, sound_id)
            processed += 1
        except Exception as e:
            failed += 1
            print(f"Skipped one item due to error: {e}")
    print(f"Processed {processed} videos, skipped {failed}")

if __name__ == "__main__":
    main()
