"""
One-off backfill: fills in thumbnail_url for existing videos that have
none, using TikTok's free public oEmbed endpoint (no Apify cost) instead
of re-scraping. Run this manually, once, from the Actions tab.
"""
import os, hashlib
import requests
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
BUCKET = "thumbnails"

def mirror_thumbnail(image_url, video_id_raw):
    try:
        resp = requests.get(image_url, timeout=10, headers={
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
        print(f"  (mirror failed for {video_id_raw}: {e})")
        return None

def get_oembed_thumbnail(video_url):
    try:
        resp = requests.get(
            "https://www.tiktok.com/oembed",
            params={"url": video_url},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("thumbnail_url")
    except Exception as e:
        print(f"  (oEmbed lookup failed for {video_url}: {e})")
        return None

def main():
    result = sb.table("videos").select("id, tiktok_video_id, video_url").is_("thumbnail_url", "null").execute()
    rows = result.data or []
    print(f"Found {len(rows)} videos missing thumbnails")

    updated = 0
    for row in rows:
        oembed_thumb = get_oembed_thumbnail(row["video_url"])
        if not oembed_thumb:
            continue
        mirrored_url = mirror_thumbnail(oembed_thumb, row["tiktok_video_id"])
        if mirrored_url:
            sb.table("videos").update({"thumbnail_url": mirrored_url}).eq("id", row["id"]).execute()
            updated += 1

    print(f"Backfilled {updated} of {len(rows)} thumbnails")

if __name__ == "__main__":
    main()
