require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const channelService = require('./services/channelService');
const scheduleService = require('./services/scheduleService');
const hlsProxyService = require('./services/hlsProxyService');
const transcoderService = require('./services/transcoderService');
const youtubeService = require('./services/youtubeService');
const requireAdmin = require('./middleware/adminAuth');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────

const allowedOrigins = [
  'https://hifootball.dpdns.org',
  'https://hifootball.gigzo.club',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Proxy secret middleware — validates x-proxy-secret on all routes
app.use((req, res, next) => {
  // Skip proxy secret check if not configured (local dev)
  if (!process.env.PROXY_SECRET) return next();
  const secret = req.headers['x-proxy-secret'];
  if (secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// ─── Stream URL inspection helper ────────────────────────────

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

async function inspectStreamUrl(inputUrl) {
  const trimmedUrl = (inputUrl || '').trim();
  if (!isHttpUrl(trimmedUrl)) {
    return {
      inputUrl: trimmedUrl, finalUrl: null, redirected: false,
      contentType: null, isHls: false, strategy: 'unsupported',
      error: 'URL must be a valid http or https URL',
    };
  }

  try {
    const response = await axios.get(trimmedUrl, {
      headers: hlsProxyService.STREAM_HEADERS,
      responseType: 'text',
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const finalUrl = hlsProxyService.getFinalResponseUrl(response, trimmedUrl);
    const contentType = response.headers['content-type'] || '';
    const body = typeof response.data === 'string' ? response.data : '';
    const isHls = response.status === 200 && (
      body.includes('#EXTM3U') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl')
    );
    const redirected = finalUrl && trimmedUrl.replace(/\/$/, '') !== finalUrl.replace(/\/$/, '');

    return {
      inputUrl: trimmedUrl, finalUrl, redirected, contentType, isHls,
      strategy: isHls ? (redirected ? 'redirected' : 'direct') : 'unsupported',
      statusCode: response.status,
      error: isHls ? null : `Upstream did not return a valid HLS manifest. Status: ${response.status}`,
    };
  } catch (error) {
    return {
      inputUrl: trimmedUrl, finalUrl: null, redirected: false,
      contentType: null, isHls: false, strategy: 'unsupported',
      statusCode: error.response?.status || null, error: error.message,
    };
  }
}


// ═════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'StreamX Proxy Server Running' });
});

app.get('/health', async (req, res) => {
  try {
    const channels = await channelService.getAllChannels();
    const activeStreams = channels.filter(c => c.isActive).length;
    const transcodingStatus = transcoderService.getTranscodingStatus();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'supabase',
      channels: channels.length,
      activeStreams,
      transcoding: Object.keys(transcodingStatus).length,
    });
  } catch (error) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error.message,
    });
  }
});


// ═════════════════════════════════════════════════════════════
// STREAM PROXY ROUTES (public)
// ═════════════════════════════════════════════════════════════

// GET /stream/:channelKey/index.m3u8 — Main HLS proxy (schedule-gated)
app.get('/stream/:channelKey/index.m3u8', async (req, res) => {
  try {
    await hlsProxyService.proxyM3u8(req.params.channelKey, req, res);
  } catch (error) {
    console.error('Error in stream proxy:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch stream manifest', details: error.message });
    }
  }
});

// GET /stream/:channelKey/variant?url=ENCODED — Variant playlist proxy (ABR)
app.get('/stream/:channelKey/variant', async (req, res) => {
  try {
    const variantUrl = req.query.url;
    if (!variantUrl) return res.status(400).json({ error: 'Missing url parameter' });
    await hlsProxyService.proxyVariantPlaylist(req.params.channelKey, variantUrl, req, res);
  } catch (error) {
    console.error('Error in variant proxy:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch variant playlist', details: error.message });
    }
  }
});

