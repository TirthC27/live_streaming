require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'StreamX Proxy Server Running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// GET /stream/index.m3u8
// Fetches the real m3u8 from STREAM_SOURCE_URL env variable
// Adds Referer header: https://executeandship.com/
// Rewrites all .ts segment URLs to point to /stream/segment?url=ENCODED_URL
// Returns modified m3u8 with correct content-type
app.get('/stream/index.m3u8', async (req, res) => {
  try {
    const sourceUrl = process.env.STREAM_SOURCE_URL;
    if (!sourceUrl) {
      return res.status(500).json({ error: 'STREAM_SOURCE_URL not configured' });
    }

    const response = await axios.get(sourceUrl, {
      headers: {
        'Referer': 'https://executeandship.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'text',
      timeout: 10000
    });

    let m3u8Content = response.data;

    // Determine base URL from the source URL
    const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf('/') + 1);

    // Rewrite .ts segment URLs
    // Handle both absolute and relative URLs
    const lines = m3u8Content.split('\n');
    const rewrittenLines = lines.map(line => {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') return line;

      // This is a segment URL (could be .ts or another .m3u8 for multi-bitrate)
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
// Decodes the url param
// Fetches the .ts segment from the real CDN
// Adds Referer header
// Pipes the response directly to client
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

    // Forward content-type from upstream
    const contentType = response.headers['content-type'] || 'video/mp2t';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    // Pipe the stream data directly
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching segment:', error.message);
    res.status(502).json({ error: 'Failed to fetch stream segment', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`StreamX Proxy Server running on port ${PORT}`);
});
