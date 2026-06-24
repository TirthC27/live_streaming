const supabase = require('./supabase');
const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const TARGET_COMPETITIONS = new Set([5930, 364, 192, 193, 7, 11, 25, 17, 16, 565, 573, 592, 579, 585, 588, 272]);

function getCompetitionPreference(competitionId) {
  if (competitionId === 5930) return 1;
  if (competitionId === 364) return 2;
  if (competitionId === 192) return 3;
  if ([7, 11, 25, 17, 16].includes(competitionId)) return 4;
  if (competitionId === 193) return 5;
  if ([565, 573, 592, 579, 585, 588].includes(competitionId)) return 6;
  if (competitionId === 272) return 7;
  return 8;
}

function getFormattedDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

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
 * Core function: fetches recent matches from 365scores, filters & sorts them,
 * searches YouTube for highlights, and caches results in Supabase.
 */
async function fetchAndCacheYoutubeData() {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startDate = getFormattedDate(sevenDaysAgo);
    const endDate = getFormattedDate(today);

    let games = [];
    try {
      const response = await axios.get('https://webws.365scores.com/web/games/allscores/', {
        params: {
          appTypeId: 5,
          langId: 1,
          timezoneName: 'Asia/Calcutta',
          userCountryId: 80,
          sports: 1,
          startDate,
          endDate,
          onlyMajorGames: 'true'
        },
        timeout: 10000
      });
      games = response.data.games || [];
    } catch (apiErr) {
      console.error('❌ Error fetching from 365scores:', apiErr.message);
    }

    const filteredMatches = games.filter(
      (game) => game && game.competitionId && TARGET_COMPETITIONS.has(game.competitionId)
    );

    const sortedMatches = filteredMatches.sort((a, b) => {
      const prefA = getCompetitionPreference(a.competitionId);
      const prefB = getCompetitionPreference(b.competitionId);
      if (prefA !== prefB) {
        return prefA - prefB;
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    const topMatches = sortedMatches.slice(0, 5);

    if (topMatches.length === 0) {
      console.warn('⚠️ No active matches found in the specified competitions');
      return {
        links: [],
        cached: false,
        fetchedAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString(),
      };
    }

    // Fetch highlights for each match in parallel
    const results = await Promise.all(
      topMatches.map(async (match) => {
        const homeTeam = match.homeCompetitor?.name || 'Home Team';
        const awayTeam = match.awayCompetitor?.name || 'Away Team';
        const matchId = match.id;
        const channelId = `match_${matchId}`;
        const channelName = `${homeTeam} vs ${awayTeam}`;

        try {
          if (!YOUTUBE_API_KEY) {
            console.warn('⚠️ YOUTUBE_API_KEY not configured — marking match highlights as offline');
            return {
              channel_id: channelId,
              channel_name: channelName,
              video_id: null,
              video_title: null,
              video_url: null,
              thumbnail_url: null,
              is_live: false,
              fetched_at: new Date().toISOString(),
            };
          }

          const query = `${homeTeam} vs ${awayTeam} highlights`;
          const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              part: 'snippet',
              q: query,
              type: 'video',
              maxResults: 1,
              key: YOUTUBE_API_KEY,
            },
            timeout: 10000,
          });

          const items = ytResponse.data.items;

          if (items && items.length > 0) {
            const video = items[0];
            const videoId = video.id.videoId;
            const snippet = video.snippet;

            return {
              channel_id: channelId,
              channel_name: channelName,
              video_id: videoId,
              video_title: snippet.title,
              video_url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail_url:
                snippet.thumbnails.maxres?.url ||
                snippet.thumbnails.high?.url ||
                snippet.thumbnails.medium?.url ||
                snippet.thumbnails.default?.url ||
                null,
              is_live: true,
              fetched_at: new Date().toISOString(),
            };
          }

          return {
            channel_id: channelId,
            channel_name: channelName,
            video_id: null,
            video_title: null,
            video_url: null,
            thumbnail_url: null,
            is_live: false,
            fetched_at: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`❌ Failed to fetch YouTube highlights for match ${channelName}:`, err.message);
          return {
            channel_id: channelId,
            channel_name: channelName,
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

    // Clear old cache entries to keep the table clean and avoid stale checks
    try {
      await supabase.from('youtube_cache').delete().neq('channel_id', '');
    } catch (delErr) {
      console.error('❌ Error clearing youtube_cache:', delErr.message);
    }

    // Save results to Supabase (upsert on conflict channel_id)
    const { data: upsertedData, error: upsertError } = await supabase
      .from('youtube_cache')
      .upsert(results, { onConflict: 'channel_id' })
      .select();

    if (upsertError) {
      console.error('❌ Error upserting youtube_cache:', upsertError.message);
    }

    const finalData = upsertedData || results;
    const now = new Date().toISOString();

    console.log(`✅ YouTube highlights refreshed: ${finalData.filter((r) => r.is_live).length}/${finalData.length} matches live`);

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
