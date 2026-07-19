import os, json
from apify_client import ApifyClient

TASK_ID = "5pgv9BNd5V82yozfv"

def collect():
    client = ApifyClient(os.environ["APIFY_API_TOKEN"])
    run = client.task(TASK_ID).call()

    # Handle both possible return shapes across apify-client versions:
    # some return a dict, some return an object with attributes.
    dataset_id = (
        run.get("defaultDatasetId") if isinstance(run, dict)
        else getattr(run, "default_dataset_id", None)
    )
    if not dataset_id:
        raise RuntimeError(f"Could not find dataset id on run result: {run!r}")

    items = list(client.dataset(dataset_id).iterate_items())
    return items

if __name__ == "__main__":
    data = collect()
    with open("raw_tiktok.json", "w") as f:
        json.dump(data, f)
    print(f"Collected {len(data)} videos")
