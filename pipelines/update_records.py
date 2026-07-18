import os, json
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def upsert_creator(item):
    row = {
        "tiktok_username": item["authorMeta"]["name"],
        "tiktok_user_id": item["authorMeta"]["id"],
        "follower_count": item["authorMeta"].get("fans"),
    }
    res = sb.table("creators").upsert(row, on_conflict="tiktok_user_id").execute()
    return res.data[0]["id"]

def upsert_sound(item):
    music = item.get("musicMeta", {})
    if not music.get("musicId"):
        return None
    row = {
        "tiktok_sound_id": music["musicId"],
        "sound_name": music.get("musicName"),
        "original_artist": music.get("musicAuthor"),
    }
    res = sb.table("sounds").upsert(row, on_conflict="tiktok_sound_id").execute()
    return res.data[0]["id"]

def upsert_video(item, creator_id, sound_id):
    row = {
        "tiktok_video_id": item["id"],
        "video_url": item["webVideoUrl"],
        "creator_id": creator_id,
        "sound_id": sound_id,
        "caption": item.get("text"),
        "published_at": item.get("createTimeISO"),
    }
    res = sb.table("videos").upsert(row, on_conflict="tiktok_video_id").execute()
    video_id = res.data[0]["id"]
    sb.table("video_metrics").insert({
        "video_id": video_id,
        "view_count": item.get("playCount", 0),
        "like_count": item.get("diggCount", 0),
        "comment_count": item.get("commentCount", 0),
        "share_count": item.get("shareCount", 0),
    }).execute()
    return video_id

def main():
    with open("raw_tiktok.json") as f:
        items = json.load(f)
    for item in items:
        creator_id = upsert_creator(item)
        sound_id = upsert_sound(item)
        upsert_video(item, creator_id, sound_id)
    print(f"Processed {len(items)} videos")

if __name__ == "__main__":
    main()
