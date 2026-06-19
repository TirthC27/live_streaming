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

// GET /stream/index.m3u8
app.get('/stream/index.m3u8', async (req, res) => {
  try {
    // Read stream URL from Supabase
    const config = await streamService.getStreamConfig();
    const currentStreamUrl = config.activeUrl;

    if (!currentStreamUrl) {
      return res.status(500).json({ error: 'Stream URL not configured in database' });
    }

    const response = await axios.get(currentStreamUrl, {
      headers: {
        'Referer': 'https://executeandship.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'text',
      timeout: 10000
    });

    let m3u8Content = response.data;

    // Determine base URL from the source URL
    const baseUrl = currentStreamUrl.substring(0, currentStreamUrl.lastIndexOf('/') + 1);

    // Rewrite segment URLs
    const lines = m3u8Content.split('\n');
    const rewrittenLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') return line;

      let absoluteUrl;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        absoluteUrl = trimmed;
      } else {
        absoluteUrl = baseUrl + trimmed;
      }

      return `/stream/segment?url=${encodeURIComponent(absoluteUrl)}`;
    });

    const modifiedM3u8 = rewrittenLines.join('\n');

    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    });

    res.send(modifiedM3u8);
  } catch (error) {
    console.error('Error fetching m3u8:', error.message);
    res.status(502).json({ error: 'Failed to fetch stream manifest', details: error.message });
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
      headers: {
        'Referer': 'https://executeandship.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
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

    if (!url.includes('.m3u8')) {
      return res.status(400).json({ error: 'URL must be a valid .m3u8 stream URL', success: false });
    }

    const updatedConfig = await streamService.updateActiveUrl(url.trim(), label || 'Main Stream');
    res.json({ success: true, updatedConfig });
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

    if (!url.includes('.m3u8')) {
      return res.status(400).json({ error: 'URL must be a valid .m3u8 stream URL', success: false });
    }

    const updatedConfig = await streamService.updateSecondaryUrl(url.trim(), label || 'Backup Stream');
    res.json({ success: true, updatedConfig });
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
    if (!activeUrl || !activeUrl.includes('.m3u8')) {
      return res.status(400).json({ error: 'Active URL must be a valid .m3u8 stream URL', success: false });
    }

    // Validate secondary URL
    if (!secondaryUrl || !secondaryUrl.includes('.m3u8')) {
      return res.status(400).json({ error: 'Secondary URL must be a valid .m3u8 stream URL', success: false });
    }

    const updatedConfig = await streamService.updateBothUrls(
      activeUrl.trim(),
      secondaryUrl.trim(),
      activeLabel || 'Main Stream',
      secondaryLabel || 'Backup Stream'
    );
    res.json({ success: true, updatedConfig });
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

    const response = await axios.get(streamUrl, {
      headers: {
        'Referer': 'https://executeandship.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'text',
      timeout: 5000
    });

    if (response.status === 200) {
      res.json({
        status: 'live',
        url: streamUrl
      });
    } else {
      res.json({
        status: 'offline',
        error: `Unexpected status code: ${response.status}`
      });
    }
  } catch (error) {
    res.json({
      status: 'offline',
      error: error.message
    });
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
  console.log(`   Database:  Supabase\n`);
});
