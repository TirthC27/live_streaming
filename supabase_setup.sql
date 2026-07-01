-- ============================================================
-- StreamX — Supabase Database Setup (Multi-Channel Upgrade)
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ⚠️  WARNING: This drops the old single-stream table.
-- Make sure you have backed up any existing stream URLs.
DROP TABLE IF EXISTS stream_config CASCADE;


-- ─── Table 1: channels ─────────────────────────────────────
-- Supports 3-4 parallel streams, each with primary + backup URL.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_key TEXT NOT NULL UNIQUE,           -- e.g. 'channel1', 'channel2'
  channel_name TEXT NOT NULL,                 -- e.g. 'La Liga HD'
  description TEXT,
  thumbnail_url TEXT,
  active_url TEXT,                            -- primary m3u8 URL
  secondary_url TEXT,                         -- backup m3u8 URL
  active_url_label TEXT DEFAULT 'Main',
  secondary_url_label TEXT DEFAULT 'Backup',
  is_active BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  -- Resolved-URL inspection metadata (carried over from old schema)
  active_resolved_url TEXT,
  active_stream_strategy TEXT DEFAULT 'direct',
  active_last_checked_at TIMESTAMPTZ,
  active_last_check_status TEXT,
  secondary_resolved_url TEXT,
  secondary_stream_strategy TEXT DEFAULT 'direct',
  secondary_last_checked_at TIMESTAMPTZ,
  secondary_last_check_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert 4 default channels
INSERT INTO public.channels
  (channel_key, channel_name, display_order) VALUES
  ('channel1', 'Channel 1', 1),
  ('channel2', 'Channel 2', 2),
  ('channel3', 'Channel 3', 3),
  ('channel4', 'Channel 4', 4)
ON CONFLICT (channel_key) DO NOTHING;


-- ─── Table 2: scheduled_matches ─────────────────────────────
-- Associates a match with a channel and controls when the stream
-- is available to viewers.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scheduled_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  match_title TEXT NOT NULL,                  -- e.g. 'Real Madrid vs Barcelona'
  match_description TEXT,
  sport_type TEXT DEFAULT 'football',
  scheduled_start TIMESTAMPTZ NOT NULL,       -- actual match start time (UTC)
  stream_open_offset INTEGER DEFAULT 15,      -- minutes before match to open stream
  stream_close_offset INTEGER DEFAULT 30,     -- minutes after scheduled end to close
  estimated_duration INTEGER DEFAULT 120,     -- match duration in minutes
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ─── Table 3: youtube_cache ─────────────────────────────────
-- Caches YouTube highlight/live stream data.
-- Refreshed every 2 hours automatically.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.youtube_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  video_id TEXT,
  video_title TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ─── Table 4: youtube_channels ──────────────────────────────
-- Master list of YouTube channels to monitor.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.youtube_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert placeholder YouTube channels (replace with real IDs)
-- Only inserts if table is empty to avoid duplicates on re-run
INSERT INTO public.youtube_channels
  (channel_id, channel_name, display_order)
SELECT * FROM (VALUES
  ('CHANNEL_ID_1', 'Channel Name 1', 1),
  ('CHANNEL_ID_2', 'Channel Name 2', 2),
  ('CHANNEL_ID_3', 'Channel Name 3', 3),
  ('CHANNEL_ID_4', 'Channel Name 4', 4),
  ('CHANNEL_ID_5', 'Channel Name 5', 5),
  ('CHANNEL_ID_6', 'Channel Name 6', 6)
) AS v(channel_id, channel_name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.youtube_channels LIMIT 1);
