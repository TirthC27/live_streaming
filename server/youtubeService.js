const supabase = require('./supabase');
const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Get YouTube links — serves from cache if fresh, otherwise fetches from YouTube API.
 */
async function getYoutubeLinks() {
  try {
    // STEP 1: Check cache
    const { data: cachedRows, error: cacheError } = await supabase
      .from('youtube_cache')
      .select('*')
      .order('channel_name', { ascending: true });

    if (cacheError) {
      console.error('❌ Error reading youtube_cache:', cacheError.message);
    }

    // If we have cached rows, check if ALL are fresh (within 2 hours)
    if (cachedRows && cachedRows.length > 0) {
      const now = Date.now();
      const allFresh = cachedRows.every((row) => {
        const fetchedAt = new Date(row.fetched_at).getTime();
        return now - fetchedAt < CACHE_DURATION_MS;
      });

      if (allFresh) {
        console.log('📦 Serving YouTube links from cache');
        const oldestFetch = Math.min(...cachedRows.map((r) => new Date(r.fetched_at).getTime()));
        return {
          links: formatLinks(cachedRows),
          cached: true,
          fetchedAt: new Date(oldestFetch).toISOString(),
          nextRefreshAt: new Date(oldestFetch + CACHE_DURATION_MS).toISOString(),
        };
      }
    }

    // STEP 2: Cache is stale or empty — fetch fresh from YouTube
    console.log('🔄 Cache stale — fetching fresh YouTube data...');
    return await fetchAndCacheYoutubeData();
  } catch (err) {
    console.error('❌ getYoutubeLinks error:', err.message);
    throw err;
  }
}

/**
 * Force refresh — always fetches fresh data from YouTube API, skipping cache check.
 */
async function forceRefreshYoutube() {
  console.log('🔄 Force refreshing YouTube data...');
  return await fetchAndCacheYoutubeData();
}

/**
 * Core function: fetches live status from YouTube Data API v3 for all active channels,
 * upserts results into youtube_cache, and returns the fresh data.
 */
async function fetchAndCacheYoutubeData() {
  try {
    // Fetch active channels from youtube_channels table
    const { data: channels, error: channelsError } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(6);

    if (channelsError) {
      console.error('❌ Error fetching youtube_channels:', channelsError.message);
      throw new Error('Failed to fetch YouTube channels');
    }

    if (!channels || channels.length === 0) {
      console.warn('⚠️ No active YouTube channels configured');
      return {
        links: [],
        cached: false,
        fetchedAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString(),
      };
    }

    // Fetch live status for each channel (parallel, with per-channel error handling)
    const results = await Promise.all(
      channels.map(async (channel) => {
        try {
          return await fetchChannelLiveStatus(channel);
        } catch (err) {
          console.error(`❌ Failed to fetch channel ${channel.channel_name} (${channel.channel_id}):`, err.message);
          // Return offline status if individual channel fails
          return {
            channel_id: channel.channel_id,
            channel_name: channel.channel_name,
            video_id: null,
            video_title: null,
            video_url: null,
            thumbnail_url: null,
            is_live: false,
            fetched_at: new Date().toISOString(),
          };
        }
      })
    );

    // STEP 3: Save to database (upsert on channel_id)
    const { data: upsertedData, error: upsertError } = await supabase
      .from('youtube_cache')
      .upsert(results, { onConflict: 'channel_id' })
      .select();

    if (upsertError) {
      console.error('❌ Error upserting youtube_cache:', upsertError.message);
      // Still return the results even if upsert failed
    }

    const finalData = upsertedData || results;
    const now = new Date().toISOString();

    console.log(`✅ YouTube data refreshed: ${finalData.filter((r) => r.is_live).length}/${finalData.length} channels live`);

    return {
      links: formatLinks(finalData),
      cached: false,
      fetchedAt: now,
      nextRefreshAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString(),
    };
  } catch (err) {
    console.error('❌ fetchAndCacheYoutubeData error:', err.message);
    throw err;
  }
}

/**
 * Fetch live status for a single YouTube channel using the YouTube Data API v3.
 */
async function fetchChannelLiveStatus(channel) {
  if (!YOUTUBE_API_KEY) {
    console.warn('⚠️ YOUTUBE_API_KEY not configured — marking channel as offline');
    return {
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      video_id: null,
      video_title: null,
      video_url: null,
      thumbnail_url: null,
      is_live: false,
      fetched_at: new Date().toISOString(),
    };
  }

  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      channelId: channel.channel_id,
      eventType: 'live',
      type: 'video',
      key: YOUTUBE_API_KEY,
    },
    timeout: 10000,
  });

  const items = response.data.items;

  if (items && items.length > 0) {
    const liveVideo = items[0];
    const videoId = liveVideo.id.videoId;
    const snippet = liveVideo.snippet;

    return {
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      video_id: videoId,
      video_title: snippet.title,
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail_url:
        snippet.thumbnails.high?.url ||
        snippet.thumbnails.medium?.url ||
        snippet.thumbnails.default?.url ||
        null,
      is_live: true,
      fetched_at: new Date().toISOString(),
    };
  }

  // No live video found
  return {
    channel_id: channel.channel_id,
    channel_name: channel.channel_name,
    video_id: null,
    video_title: null,
    video_url: null,
    thumbnail_url: null,
    is_live: false,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Format raw database rows into a consistent API response format.
 */
function formatLinks(rows) {
  return rows.map((row) => ({
    channelId: row.channel_id,
    channelName: row.channel_name,
    videoId: row.video_id,
    videoTitle: row.video_title,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    isLive: row.is_live,
    fetchedAt: row.fetched_at,
  }));
}

module.exports = {
  getYoutubeLinks,
  forceRefreshYoutube,
};
