import os, hashlib
from datetime import datetime, timezone
import requests
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
BUCKET = "thumbnails"

# TikTok's own auto-generated placeholder name for a genuinely self-recorded
# sound, across languages — matching one of these means the sound is real
# original audio, not a branded/edited track.
ORIGINAL_SOUND_PATTERNS = [
    "original sound", "âm thanh gốc", "sonido original", "son original",
    "оригинальный звук", "الصوت الأصلي", "suono originale", "orijinal ses",
    "originalton", "audio originale", "original geluid", "sunet original",
]


def looks_like_original_sound(title):
    if not title:
        return False
    t = title.lower()
    return any(p in t for p in ORIGINAL_SOUND_PATTERNS)


def get_oembed_thumbnail(video_url):
    if not video_url:
        return None
    try:
        resp = requests.get("https://www.tiktok.com/oembed", params={"url": video_url}, timeout=10)
        resp.raise_for_status()
        return resp.json().get("thumbnail_url")
    except Exception as e:
        print(f"  (oEmbed lookup failed: {e})")
        return None


def mirror_thumbnail(image_url, video_id_raw):
    if not image_url:
        print(f"  (no thumbnail available for {video_id_raw})")
        return None
    try:
        resp = requests.get(image_url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.tiktok.com/",
        })
        resp.raise_for_status()
        filename = f"{hashlib.md5(str(video_id_raw).encode()).hexdigest()}.jpg"
        sb.storage.from_(BUCKET).upload(filename, resp.content, {"content-type": "image/jpeg", "upsert": "true"})
        return sb.storage.from_(BUCKET).get_public_url(filename)
    except Exception as e:
        print(f"  (thumbnail mirror skipped for {video_id_raw}: {e})")
        return None


def upsert_creator(item):
    username = item.get("channel.username") or "unknown"
    row = {
        "tiktok_username": username,
        "tiktok_user_id": item.get("channel.id"),
        # No follower count in this actor's output — leave unset rather
        # than guessing.
        "last_seen_at": datetime.now(timezone.utc).isoformat(),
    }
    res = sb.table("creators").upsert(row, on_conflict="tiktok_username").execute()
    return res.data[0]["id"]


def upsert_sound(item):
    music_id = item.get("song.id")
    if not music_id:
        return None
    title = item.get("song.title")
    row = {
        "tiktok_sound_id": str(music_id),
        "sound_name": title,
        "original_artist": item.get("song.artist"),
        "is_original": looks_like_original_sound(title),
        "last_seen_at": datetime.now(timezone.utc).isoformat(),
    }
    res = sb.table("sounds").upsert(row, on_conflict="tiktok_sound_id").execute()
    return res.data[0]["id"]


def upsert_video(item, creator_id, sound_id):
    video_url = item.get("postPage") or ""
    video_id_raw = item.get("id") or video_url

    # Thumbnail: use the actor's own cover URL first (server-side fetch
    # avoids the hotlink-block issue browsers hit), fall back to oEmbed
    # only if that's missing.
    raw_thumb = item.get("video.thumbnail") or item.get("video.cover")
    thumbnail_url = mirror_thumbnail(raw_thumb, video_id_raw) or mirror_thumbnail(
        get_oembed_thumbnail(video_url), video_id_raw
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    row = {
        "tiktok_video_id": str(video_id_raw),
        "video_url": video_url,
        "creator_id": creator_id,
        "sound_id": sound_id,
        "caption": item.get("title"),
        "published_at": item.get("uploadedAtFormatted"),
        "thumbnail_url": thumbnail_url,
        "like_count_snapshot": item.get("likes", 0),
        "last_collected_at": now_iso,
    }
    res = sb.table("videos").upsert(row, on_conflict="tiktok_video_id").execute()
    video_id = res.data[0]["id"]

    sb.table("video_metrics").insert({
        "video_id": video_id,
        "view_count": item.get("views", 0),
        "like_count": item.get("likes", 0),
        "comment_count": item.get("comments", 0),
        "share_count": item.get("shares", 0),
    }).execute()
    return video_id


def main():
    import json
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
