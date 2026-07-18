# Phonk Radar — Architecture & Build Plan

A pragmatic MVP-first blueprint for a phonk trend-intelligence platform. No agent swarms, no vector DB, no AI-does-everything magic. Boring, reliable pipes; smart layer on top only where it earns its keep.

---

## 1. High-Level Architecture

```
TikTok (Apify actors)  ──┐
Spotify (Web API)      ──┼──▶  Python collectors (GitHub Actions, daily cron)
                          │           │
                          │           ▼
                          │     Supabase (Postgres)
                          │           │
                          │           ▼
                          │     Scoring jobs (Python, same Action run)
                          │           │
                          │           ▼
                          │     Next.js dashboard (reads Supabase directly)
                          │           │
                          │           ▼
                          └──▶  AI Insights job (weekly, Claude API) ──▶ insights table ──▶ Tab 5
```

Why this shape works: every arrow is a batch job you can rerun, inspect, and debug with `SELECT *`. Nothing here needs an orchestrator (Airflow/Dagster) at MVP scale — GitHub Actions cron is enough until you're running dozens of jobs a day.

**Why NOT the fancier options:**
- **Vector DB** — you're not doing semantic search over millions of docs yet. Postgres full-text search + trigram indexes cover "find creator/sound by name" fine.
- **Agent swarms** — trend scoring is arithmetic on aggregates, not a reasoning task. Save agentic AI for the one place it adds value: writing the weekly narrative.
- **Airflow** — one cron job a day doesn't need a scheduler with its own database.

---

## 2. Database Schema (Supabase / Postgres)

### Why these tables

| Table | Why it exists |
|---|---|
| `creators` | One row per TikTok account. Creator-level stats (follower count, total videos tracked) get expensive to recompute from `videos` every time — store rollups here. |
| `sounds` | One row per TikTok sound ID. Sounds are the actual viral unit in phonk (a track can trend as a "sound" before the artist trends). |
| `hashtags` | Reference table for the hashtags you track, plus per-hashtag rollup stats. |
| `videos` | One row per TikTok video, immutable identity fields only (URL, creator, sound, publish date, caption). |
| `video_metrics` | Time-series snapshot of a video's views/likes/comments/shares at each collection run. **Separate from `videos`** because metrics change daily and you need history to compute growth — cramming this into `videos` means overwriting your own growth signal every day. |
| `daily_metrics` | Pre-aggregated per-entity (creator/sound/hashtag) daily rollups, so the dashboard doesn't recompute aggregates over `video_metrics` on every page load. |
| `trend_scores` | Computed scores per entity per day — keeps scoring logic's output auditable and versionable (you can compare v1 vs v2 of your formula). |
| `insights` | Weekly AI-generated reports, stored so the dashboard just fetches text instead of calling Claude live. |

### Schema

```sql
-- creators
create table creators (
  id uuid primary key default gen_random_uuid(),
  tiktok_username text unique not null,
  tiktok_user_id text unique,
  profile_url text,
  follower_count integer,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- sounds
create table sounds (
  id uuid primary key default gen_random_uuid(),
  tiktok_sound_id text unique,
  sound_name text,
  original_artist text,
  spotify_track_id text,        -- linked in Phase 2
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- hashtags
create table hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text unique not null,      -- e.g. 'phonk', without the #
  is_tracked boolean default true,
  first_seen_at timestamptz default now()
);

-- videos
create table videos (
  id uuid primary key default gen_random_uuid(),
  tiktok_video_id text unique not null,
  video_url text not null,
  creator_id uuid references creators(id),
  sound_id uuid references sounds(id),
  caption text,
  published_at timestamptz,
  first_collected_at timestamptz default now(),
  last_collected_at timestamptz default now()
);

-- video_hashtags (many-to-many)
create table video_hashtags (
  video_id uuid references videos(id) on delete cascade,
  hashtag_id uuid references hashtags(id) on delete cascade,
  primary key (video_id, hashtag_id)
);

-- video_metrics (time series — the growth signal lives here)
create table video_metrics (
  id bigint generated always as identity primary key,
  video_id uuid references videos(id) on delete cascade,
  collected_at timestamptz not null default now(),
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  share_count bigint
);

-- daily_metrics (pre-aggregated rollups for dashboard speed)
create table daily_metrics (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('creator','sound','hashtag')),
  entity_id uuid not null,
  metric_date date not null,
  video_count integer,
  total_views bigint,
  total_likes bigint,
  new_videos_count integer,
  unique(entity_type, entity_id, metric_date)
);

-- trend_scores (auditable, versioned scoring output)
create table trend_scores (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('video','creator','sound')),
  entity_id uuid not null,
  score_date date not null,
  score numeric not null,
  score_version text not null default 'v1',
  components jsonb,   -- store the sub-scores that made up the total, for debugging
  unique(entity_type, entity_id, score_date, score_version)
);

-- insights (weekly AI reports)
create table insights (
  id uuid primary key default gen_random_uuid(),
  report_type text not null default 'weekly',
  period_start date not null,
  period_end date not null,
  summary text not null,
  full_report jsonb,
  created_at timestamptz default now()
);
```

