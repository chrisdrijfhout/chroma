-- Phonk Radar schema

create table creators (
  id uuid primary key default gen_random_uuid(),
  tiktok_username text unique not null,
  tiktok_user_id text unique,
  profile_url text,
  follower_count integer,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table sounds (
  id uuid primary key default gen_random_uuid(),
  tiktok_sound_id text unique,
  sound_name text,
  original_artist text,
  spotify_track_id text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text unique not null,
  is_tracked boolean default true,
  first_seen_at timestamptz default now()
);

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

create table video_hashtags (
  video_id uuid references videos(id) on delete cascade,
  hashtag_id uuid references hashtags(id) on delete cascade,
  primary key (video_id, hashtag_id)
);

create table video_metrics (
  id bigint generated always as identity primary key,
  video_id uuid references videos(id) on delete cascade,
  collected_at timestamptz not null default now(),
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  share_count bigint
);

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

create table trend_scores (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('video','creator','sound')),
  entity_id uuid not null,
  score_date date not null,
  score numeric not null,
  score_version text not null default 'v1',
  components jsonb,
  unique(entity_type, entity_id, score_date, score_version)
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  report_type text not null default 'weekly',
  period_start date not null,
  period_end date not null,
  summary text not null,
  full_report jsonb,
  created_at timestamptz default now()
);

create index idx_video_metrics_video_time on video_metrics(video_id, collected_at desc);
create index idx_videos_published on videos(published_at desc);
create index idx_videos_sound on videos(sound_id);
create index idx_videos_creator on videos(creator_id);
create index idx_daily_metrics_entity on daily_metrics(entity_type, entity_id, metric_date desc);
create index idx_trend_scores_lookup on trend_scores(entity_type, score_date desc, score desc);

create extension if not exists pg_trgm;
create index idx_creators_username_trgm on creators using gin (tiktok_username gin_trgm_ops);
create index idx_sounds_name_trgm on sounds using gin (sound_name gin_trgm_ops);
