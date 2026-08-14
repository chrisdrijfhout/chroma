import os, json
from apify_client import ApifyClient

TASK_ID = "C4rpjTXO0MoRMemer"  # chromarecords/tiktok-scraper-task


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

    # No input override at all — every setting (search keywords, date
    # range, sort type, region, max items) comes purely from whatever is
    # saved directly in this task's own settings in Apify's UI. This
    # script's only job is to trigger the task as-configured; change
    # scraping behavior there, not here.
    run = client.task(TASK_ID).call()
    return get_dataset_items(client, run)


if __name__ == "__main__":
    data = collect()
    with open("raw_tiktok.json", "w") as f:
        json.dump(data, f)
    print(f"Collected {len(data)} videos")