### Indexes & optimization

```sql
create index idx_video_metrics_video_time on video_metrics(video_id, collected_at desc);
create index idx_videos_published on videos(published_at desc);
create index idx_videos_sound on videos(sound_id);
create index idx_videos_creator on videos(creator_id);
create index idx_daily_metrics_entity on daily_metrics(entity_type, entity_id, metric_date desc);
create index idx_trend_scores_lookup on trend_scores(entity_type, score_date desc, score desc);
-- fast fuzzy search on names
create extension if not exists pg_trgm;
create index idx_creators_username_trgm on creators using gin (tiktok_username gin_trgm_ops);
create index idx_sounds_name_trgm on sounds using gin (sound_name gin_trgm_ops);
```

Practical notes:
- `video_metrics` will be your biggest table by far (one row per video per day). Partition by month once you pass ~5M rows; not needed at MVP scale.
- Don't store growth rate as a column on `videos` — always derive it from `video_metrics` at query/scoring time, or you'll get stale numbers.
- Row-level security: enable RLS on all tables, dashboard reads via an anon key with read-only policies; writes only via the service-role key used in GitHub Actions.

---

## 3. GitHub Actions: Daily Pipeline

Repo structure:

```
phonk-radar/
├── .github/workflows/
│   ├── daily_pipeline.yml
│   └── weekly_insights.yml
├── pipelines/
│   ├── collect_tiktok.py
│   ├── update_records.py
│   ├── compute_daily_metrics.py
│   └── compute_trend_scores.py
├── ai/
│   └── generate_weekly_insight.py
├── dashboard/           # Next.js app
├── requirements.txt
└── README.md
```

`.github/workflows/daily_pipeline.yml`:

```yaml
name: Daily Phonk Radar Pipeline

on:
  schedule:
    - cron: '0 6 * * *'   # 06:00 UTC daily
  workflow_dispatch: {}

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      APIFY_API_TOKEN: ${{ secrets.APIFY_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt

      - name: Collect TikTok data
        run: python pipelines/collect_tiktok.py

      - name: Upsert videos/creators/sounds
        run: python pipelines/update_records.py

      - name: Compute daily rollups
        run: python pipelines/compute_daily_metrics.py

      - name: Compute trend scores
        run: python pipelines/compute_trend_scores.py

      - name: Notify on failure
        if: failure()
        run: echo "Pipeline failed — check logs" # wire to Slack/email later
```

`pipelines/collect_tiktok.py` (skeleton — Apify TikTok Scraper actor):

```python
import os
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
    return items  # raw TikTok video dicts

if __name__ == "__main__":
    import json
    data = collect()
    with open("raw_tiktok.json", "w") as f:
        json.dump(data, f)
    print(f"Collected {len(data)} videos")
```

`pipelines/update_records.py` (skeleton — upsert into Supabase):

```python
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
```

`compute_daily_metrics.py` and `compute_trend_scores.py` follow the same pattern: pull from `video_metrics`/`videos`, aggregate in pandas, upsert into `daily_metrics` / `trend_scores`. Keep them boring — SQL aggregation via Supabase's Postgres function or plain pandas groupby, whichever you're faster in.

---

## 4. Trend Scoring

Keep formulas transparent and tunable — store components in `trend_scores.components` so you can see why something scored high, and adjust weights without re-architecting.

