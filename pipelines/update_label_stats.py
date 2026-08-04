"""
Refreshes popularity/follower stats for tracks and artists already known
in label_playlist_tracks. Uses GET /tracks and GET /artists — general
metadata endpoints that remain open via Client Credentials even after
Spotify's Feb 2026 restriction on reading third-party playlist contents.
The track/artist LIST itself has to be seeded/updated manually (see
fetch_spotify_playlist.py comments) — this script only refreshes stats
for what's already in the table.
"""
import os
import requests
from datetime import datetime, timezone
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def get_access_token():
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(os.environ["SPOTIFY_CLIENT_ID"], os.environ["SPOTIFY_CLIENT_SECRET"]),
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def chunk(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def update_track_popularity(token):
    rows = sb.table("label_playlist_tracks").select("id, spotify_track_id").execute().data or []
    track_ids = [r["spotify_track_id"] for r in rows if r.get("spotify_track_id")]
    headers = {"Authorization": f"Bearer {token}"}

    for batch in chunk(track_ids, 50):  # Spotify allows up to 50 IDs per call
        resp = requests.get(
            "https://api.spotify.com/v1/tracks",
            headers=headers,
            params={"ids": ",".join(batch)},
        )
        if not resp.ok:
            print(f"Track batch error {resp.status_code}: {resp.text}")
            continue
        for track in resp.json().get("tracks", []):
            if not track:
                continue
            sb.table("label_playlist_tracks").update({
                "popularity": track.get("popularity"),
            }).eq("spotify_track_id", track["id"]).execute()
    print(f"Updated popularity for {len(track_ids)} tracks")


def update_artist_stats(token):
    rows = sb.table("label_playlist_tracks").select("spotify_artist_ids").execute().data or []
    all_artist_ids = set()
    for r in rows:
        ids = (r.get("spotify_artist_ids") or "").split(",")
        all_artist_ids.update(a.strip() for a in ids if a.strip())

    headers = {"Authorization": f"Bearer {token}"}
    now_iso = datetime.now(timezone.utc).isoformat()

    for batch in chunk(list(all_artist_ids), 50):
        resp = requests.get(
            "https://api.spotify.com/v1/artists",
            headers=headers,
            params={"ids": ",".join(batch)},
        )
        if not resp.ok:
            print(f"Artist batch error {resp.status_code}: {resp.text}")
            continue
        for artist in resp.json().get("artists", []):
            if not artist:
                continue
            sb.table("label_playlist_artists").upsert({
                "spotify_artist_id": artist["id"],
                "artist_name": artist.get("name"),
                "followers": artist.get("followers", {}).get("total"),
                "popularity": artist.get("popularity"),
                "last_updated_at": now_iso,
            }, on_conflict="spotify_artist_id").execute()
    print(f"Updated stats for {len(all_artist_ids)} artists")


def main():
    token = get_access_token()
    update_track_popularity(token)
    update_artist_stats(token)
    print("Done")


if __name__ == "__main__":
    main()
