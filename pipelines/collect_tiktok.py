import os, json
from apify_client import ApifyClient

HASHTAGS = ["phonk", "phonkmusic", "driftphonk", "brazilianphonk",
            "aggressivephonk", "housephonk", "phonkedit", "drift", "caredit"]

def collect():
    client = ApifyClient(os.environ["APIFY_API_TOKEN"])
    run_input = {
        "hashtags": HASHTAGS,
        "resultsPerPage": 100,
        "shouldDownloadVideos": False,
    }
    run = client.actor("clockworks/tiktok-scraper").call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    return items

if __name__ == "__main__":
    data = collect()
    with open("raw_tiktok.json", "w") as f:
        json.dump(data, f)
    print(f"Collected {len(data)} videos")