**Video score** (recency-weighted growth + engagement):

```
growth_rate = (views_today - views_yesterday) / max(views_yesterday, 1)
engagement_rate = (likes + comments*2 + shares*3) / max(views, 1)
recency_boost = max(0, 1 - days_since_published / 14)   # decays over 2 weeks

video_score = (0.5 * normalize(growth_rate)
             + 0.3 * normalize(engagement_rate)
             + 0.2 * recency_boost) * 100
```
Reasoning: raw views favor old viral videos forever; growth rate catches what's accelerating *now*. Comments/shares are weighted above likes because they're higher-intent signals (someone stopped to type or actively repost). Recency boost prevents month-old videos from dominating "trending" purely on accumulated views.

**Creator score:**

```
creator_score = (0.4 * avg(top_5_video_scores)
              + 0.3 * normalize(video_count_last_30d)
              + 0.3 * normalize(view_growth_rate_30d)) * 100
```
Reasoning: one viral fluke shouldn't crown a "trending creator" — average their best 5 recent videos, and require consistency (posting cadence) and account-level growth, not just one outlier.

**Sound score:**

```
sound_score = (0.4 * normalize(video_count_growth_7d)
             + 0.3 * normalize(total_views_generated)
             + 0.3 * normalize(unique_creators_using_it))
             * 100
```
Reasoning: a sound spreading across *many different creators* (not just one account reposting) is the real "this sound is taking off" signal — that's why unique creator count is a third of the score, not just total video count.

`normalize()` = min-max or percentile-rank against the last 30 days of scores for that entity type, recomputed daily, so scores stay comparable over time as the dataset grows.

---

## 5. Dashboard (Next.js)

```
dashboard/
├── app/
│   ├── videos/page.tsx          # Tab 1
│   ├── creators/page.tsx        # Tab 2
│   ├── sounds/page.tsx          # Tab 3
│   ├── emerging/page.tsx        # Tab 4
│   └── insights/page.tsx        # Tab 5
├── components/
│   ├── DataTable.tsx            # shared sortable/filterable table
│   ├── SearchBar.tsx
│   └── DateRangePicker.tsx
├── lib/supabaseClient.ts
```

- Query Supabase directly from server components (`@supabase/ssr`) — no separate backend API needed at this scale.
- `DataTable` component reused across tabs 1–3, driven by a `columns` config — avoid building three bespoke tables.
- Tab 4 ("Emerging") = same data, filtered to `first_seen_at within last 7 days` + minimum score threshold, sorted by score — it's a saved filter, not a separate pipeline.
- Tab 5 just renders the latest row from `insights` as formatted markdown/text.
- Use shadcn/ui + Tailwind for a clean "terminal" aesthetic fast — dark theme, monospace numerics reads as "Bloomberg" without custom design work.

---

## 6. AI Insights Layer

Weekly, not daily — a phonk news cycle doesn't move meaningfully day to day, and weekly keeps API cost trivial.

`.github/workflows/weekly_insights.yml` — same shape as daily, cron `0 8 * * 1` (Monday mornings), runs `ai/generate_weekly_insight.py`.

```python
import os, json
from datetime import date, timedelta
from supabase import create_client
import anthropic

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def gather_week_data():
    since = (date.today() - timedelta(days=7)).isoformat()
    top_creators = sb.table("trend_scores").select("*").eq("entity_type", "creator") \
        .gte("score_date", since).order("score", desc=True).limit(10).execute().data
    top_sounds = sb.table("trend_scores").select("*").eq("entity_type", "sound") \
        .gte("score_date", since).order("score", desc=True).limit(10).execute().data
    top_videos = sb.table("trend_scores").select("*").eq("entity_type", "video") \
        .gte("score_date", since).order("score", desc=True).limit(15).execute().data
    return {"creators": top_creators, "sounds": top_sounds, "videos": top_videos}

def generate_report(data):
    prompt = f"""You are an A&R analyst covering the global phonk music scene.
Below is structured trend data for the past 7 days (creators, sounds, videos with computed scores).

Data:
{json.dumps(data, default=str)}

Write a concise executive report for a label owner / A&R manager covering:
1. Fastest growing creators (who and why it matters)
2. Fastest growing sounds
3. Emerging hashtags or subgenre shifts you can infer from the data
4. Content format observations
5. 2-3 concrete opportunities (artists/creators worth contacting now)

Keep it under 500 words, direct, no fluff. This is a business intelligence brief, not marketing copy."""

    msg = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

def main():
    data = gather_week_data()
    report = generate_report(data)
    sb.table("insights").insert({
        "report_type": "weekly",
        "period_start": (date.today() - timedelta(days=7)).isoformat(),
        "period_end": date.today().isoformat(),
        "summary": report,
        "full_report": data,
    }).execute()

if __name__ == "__main__":
    main()
```

