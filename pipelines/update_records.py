import os, hashlib, json
from datetime import datetime, timezone
import requests
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
BUCKET = "thumbnails"

# Computed ONCE, shared by every video/creator/sound touched in this run —
# this is what makes "the latest scrape" mean exactly one run, not a
# smeared window of several minutes.
RUN_TIMESTAMP = datetime.now(timezone.utc).isoformat()

ORIGINAL_SOUND_PATTERNS = [
    "original sound", "âm thanh gốc", "sonido original", "son original",
    "оригинальный звук", "الصوت الأصلي", "suono originale", "orijinal ses",
    "originalton", "audio originale", "original geluid", "sunet original",
]


def get_field(item, dotted_path):
    """Tries BOTH possible shapes: a literal flat key like 'channel.username'
    (what Apify's console table view displays), and genuinely nested dict
    access like item['channel']['username'] (what the raw API might
    actually return). Whichever is true, this finds it."""
    # Try flat first
    if dotted_path in item and item[dotted_path] is not None:
        return item[dotted_path]
    # Try nested
    parts = dotted_path.split(".")
    current = item
    for p in parts:
        if isinstance(current, dict) and p in current:
            current = current[p]
        else:
            return None
    return current


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
    username = get_field(item, "channel.username") or "unknown"
    row = {
        "tiktok_username": username,
        "tiktok_user_id": get_field(item, "channel.id"),
        "last_seen_at": RUN_TIMESTAMP,
    }
    res = sb.table("creators").upsert(row, on_conflict="tiktok_username").execute()
    return res.data[0]["id"]


def normalize(text):
    return "".join(c for c in (text or "").lower() if c.isalnum())


def artist_matches_creator(artist, item):
    """Language-independent signal: if the sound's credited artist is
    (roughly) the same as the video's own poster, it's almost certainly
    a genuine self-recorded original — regardless of what language
    TikTok's own placeholder text happened to be in."""
    if not artist:
        return False
    a = normalize(artist)
    username = normalize(get_field(item, "channel.username"))
    name = normalize(get_field(item, "channel.name"))
    if not a:
        return False
    return (username and (a in username or username in a)) or (name and (a in name or name in a))


def upsert_sound(item):
    music_id = get_field(item, "song.id")
    if not music_id:
        return None
    title = get_field(item, "song.title")
    artist = get_field(item, "song.artist")
    is_original = looks_like_original_sound(title) or artist_matches_creator(artist, item)
    row = {
        "tiktok_sound_id": str(music_id),
        "sound_name": title,
        "original_artist": artist,
        "is_original": is_original,
        "last_seen_at": RUN_TIMESTAMP,
    }
    res = sb.table("sounds").upsert(row, on_conflict="tiktok_sound_id").execute()
    return res.data[0]["id"]


def upsert_video(item, creator_id, sound_id):
    video_url = item.get("postPage") or ""
    video_id_raw = item.get("id") or video_url

    raw_thumb = get_field(item, "video.thumbnail") or get_field(item, "video.cover")
    thumbnail_url = mirror_thumbnail(raw_thumb, video_id_raw) or mirror_thumbnail(
        get_oembed_thumbnail(video_url), video_id_raw
    )

    row = {
        "tiktok_video_id": str(video_id_raw),
        "video_url": video_url,
        "creator_id": creator_id,
        "sound_id": sound_id,
        "caption": item.get("title"),
        "published_at": item.get("uploadedAtFormatted"),
        "thumbnail_url": thumbnail_url,
        "like_count_snapshot": item.get("likes", 0),
        "last_collected_at": RUN_TIMESTAMP,
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
    with open("raw_tiktok.json") as f:
        items = json.load(f)

    if not items:
        print("No items in raw_tiktok.json — nothing to process")
        return

    # Debug: confirm the real shape of channel/song fields for the first
    # item, so if anything's still wrong we can see exactly why.
    first = items[0]
    print("=== DEBUG: field resolution for first item ===")
    print(f"channel.username resolved to: {get_field(first, 'channel.username')!r}")
    print(f"song.id resolved to: {get_field(first, 'song.id')!r}")
    print(f"song.title resolved to: {get_field(first, 'song.title')!r}")
    print(f"Raw top-level keys: {list(first.keys())}")

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
