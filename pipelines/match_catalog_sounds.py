"""
Searches TikTok for each catalog track by "artist track" name, using the
chromarecords/tiktok-sound-scraper-task saved task. Validates each match
against the original query before saving it — a search-based lookup can
return the wrong song, so a bad match is discarded rather than trusted.

MAX_TRACKS_PER_RUN covers the full catalog in one run. There's no way to
check live Apify account balance from here, so this is a call-count cap,
not a true dollar cap — check Apify's Usage tab after this run to confirm
real cost before scheduling it to run regularly.
"""
import os, json
from difflib import SequenceMatcher
from apify_client import ApifyClient
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
client = ApifyClient(os.environ["APIFY_API_TOKEN"])

TASK_ID = "a3KgzFhmrq2ajr3zH"
MAX_TRACKS_PER_RUN = 150  # covers the full ~97-track catalog in one run
MATCH_CONFIDENCE_THRESHOLD = 0.45  # below this, the match is discarded


def get_dataset_items(run):
    dataset_id = (
        run.get("defaultDatasetId") if isinstance(run, dict)
        else getattr(run, "default_dataset_id", None)
    )
    if not dataset_id:
        return []
    return list(client.dataset(dataset_id).iterate_items())


def search_sound(query, debug=False):
    run_input = {
        "soundUrls": [],
        "startUrls": [],
        "clipIds": [],
        "searchQueries": [query],
        "outputMode": "sounds",
        "maxSounds": 1,
        "maxSearchResultsPerQuery": 1,
        "maxVideosPerSound": 0,
        "includeRawData": False,
    }
    run = client.task(TASK_ID).call(task_input=run_input)
    items = get_dataset_items(run)
    if not items:
        print(f"  (no result for query: {query!r})")
        return None

    item = items[0]
    if debug:
        print(f"=== DEBUG sample response for query {query!r} ===")
        print(json.dumps(item, indent=2)[:1500])

    return item


def extract_sound_id(item):
    for key in ["musicId", "music_id", "id", "soundId"]:
        if key in item:
            return item[key]
    return None


def extract_video_count(item):
    for key in ["videoCount", "video_count", "usageCount"]:
        val = item.get(key)
        if isinstance(val, int):
            return val
    return None


def match_confidence(query, item):
    """Compares the search query against the matched item's own title +
    artist text. Returns a 0-1 similarity score — low scores mean the
    search likely returned the wrong song entirely."""
    title = item.get("title") or item.get("musicName") or ""
    artist = item.get("authorName") or item.get("artist") or item.get("musicAuthor") or ""
    candidate_text = f"{artist} {title}".lower().strip()
    query_text = query.lower().strip()
    if not candidate_text:
        return 0.0
    return SequenceMatcher(None, query_text, candidate_text).ratio()


def main():
    tracks = sb.table("label_playlist_tracks").select("id, track_name, artist_names") \
        .is_("tiktok_sound_id_match", "null") \
        .limit(MAX_TRACKS_PER_RUN).execute().data or []

    print(f"Matching {len(tracks)} catalog tracks (capped at {MAX_TRACKS_PER_RUN})")

    matched, skipped, no_result = 0, 0, 0

    for i, t in enumerate(tracks):
        first_artist = (t["artist_names"] or "").split(",")[0].strip()
        query = f"{first_artist} {t['track_name']}"

        try:
            item = search_sound(query, debug=(i == 0))
            if not item:
                no_result += 1
                continue

            confidence = match_confidence(query, item)
            title = item.get("title") or item.get("musicName") or "?"

            if confidence < MATCH_CONFIDENCE_THRESHOLD:
                print(f"  SKIPPED (low confidence {confidence:.2f}): {query!r} -> {title!r}")
                skipped += 1
                continue

            sound_id = extract_sound_id(item)
            video_count = extract_video_count(item)
            print(f"  MATCHED (confidence {confidence:.2f}): {query!r} -> {title!r} (sound_id={sound_id}, videos={video_count})")

            sb.table("label_playlist_tracks").update({
                "tiktok_sound_id_match": sound_id,
                "tiktok_video_count": video_count,
            }).eq("id", t["id"]).execute()
            matched += 1
        except Exception as e:
            print(f"  Error matching {query!r}: {e}")

    print(f"Done — {matched} matched, {skipped} skipped as low-confidence, {no_result} had no result")


if __name__ == "__main__":
    main()
