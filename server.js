const NodeMediaServer = require('node-media-server');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Proxy FLV stream from port 8000 through port 3000
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

app.use(express.static('public'));

// Real-time viewer count
let viewers = 0;
io.on('connection', (socket) => {
    viewers++;
    io.emit('viewer-count', viewers);
    socket.on('disconnect', () => {
        viewers--;
        io.emit('viewer-count', viewers);
    });
});

const httpPort = 3000;
server.listen(httpPort, () => {
    console.log(`Server running at http://localhost:${httpPort}`);
});

// Node Media Server config
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
