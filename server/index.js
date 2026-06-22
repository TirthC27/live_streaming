require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const streamService = require('./streamService');
const youtubeService = require('./youtubeService');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== Auth Middleware =====
function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ===== Health Check =====
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'StreamX Proxy Server Running' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'supabase',
    streamConfig: 'loaded',
  });
});

// ===== Stream Proxy Routes =====

const STREAM_HEADERS = {
  'Referer': process.env.STREAM_REFERER || 'https://executeandship.com/',
  'User-Agent': process.env.STREAM_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function getFinalResponseUrl(response, fallbackUrl) {
  return response?.request?.res?.responseUrl || response?.request?._redirectable?._currentUrl || fallbackUrl;
}

function urlsDiffer(a, b) {
  if (!a || !b) return false;
  return a.replace(/\/$/, '') !== b.replace(/\/$/, '');
}

function getProxyUrlForAsset(assetUrl, forcePlaylist = false) {
  const lower = assetUrl.split('?')[0].toLowerCase();
  const route = forcePlaylist || lower.endsWith('.m3u8') ? '/stream/playlist' : '/stream/segment';
  return `${route}?url=${encodeURIComponent(assetUrl)}`;
}

function rewriteUriAttribute(line, baseUrl) {
  return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
    try {
      const absoluteUrl = new URL(uri, baseUrl).href;
      const forcePlaylist = line.trim().startsWith('#EXT-X-MEDIA') || line.trim().startsWith('#EXT-X-I-FRAME-STREAM-INF');
      return `URI="${getProxyUrlForAsset(absoluteUrl, forcePlaylist)}"`;
    } catch (e) {
      return `URI="${uri}"`;
    }
  });
}

function rewriteM3u8Content(m3u8Content, baseUrl) {
  let nextUriIsPlaylist = false;

  return m3u8Content.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed === '') return line;

    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI="')) {
        return rewriteUriAttribute(line, baseUrl);
      }
      nextUriIsPlaylist = trimmed.startsWith('#EXT-X-STREAM-INF');
      return line;
    }

    try {
      const absoluteUrl = new URL(trimmed, baseUrl).href;
      const rewrittenUrl = getProxyUrlForAsset(absoluteUrl, nextUriIsPlaylist);
      nextUriIsPlaylist = false;
      return rewrittenUrl;
    } catch (e) {
      nextUriIsPlaylist = false;
      return line;
    }
  }).join('\n');
}

