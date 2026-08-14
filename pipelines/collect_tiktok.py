import os, json
from apify_client import ApifyClient

# Using the saved task instead of calling the actor directly — same
# apidojo/tiktok-scraper actor underneath, output format identical.
TASK_ID = "C4rpjTXO0MoRMemer"  # chromarecords/tiktok-scraper-task

HASHTAGS = ["phonk", "phonkmusic", "driftphonk", "brazilianphonk",
            "aggressivephonk", "housephonk", "phonkedit", "drift", "caredit"]

# Cost control — total items across all hashtag URLs combined. The task
# itself also has its own "Maximum cost per run" cap set in Apify's UI
# ($0.20 at last check) as a second safety net independent of this.
MAX_ITEMS = 450


def get_dataset_items(client, run):
    dataset_id = (
        run.get("defaultDatasetId") if isinstance(run, dict)
        else getattr(run, "default_dataset_id", None)
    )
    if not dataset_id:
        raise RuntimeError(f"Could not find dataset id on run result: {run!r}")
    return list(client.dataset(dataset_id).iterate_items())


def collect():
    client = ApifyClient(os.environ["APIFY_API_TOKEN"])

    start_urls = [f"https://www.tiktok.com/tag/{tag}" for tag in HASHTAGS]

    run_input = {
        "startUrls": start_urls,
        "maxItems": MAX_ITEMS,
        "sortType": "RELEVANCE",
    }

    run = client.task(TASK_ID).call(task_input=run_input)
    return get_dataset_items(client, run)


if __name__ == "__main__":
    data = collect()
    with open("raw_tiktok.json", "w") as f:
        json.dump(data, f)
    print(f"Collected {len(data)} videos")
