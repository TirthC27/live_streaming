-- ============================================================
-- StreamX — Supabase Database Setup
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─── Table 1: stream_config ─────────────────────────────────
-- Stores the active and secondary stream URLs.
-- Only ever 1 row in this table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE stream_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  active_url TEXT NOT NULL,
  secondary_url TEXT,
  active_url_label TEXT DEFAULT 'Main Stream',
  secondary_url_label TEXT DEFAULT 'Backup Stream',
  active_url_updated_at TIMESTAMPTZ DEFAULT now(),
  secondary_url_updated_at TIMESTAMPTZ,
  updated_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row (only ever 1 row)
INSERT INTO stream_config (
  active_url,
  secondary_url,
  active_url_label,
  secondary_url_label
) VALUES (
  'https://your-default-stream.m3u8',
  NULL,
  'Main Stream',
  'Backup Stream'
);


-- ─── Table 2: youtube_cache ─────────────────────────────────
-- Caches YouTube live stream data per channel.
-- Refreshed every 2 hours automatically.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE youtube_cache (
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


-- ─── Table 3: youtube_channels ──────────────────────────────
-- Master list of YouTube channels to monitor.
-- display_order controls the sort order on the frontend.
-- is_active allows disabling a channel without deleting it.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE youtube_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert your 6 YouTube channels
-- ⚠️  REPLACE the CHANNEL_ID_* and Channel Name values with real data!
INSERT INTO youtube_channels
  (channel_id, channel_name, display_order) VALUES
  ('CHANNEL_ID_1', 'Channel Name 1', 1),
  ('CHANNEL_ID_2', 'Channel Name 2', 2),
  ('CHANNEL_ID_3', 'Channel Name 3', 3),
  ('CHANNEL_ID_4', 'Channel Name 4', 4),
  ('CHANNEL_ID_5', 'Channel Name 5', 5),
  ('CHANNEL_ID_6', 'Channel Name 6', 6);