// GET /stream/:channelKey/segment?url=ENCODED — Segment proxy
app.get('/stream/:channelKey/segment', async (req, res) => {
  try {
    const segmentUrl = req.query.url;
    if (!segmentUrl) return res.status(400).json({ error: 'Missing url parameter' });
    await hlsProxyService.proxySegment(req.params.channelKey, segmentUrl, req, res);
  } catch (error) {
    console.error('Error in segment proxy:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch segment', details: error.message });
    }
  }
});


// ═════════════════════════════════════════════════════════════
// TRANSCODED STREAM ROUTES (public)
// ═════════════════════════════════════════════════════════════

// GET /transcoded/:channelKey/master.m3u8
app.get('/transcoded/:channelKey/master.m3u8', (req, res) => {
  const filePath = transcoderService.getTranscodedFilePath(req.params.channelKey, 'master.m3u8');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Transcoded stream not available' });
  }
  res.set({
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });
  res.sendFile(filePath);
});

// GET /transcoded/:channelKey/:quality.m3u8 (e.g. 1080p.m3u8, 720p.m3u8)
app.get('/transcoded/:channelKey/:quality.m3u8', (req, res) => {
  const filename = `${req.params.quality}.m3u8`;
  const filePath = transcoderService.getTranscodedFilePath(req.params.channelKey, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Quality variant not available' });
  }
  res.set({
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });
  res.sendFile(filePath);
});

