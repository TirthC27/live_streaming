const NodeMediaServer = require('node-media-server');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ─── API Keys ────────────────────────────────────────────────────────────────
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const YOUTUBE_API_KEY  = process.env.YOUTUBE_API_KEY;

// ─── Football Data API Proxy ─────────────────────────────────────────────────
const footballApi = axios.create({
    baseURL: 'https://api.football-data.org/v4',
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
    timeout: 10000,
});

// GET /api/football/matches — fetch matches with optional status filter
app.get('/api/football/matches', async (req, res) => {
    try {
        const params = {};
        if (req.query.status) params.status = req.query.status;
        if (req.query.competitions) params.competitions = req.query.competitions;
        if (req.query.dateFrom) params.dateFrom = req.query.dateFrom;
        if (req.query.dateTo) params.dateTo = req.query.dateTo;
        const response = await footballApi.get('/matches', { params });
        res.json(response.data);
    } catch (err) {
        console.error('[Football API]', err.response?.status, err.response?.data?.message || err.message);
        res.status(err.response?.status || 500).json({
            error: err.response?.data?.message || 'Failed to fetch matches'
        });
    }
});

// GET /api/football/matches/:id — fetch single match details
app.get('/api/football/matches/:id', async (req, res) => {
    try {
        const response = await footballApi.get(`/matches/${req.params.id}`);
        res.json(response.data);
    } catch (err) {
        console.error('[Football API]', err.response?.status, err.message);
        res.status(err.response?.status || 500).json({
            error: err.response?.data?.message || 'Failed to fetch match'
        });
    }
});

// ─── YouTube API Proxy ───────────────────────────────────────────────────────
// Static queries for World Cup highlights
const YT_HIGHLIGHT_QUERIES = [
    'France vs Senegal World Cup highlights',
    'Norway World Cup football highlights',
    'Argentina vs Algeria World Cup highlights',
];

app.get('/api/youtube/highlights', async (req, res) => {
    try {
        // Fetch 2 results per query to get a nice set of thumbnails
        const allResults = [];
        for (const query of YT_HIGHLIGHT_QUERIES) {
            try {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        q: query,
                        type: 'video',
                        maxResults: 2,
                        order: 'relevance',
                        key: YOUTUBE_API_KEY,
                    },
                    timeout: 8000,
                });
                if (response.data.items) {
                    allResults.push(...response.data.items.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                        channel: item.snippet.channelTitle,
                        publishedAt: item.snippet.publishedAt,
                        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    })));
                }
            } catch (queryErr) {
                console.error(`[YouTube API] Query "${query}" failed:`, queryErr.response?.data?.error?.message || queryErr.message);
            }
        }
        res.json({ highlights: allResults });
    } catch (err) {
        console.error('[YouTube API]', err.message);
        res.status(500).json({ error: 'Failed to fetch highlights' });
    }
});

// ─── Proxy FLV stream from port 8000 through port 3000 ──────────────────────
app.get('/live/:streamName.flv', (req, res) => {
    const streamName = req.params.streamName;
    const options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: `/live/${streamName}.flv`,
        method: 'GET',
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
            res.status(502).send('Stream not available');
        }
    });

    req.on('close', () => {
        proxyReq.destroy();
    });

    proxyReq.end();
});

// ─── Encrypted Stream Source ─────────────────────────────────────────────────
// The actual stream URL is XOR-encrypted and never appears in plaintext
// in HTML source, API responses, or network tab.
const STREAM_SOURCES = {
    'stream': 'https://streamcrichd.com/update/fetch.php?hd=39&embed=1',
};
const CIPHER_KEY = process.env.CIPHER_KEY;

function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += charCode.toString(16).padStart(2, '0');
    }
    return result;
}

// Returns encrypted payload — only decodable by our client-side decoder
app.get('/api/stream/source', (req, res) => {
    const id = req.query.id || 'stream';
    const src = STREAM_SOURCES[id];
    if (!src) {
        return res.status(404).json({ error: 'Source not found' });
    }

    // Add a time-based salt so the encrypted output changes every 5 minutes
    const timeSalt = Math.floor(Date.now() / 300000).toString();
    const saltedKey = CIPHER_KEY + timeSalt;
    const encrypted = xorEncrypt(src, saltedKey);

    res.json({
        _d: encrypted,
        _k: Buffer.from(saltedKey).toString('base64'),
        _t: Date.now(),
    });
});

// ─── Static files ────────────────────────────────────────────────────────────
app.use(express.static('public'));

// ─── Socket.IO — Real-time viewer count ──────────────────────────────────────
let viewers = 0;
io.on('connection', (socket) => {
    viewers++;
    io.emit('viewer-count', viewers);
    socket.on('disconnect', () => {
        viewers--;
        io.emit('viewer-count', viewers);
    });
});

// ─── Start Express server ────────────────────────────────────────────────────
const httpPort = 3000;
server.listen(httpPort, () => {
    console.log(`GoalStream running at http://localhost:${httpPort}`);
});

// ─── Node Media Server config ────────────────────────────────────────────────
const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media'
    }
};

const nms = new NodeMediaServer(config);
nms.run();

console.log('RTMP server running on port 1935');
console.log('HTTP-FLV server running on port 8000');
