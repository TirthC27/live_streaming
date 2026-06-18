require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== URL Persistence =====
const URL_FILE = path.join(__dirname, 'stream-url.json');
let currentStreamUrl = '';
let urlSource = 'env';
let lastUpdatedAt = new Date().toISOString();

// Load URL on startup
function loadStreamUrl() {
  try {
    if (fs.existsSync(URL_FILE)) {
      const data = JSON.parse(fs.readFileSync(URL_FILE, 'utf8'));
      if (data.url) {
        currentStreamUrl = data.url;
        lastUpdatedAt = data.updatedAt || new Date().toISOString();
        urlSource = 'file';
        console.log('✅ Loaded stream URL from saved file');
        console.log(`   URL: ${currentStreamUrl.substring(0, 60)}...`);
        return;
      }
    }
  } catch (err) {
    console.error('⚠️ Error reading stream-url.json:', err.message);
  }

  // Fallback to env variable
  currentStreamUrl = process.env.STREAM_SOURCE_URL || '';
  urlSource = 'env';
  console.log('📦 Loaded stream URL from .env');
  if (currentStreamUrl) {
    console.log(`   URL: ${currentStreamUrl.substring(0, 60)}...`);
  } else {
    console.warn('⚠️ No STREAM_SOURCE_URL configured!');
  }
}

function saveStreamUrl(url) {
  const data = {
    url: url,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(URL_FILE, JSON.stringify(data, null, 2), 'utf8');
  lastUpdatedAt = data.updatedAt;
  urlSource = 'file';
}

// Load URL on startup
loadStreamUrl();

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
    hasStreamUrl: !!currentStreamUrl
  });
});

// ===== Stream Proxy Routes =====

// GET /stream/index.m3u8
app.get('/stream/index.m3u8', async (req, res) => {
  try {
    if (!currentStreamUrl) {
      return res.status(500).json({ error: 'STREAM_SOURCE_URL not configured' });
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

// ===== Admin Routes =====

// GET /admin/stream-url — Get current stream URL
app.get('/admin/stream-url', requireAdmin, (req, res) => {
  res.json({
    url: currentStreamUrl,
    updatedAt: lastUpdatedAt,
    source: urlSource
  });
});

// POST /admin/update-url — Update stream URL
app.post('/admin/update-url', (req, res) => {
  try {
    const { secret, url } = req.body;

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

    // Update in memory
    currentStreamUrl = url.trim();

    // Persist to file
    saveStreamUrl(currentStreamUrl);

    console.log(`✅ Stream URL updated via admin API`);
    console.log(`   New URL: ${currentStreamUrl.substring(0, 60)}...`);

    res.json({
      success: true,
      message: 'URL updated successfully'
    });
  } catch (error) {
    console.error('Error updating URL:', error.message);
    res.status(500).json({ error: 'Failed to update URL', success: false });
  }
});

// GET /admin/check-status — Check if stream is live
app.get('/admin/check-status', requireAdmin, async (req, res) => {
  try {
    if (!currentStreamUrl) {
      return res.json({ status: 'offline', error: 'No stream URL configured' });
    }

    const response = await axios.get(currentStreamUrl, {
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
        url: currentStreamUrl
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

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`\n🚀 StreamX Proxy Server running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Stream:  http://localhost:${PORT}/stream/index.m3u8`);
  console.log(`   Admin:   http://localhost:${PORT}/admin/stream-url\n`);
});