// GET /transcoded/:channelKey/:segment.ts
app.get('/transcoded/:channelKey/:segment.ts', (req, res) => {
  const filename = `${req.params.segment}.ts`;
  const filePath = transcoderService.getTranscodedFilePath(req.params.channelKey, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Segment not available' });
  }
  res.set({
    'Content-Type': 'video/mp2t',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  res.sendFile(filePath);
});


// ═════════════════════════════════════════════════════════════
// CHANNEL & MATCH ROUTES (public)
// ═════════════════════════════════════════════════════════════

// GET /channels — All channels with schedule info
app.get('/channels', async (req, res) => {
  try {
    const channels = await channelService.getAllChannels();
    const allMatches = await scheduleService.getScheduledMatches();

    // Attach schedule info to each channel
    const enriched = channels.map(ch => {
      const channelMatches = allMatches.filter(m => m.channel?.channelKey === ch.channelKey);
      const liveMatch = channelMatches.find(m => m.isStreamOpen);
      const nextMatch = channelMatches.find(m => m.isUpcoming);
      return {
        ...ch,
        liveMatch: liveMatch || null,
        nextMatch: nextMatch || null,
        isTranscoding: transcoderService.isTranscoding(ch.channelKey),
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// GET /channels/:channelKey — Single channel with schedule info
app.get('/channels/:channelKey', async (req, res) => {
  try {
    const channel = await channelService.getChannelByKey(req.params.channelKey);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const allMatches = await scheduleService.getScheduledMatches();
    const channelMatches = allMatches.filter(m => m.channel?.channelKey === channel.channelKey);
    const liveMatch = channelMatches.find(m => m.isStreamOpen);
    const nextMatch = channelMatches.find(m => m.isUpcoming);

    res.json({
      ...channel,
      liveMatch: liveMatch || null,
      nextMatch: nextMatch || null,
      isTranscoding: transcoderService.isTranscoding(channel.channelKey),
      matches: channelMatches,
    });
  } catch (error) {
    console.error('Error fetching channel:', error.message);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// GET /matches/live — Currently open streams
app.get('/matches/live', async (req, res) => {
  try {
    const matches = await scheduleService.getActiveMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching live matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

// GET /matches/upcoming — Upcoming scheduled matches
app.get('/matches/upcoming', async (req, res) => {
  try {
    const matches = await scheduleService.getUpcomingMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching upcoming matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming matches' });
  }
});

// GET /matches/all — All matches with status
app.get('/matches/all', async (req, res) => {
  try {
    const matches = await scheduleService.getScheduledMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching all matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /matches/youtube-links — YouTube highlight links (existing)
app.get('/matches/youtube-links', async (req, res) => {
  try {
    const result = await youtubeService.getYoutubeLinks();
    res.json(result);
  } catch (error) {
    console.error('Error fetching YouTube links:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube links', links: [], cached: false });
  }
});

// GET /stream/config — BACKWARDS COMPAT: returns config in old format
app.get('/stream/config', async (req, res) => {
  try {
    const channels = await channelService.getAllChannels();
    const ch1 = channels.find(c => c.channelKey === 'channel1');
    res.json({
      primary: {
        label: ch1?.activeUrlLabel || 'Main Stream',
        available: !!ch1?.activeUrl,
      },
      secondary: {
        label: ch1?.secondaryUrlLabel || 'Backup Stream',
        available: !!ch1?.secondaryUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching stream config:', error.message);
    res.status(500).json({ error: 'Failed to fetch stream config' });
  }
});


// ═════════════════════════════════════════════════════════════
// ADMIN ROUTES (require x-admin-secret header)
// ═════════════════════════════════════════════════════════════

// GET /admin/channels — All channels with full details
app.get('/admin/channels', requireAdmin, async (req, res) => {
  try {
    const channels = await channelService.getAllChannels();
    res.json(channels);
  } catch (error) {
    console.error('Error fetching admin channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// POST /admin/channels/:channelKey/update-url
app.post('/admin/channels/:channelKey/update-url', async (req, res) => {
  try {
    const { secret, activeUrl, secondaryUrl, activeLabel, secondaryLabel } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    // Validate URLs
    if (activeUrl && !isHttpUrl(activeUrl.trim())) {
      return res.status(400).json({ error: 'Active URL must be a valid http/https URL', success: false });
    }
    if (secondaryUrl && !isHttpUrl(secondaryUrl.trim())) {
      return res.status(400).json({ error: 'Secondary URL must be a valid http/https URL', success: false });
    }

    // Inspect URLs
    const activeInspection = activeUrl ? await inspectStreamUrl(activeUrl) : null;
    const secondaryInspection = secondaryUrl ? await inspectStreamUrl(secondaryUrl) : null;

    const labels = { activeLabel, secondaryLabel };
    const updatedChannel = await channelService.updateChannelUrl(
      req.params.channelKey,
      activeUrl?.trim() || undefined,
      secondaryUrl?.trim() || undefined,
      labels,
      activeInspection,
      secondaryInspection
    );

    res.json({
      success: true,
      updatedChannel,
      inspection: { active: activeInspection, secondary: secondaryInspection },
    });
  } catch (error) {
    console.error('Error updating channel URL:', error.message);
    res.status(500).json({ error: 'Failed to update channel URL', success: false });
  }
});

// POST /admin/channels/:channelKey/toggle
app.post('/admin/channels/:channelKey/toggle', async (req, res) => {
  try {
    const { secret, isActive } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const updatedChannel = await channelService.setChannelActive(req.params.channelKey, !!isActive);
    res.json({ success: true, updatedChannel });
  } catch (error) {
    console.error('Error toggling channel:', error.message);
    res.status(500).json({ error: 'Failed to toggle channel', success: false });
  }
});

// POST /admin/matches/create
app.post('/admin/matches/create', async (req, res) => {
  try {
    const { secret, ...matchData } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    if (!matchData.matchTitle) {
      return res.status(400).json({ error: 'matchTitle is required', success: false });
    }
    if (!matchData.scheduledStart) {
      return res.status(400).json({ error: 'scheduledStart is required', success: false });
    }

    const match = await scheduleService.createMatch(matchData);
    res.json({ success: true, match });
  } catch (error) {
    console.error('Error creating match:', error.message);
    res.status(500).json({ error: 'Failed to create match', success: false });
  }
});

// PUT /admin/matches/:id/update
app.put('/admin/matches/:id/update', async (req, res) => {
  try {
    const { secret, ...matchData } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const match = await scheduleService.updateMatch(req.params.id, matchData);
    res.json({ success: true, match });
  } catch (error) {
    console.error('Error updating match:', error.message);
    res.status(500).json({ error: 'Failed to update match', success: false });
  }
});

// DELETE /admin/matches/:id
app.delete('/admin/matches/:id', async (req, res) => {
  try {
    const { secret } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const result = await scheduleService.deleteMatch(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error deleting match:', error.message);
    res.status(500).json({ error: 'Failed to delete match', success: false });
  }
});

// POST /admin/refresh-youtube
app.post('/admin/refresh-youtube', requireAdmin, async (req, res) => {
  try {
    const result = await youtubeService.forceRefreshYoutube();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error refreshing YouTube cache:', error.message);
    res.status(500).json({ error: 'Failed to refresh YouTube cache', success: false });
  }
});

// POST /admin/transcode/start
app.post('/admin/transcode/start', async (req, res) => {
  try {
    const { secret, channelKey } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    if (!channelKey) {
      return res.status(400).json({ error: 'channelKey is required', success: false });
    }

    // Get the channel's active URL to use as source
    const channel = await channelService.getChannelByKey(channelKey);
    if (!channel) {
      return res.status(404).json({ error: `Channel '${channelKey}' not found`, success: false });
    }
    if (!channel.activeUrl) {
      return res.status(400).json({ error: `No active URL configured for channel '${channelKey}'`, success: false });
    }

    const result = transcoderService.startTranscoding(channelKey, channel.activeUrl);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error starting transcoding:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /admin/transcode/stop
app.post('/admin/transcode/stop', async (req, res) => {
  try {
    const { secret, channelKey } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    if (!channelKey) {
      return res.status(400).json({ error: 'channelKey is required', success: false });
    }

    const result = transcoderService.stopTranscoding(channelKey);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error stopping transcoding:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

// GET /admin/transcode/status
app.get('/admin/transcode/status', requireAdmin, async (req, res) => {
  try {
    const status = transcoderService.getTranscodingStatus();
    res.json({ status });
  } catch (error) {
    console.error('Error getting transcode status:', error.message);
    res.status(500).json({ error: 'Failed to get transcode status' });
  }
});

// GET /admin/check-status — Check if a stream URL is live
app.get('/admin/check-status', requireAdmin, async (req, res) => {
  try {
    const urlToCheck = req.query.url;
    const channelKey = req.query.channel;
    let streamUrl;

    if (urlToCheck) {
      streamUrl = decodeURIComponent(urlToCheck);
    } else if (channelKey) {
      const channel = await channelService.getChannelByKey(channelKey);
      streamUrl = channel?.activeUrl;
    }

    if (!streamUrl) {
      return res.json({ status: 'offline', error: 'No stream URL specified or configured' });
    }

    const inspection = await inspectStreamUrl(streamUrl);
    res.json({
      status: inspection.isHls ? 'live' : 'offline',
      url: streamUrl,
      inspection,
    });
  } catch (error) {
    res.json({ status: 'offline', error: error.message });
  }
});


// ═════════════════════════════════════════════════════════════
// START SERVER
// ═════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🚀 StreamX Proxy Server running on port ${PORT}`);
  console.log(`   Health:       http://localhost:${PORT}/health`);
  console.log(`   Channels:     http://localhost:${PORT}/channels`);
  console.log(`   Matches:      http://localhost:${PORT}/matches/all`);
  console.log(`   Stream:       http://localhost:${PORT}/stream/{channelKey}/index.m3u8`);
  console.log(`   Transcoded:   http://localhost:${PORT}/transcoded/{channelKey}/master.m3u8`);
  console.log(`   YouTube:      http://localhost:${PORT}/matches/youtube-links`);
  console.log(`   Admin:        http://localhost:${PORT}/admin/channels`);
  console.log(`   Database:     Supabase\n`);
});