AI never touches scraping or scoring — it receives already-computed numbers and writes the narrative. This keeps the expensive/fragile part of the system (data collection) fully deterministic and debuggable, and confines LLM cost + hallucination risk to one weekly text-generation call.

---

## 7. Cost Estimates (MVP, monthly)

| Item | Estimate |
|---|---|
| Supabase | Free tier initially; Pro ($25/mo) once you exceed 500MB / need daily backups |
| Apify (TikTok scraping, ~9 hashtags × 100 videos/day) | ~$30–80/mo depending on actor pricing tier and daily volume |
| GitHub Actions | Free (public repo) or ~$0–10/mo (private repo, well within free minutes for one daily + one weekly job) |
| Claude API (1 report/week, ~2–3k tokens in/out) | <$5/mo |
| Vercel (Next.js hosting) | Free tier sufficient at MVP traffic |
| **Total** | **~$60–120/mo** |

Spotify Phase 2 adds ~$0 (official Web API is free within rate limits) but adds dev time for OAuth + playlist crawling logic.

---

## 8. Development Roadmap

1. **Week 1** — Supabase schema live, Apify actor tested manually, one manual data pull into the DB.
2. **Week 2** — GitHub Actions daily pipeline running unattended for a week; verify metrics accumulate correctly.
3. **Week 3** — Scoring jobs + `daily_metrics`/`trend_scores` populated; sanity-check rankings against what you already know is trending.
4. **Week 4** — Dashboard: Tabs 1–3 (Videos/Creators/Sounds) with search/filter/sort.
5. **Week 5** — Tab 4 (Emerging) + weekly AI insight job + Tab 5.
6. **Week 6+** — Harden: error alerting, rate-limit handling, dedupe edge cases, then start Spotify Phase 2.

## 9. Biggest Risks & Bottlenecks

- **TikTok scraping fragility** — Apify actors break when TikTok changes its site; budget maintenance time, and don't build anything downstream that assumes 100% uptime of collection.
- **Hashtag coverage bias** — you only see what's tagged with your tracked hashtags; a video going viral under an untracked tag or via FYP alone is invisible. Revisit the hashtag list monthly.
- **Sound ID matching to Spotify** — TikTok sound metadata is messy (remix names, sped-up versions); the Phase 2 join to Spotify tracks will need fuzzy matching and manual review, not a clean foreign key.
- **Scoring formula overfitting** — early on you'll be tempted to tune weights until they match your gut. Log `components` so you can audit *why* a score moved before changing the formula.
- **Rate limits / bans** — both Apify and Spotify enforce limits; daily-cron cadence is deliberately conservative, don't be tempted to poll hourly early on.

## 10. If I Had Only One Weekend

Skip the dashboard and the AI layer entirely. Build:
1. Supabase schema (just `creators`, `sounds`, `videos`, `video_metrics`) — 1 hour.
2. One Apify actor pull for `#phonk` only, manually triggered — 2 hours.
3. `update_records.py` upsert script — 2 hours.
4. Run it manually once a day for the weekend (skip GitHub Actions automation).
5. A single Python script that prints a plain-text "top 10 videos by growth rate" — no dashboard, just `print()`.

That proves the only thing that actually matters before anything else: **can you detect a video accelerating faster than others, using real data, without a UI?** If the raw numbers don't produce an obviously-correct "yeah, that's trending" list by Sunday night, no amount of dashboard polish fixes it — go back to the scoring logic. Everything else (automation, UI, AI narrative, Spotify) is a straight-line build once that core signal is proven.
