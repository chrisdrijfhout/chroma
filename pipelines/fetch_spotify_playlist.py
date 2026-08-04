"""
Pulls tracks from a Spotify playlist (e.g. a label's official curation
playlist) using the Client Credentials flow — no user login needed since
this only reads public playlist data.
"""
import os
import requests
from datetime import datetime, timezone
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

PLAYLIST_ID = "1u9WM7cJGDxk8sRNl1S7CM"  # Tribal Trap — BRAZILIAN PHONK 🇧🇷


def get_access_token():
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(os.environ["SPOTIFY_CLIENT_ID"], os.environ["SPOTIFY_CLIENT_SECRET"]),
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_all_tracks(token):
    tracks = []
    url = f"https://api.spotify.com/v1/playlists/{PLAYLIST_ID}/tracks"
    params = {"limit": 100}
    headers = {"Authorization": f"Bearer {token}"}

    while url:
        resp = requests.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()
        tracks.extend(data.get("items", []))
        url = data.get("next")
        params = None  # 'next' already includes query params
    return tracks


def upsert_track(item):
    track = item.get("track")
    if not track or not track.get("id"):
        return
    artist_names = ", ".join(a["name"] for a in track.get("artists", []))
    now_iso = datetime.now(timezone.utc).isoformat()

    sb.table("label_playlist_tracks").upsert({
        "spotify_track_id": track["id"],
        "track_name": track.get("name"),
        "artist_names": artist_names,
        "spotify_url": track.get("external_urls", {}).get("spotify"),
        "added_to_playlist_at": item.get("added_at"),
        "last_seen_at": now_iso,
    }, on_conflict="spotify_track_id").execute()


def main():
    token = get_access_token()
    tracks = fetch_all_tracks(token)
    print(f"Fetched {len(tracks)} tracks from playlist")

    for item in tracks:
        try:
            upsert_track(item)
        except Exception as e:
            print(f"Skipped one track due to error: {e}")

    print("Done")


if __name__ == "__main__":
    main()