async function inspectStreamUrl(inputUrl) {
  const trimmedUrl = (inputUrl || '').trim();

  if (!isHttpUrl(trimmedUrl)) {
    return {
      inputUrl: trimmedUrl,
      finalUrl: null,
      redirected: false,
      contentType: null,
      isHls: false,
      strategy: 'unsupported',
      error: 'URL must be a valid http or https URL',
    };
  }

  try {
    const response = await axios.get(trimmedUrl, {
      headers: STREAM_HEADERS,
      responseType: 'text',
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const finalUrl = getFinalResponseUrl(response, trimmedUrl);
    const contentType = response.headers['content-type'] || '';
    const body = typeof response.data === 'string' ? response.data : '';
    const isHls = response.status === 200 && (
      body.includes('#EXTM3U') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl')
    );
    const redirected = urlsDiffer(trimmedUrl, finalUrl);

    return {
      inputUrl: trimmedUrl,
      finalUrl,
      redirected,
      contentType,
      isHls,
      strategy: isHls ? (redirected ? 'redirected' : 'direct') : 'unsupported',
      statusCode: response.status,
      error: isHls ? null : `Upstream did not return a valid HLS manifest. Status: ${response.status}`,
    };
  } catch (error) {
    return {
      inputUrl: trimmedUrl,
      finalUrl: null,
      redirected: false,
      contentType: null,
      isHls: false,
      strategy: 'unsupported',
      statusCode: error.response?.status || null,
      error: error.message,
    };
  }
}

/**
 * Shared helper: fetch a remote .m3u8 URL, rewrite all segment
 * paths to go through /stream/segment, and send the result.
 */
async function proxyM3u8(sourceUrl, res) {
  const response = await axios.get(sourceUrl, {
    headers: STREAM_HEADERS,
    responseType: 'text',
    timeout: 10000,
  });

  const m3u8Content = response.data;
  const finalUrl = getFinalResponseUrl(response, sourceUrl);
  const rewrittenContent = rewriteM3u8Content(m3u8Content, finalUrl);

  res.set({
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
  });

  res.send(rewrittenContent);
}

function getCandidateStreamUrls(config, streamType) {
  const isSecondary = streamType === 'secondary';
  const originalUrl = isSecondary ? config.secondaryUrl : config.activeUrl;
  const resolvedUrl = isSecondary ? config.secondaryResolvedUrl : config.activeResolvedUrl;
  const strategy = isSecondary ? config.secondaryStreamStrategy : config.activeStreamStrategy;

  const candidates = [];
  if (strategy === 'redirected' && resolvedUrl) {
    candidates.push(resolvedUrl);
  }
  if (originalUrl && !candidates.includes(originalUrl)) {
    candidates.push(originalUrl);
  }
  return candidates;
}

async function proxyStreamWithFallback(config, streamType, res) {
  const candidates = getCandidateStreamUrls(config, streamType);
  let lastError;

  for (const candidate of candidates) {
    try {
      await proxyM3u8(candidate, res);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Error fetching ${streamType} m3u8 candidate:`, error.message);
    }
  }

  throw lastError || new Error(`No ${streamType} stream URL configured`);
}

// GET /stream/config — Public: returns stream labels so the client knows what to display
app.get('/stream/config', async (req, res) => {
  try {
    const config = await streamService.getStreamConfig();
    res.json({
      primary: {
        label: config.activeUrlLabel || 'Main Stream',
        available: !!config.activeUrl,
      },
      secondary: {
        label: config.secondaryUrlLabel || 'Backup Stream',
        available: !!config.secondaryUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching stream config:', error.message);
    res.status(500).json({ error: 'Failed to fetch stream config' });
  }
});

// GET /stream/index.m3u8 — Primary stream proxy
app.get('/stream/index.m3u8', async (req, res) => {
  try {
    const config = await streamService.getStreamConfig();

    if (!config.activeUrl) {
      return res.status(500).json({ error: 'Primary stream URL not configured in database' });
    }

    await proxyStreamWithFallback(config, 'primary', res);
  } catch (error) {
    console.error('Error fetching primary m3u8:', error.message);
    res.status(502).json({ error: 'Failed to fetch primary stream manifest', details: error.message });
  }
});

// GET /stream/secondary.m3u8 — Secondary stream proxy
app.get('/stream/secondary.m3u8', async (req, res) => {
  try {
    const config = await streamService.getStreamConfig();

    if (!config.secondaryUrl) {
      return res.status(404).json({ error: 'Secondary stream URL not configured in database' });
    }

    await proxyStreamWithFallback(config, 'secondary', res);
  } catch (error) {
    console.error('Error fetching secondary m3u8:', error.message);
    res.status(502).json({ error: 'Failed to fetch secondary stream manifest', details: error.message });
  }
});

// GET /stream/playlist?url=ENCODED_PLAYLIST_URL
app.get('/stream/playlist', async (req, res) => {
  try {
    const playlistUrl = req.query.url;
    if (!playlistUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    await proxyM3u8(decodeURIComponent(playlistUrl), res);
  } catch (error) {
    console.error('Error fetching playlist:', error.message);
    res.status(502).json({ error: 'Failed to fetch stream playlist', details: error.message });
  }
});

// GET /stream/segment?url=ENCODED_SEGMENT_URL
app.get('/stream/segment', async (req, res) => {
  try {
    const segmentUrl = req.query.url;
    if (!segmentUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const decodedUrl = decodeURIComponent(segmentUrl);

    const response = await axios.get(decodedUrl, {
      headers: STREAM_HEADERS,
      responseType: 'stream',
      timeout: 15000
    });

    const contentType = response.headers['content-type'] || 'video/mp2t';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching segment:', error.message);
    res.status(502).json({ error: 'Failed to fetch stream segment', details: error.message });
  }
});

// ===== Admin Routes — Stream Config =====

// GET /admin/stream-config — Get full stream config from Supabase
app.get('/admin/stream-config', requireAdmin, async (req, res) => {
  try {
    const config = await streamService.getStreamConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting stream config:', error.message);
    res.status(500).json({ error: 'Failed to fetch stream config' });
  }
});

// POST /admin/update-active-url — Update active stream URL
app.post('/admin/update-active-url', async (req, res) => {
  try {
    const { secret, url, label } = req.body;

    // Validate secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    // Validate URL
    if (!url || url.trim() === '') {
      return res.status(400).json({ error: 'URL is required', success: false });
    }

    if (!isHttpUrl(url.trim())) {
      return res.status(400).json({ error: 'URL must be a valid http or https stream URL', success: false });
    }

    const inspection = await inspectStreamUrl(url);
    const updatedConfig = await streamService.updateActiveUrl(url.trim(), label || 'Main Stream', inspection);
    res.json({ success: true, updatedConfig, inspection });
  } catch (error) {
    console.error('Error updating active URL:', error.message);
    res.status(500).json({ error: 'Failed to update active URL', success: false });
  }
});

// POST /admin/update-secondary-url — Update secondary stream URL
app.post('/admin/update-secondary-url', async (req, res) => {
  try {
    const { secret, url, label } = req.body;

    // Validate secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    // Validate URL
    if (!url || url.trim() === '') {
      return res.status(400).json({ error: 'URL is required', success: false });
    }

    if (!isHttpUrl(url.trim())) {
      return res.status(400).json({ error: 'URL must be a valid http or https stream URL', success: false });
    }

    const inspection = await inspectStreamUrl(url);
    const updatedConfig = await streamService.updateSecondaryUrl(url.trim(), label || 'Backup Stream', inspection);
    res.json({ success: true, updatedConfig, inspection });
  } catch (error) {
    console.error('Error updating secondary URL:', error.message);
    res.status(500).json({ error: 'Failed to update secondary URL', success: false });
  }
});

// POST /admin/update-both-urls — Update both stream URLs
app.post('/admin/update-both-urls', async (req, res) => {
  try {
    const { secret, activeUrl, secondaryUrl, activeLabel, secondaryLabel } = req.body;

    // Validate secret
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    // Validate active URL
    if (!activeUrl || !isHttpUrl(activeUrl.trim())) {
      return res.status(400).json({ error: 'Active URL must be a valid http or https stream URL', success: false });
    }

    // Validate secondary URL
    if (!secondaryUrl || !isHttpUrl(secondaryUrl.trim())) {
      return res.status(400).json({ error: 'Secondary URL must be a valid http or https stream URL', success: false });
    }

    const activeInspection = await inspectStreamUrl(activeUrl);
    const secondaryInspection = await inspectStreamUrl(secondaryUrl);
    const updatedConfig = await streamService.updateBothUrls(
      activeUrl.trim(),
      secondaryUrl.trim(),
      activeLabel || 'Main Stream',
      secondaryLabel || 'Backup Stream',
      activeInspection,
      secondaryInspection
    );
    res.json({ success: true, updatedConfig, inspection: { active: activeInspection, secondary: secondaryInspection } });
  } catch (error) {
    console.error('Error updating both URLs:', error.message);
    res.status(500).json({ error: 'Failed to update both URLs', success: false });
  }
});

// ===== Admin Routes — Stream Status =====

// GET /admin/check-status — Check if a stream URL is live
app.get('/admin/check-status', requireAdmin, async (req, res) => {
  try {
    const urlToCheck = req.query.url;
    let streamUrl;

    if (urlToCheck) {
      streamUrl = decodeURIComponent(urlToCheck);
    } else {
      const config = await streamService.getStreamConfig();
      streamUrl = config.activeUrl;
    }

    if (!streamUrl) {
      return res.json({ status: 'offline', error: 'No stream URL configured' });
    }

    const inspection = await inspectStreamUrl(streamUrl);

    res.json({
      status: inspection.isHls ? 'live' : 'offline',
      url: streamUrl,
      inspection,
    });
  } catch (error) {
    res.json({
      status: 'offline',
      error: error.message
    });
  }
});

// POST /admin/recheck-stream-url â€” Refresh stored resolved URL metadata
app.post('/admin/recheck-stream-url', async (req, res) => {
  try {
    const { secret, stream = 'active' } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const config = await streamService.getStreamConfig();
    const target = stream === 'secondary' ? 'secondary' : 'active';
    const streamUrl = target === 'secondary' ? config.secondaryUrl : config.activeUrl;

    if (!streamUrl) {
      return res.status(404).json({ error: `${target} stream URL not configured`, success: false });
    }

    const inspection = await inspectStreamUrl(streamUrl);
    const updatedConfig = target === 'secondary'
      ? await streamService.updateSecondaryInspection(inspection)
      : await streamService.updateActiveInspection(inspection);

    res.json({ success: true, stream: target, updatedConfig, inspection });
  } catch (error) {
    console.error('Error rechecking stream URL:', error.message);
    res.status(500).json({ error: 'Failed to recheck stream URL', success: false });
  }
});

// ===== YouTube Routes =====

// GET /matches/youtube-links — Public route, returns YouTube links with cache info
app.get('/matches/youtube-links', async (req, res) => {
  try {
    const result = await youtubeService.getYoutubeLinks();
    res.json(result);
  } catch (error) {
    console.error('Error fetching YouTube links:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube links', links: [], cached: false });
  }
});

// POST /admin/refresh-youtube — Force refresh YouTube cache
app.post('/admin/refresh-youtube', requireAdmin, async (req, res) => {
  try {
    const result = await youtubeService.forceRefreshYoutube();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error refreshing YouTube cache:', error.message);
    res.status(500).json({ error: 'Failed to refresh YouTube cache', success: false });
  }
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`\n🚀 StreamX Proxy Server running on port ${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Stream:    http://localhost:${PORT}/stream/index.m3u8`);
  console.log(`   Config:    http://localhost:${PORT}/admin/stream-config`);
  console.log(`   YouTube:   http://localhost:${PORT}/matches/youtube-links`);
  console.log(`   Database:  Supabase`);
  console.log(`   Stream 1:  http://localhost:${PORT}/stream/index.m3u8`);
  console.log(`   Stream 2:  http://localhost:${PORT}/stream/secondary.m3u8`);
  console.log(`   Cfg:       http://localhost:${PORT}/stream/config\n`);
});

