# 🎬 StreamX — Production HLS Live Streaming Platform

A production-ready HLS live streaming website with a React frontend and Node.js proxy backend.

## Architecture

```
Source m3u8 URL (expires-based, protected)
        ↓
Node.js Proxy Server (hosted on Railway/Render)
        ↓
Proxies the stream + adds required headers
        ↓
React Frontend (hosted on Vercel)
        ↓
hls.js player plays it
        ↓
Viewers
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS v3 + React Router v6 + hls.js |
| Backend | Node.js + Express (proxy server) |
| Frontend Host | Vercel (free tier) |
| Backend Host | Railway or Render (free tier) |

## Project Structure

```
project-root/
├── client/                   ← React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── HLSPlayer.jsx
│   │   │   ├── LiveBadge.jsx
│   │   │   ├── OfflineScreen.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Watch.jsx
│   │   │   └── About.jsx
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── .env
│   ├── .env.example
│   ├── vercel.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                   ← Node.js proxy backend
│   ├── index.js
│   ├── .env
│   ├── .env.example
│   ├── Procfile
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend

```bash
cd server
npm install
npm run dev
```

The proxy server runs on `http://localhost:4000`.

### 2. Start the Frontend

```bash
cd client
npm install
npm start
```

The React app runs on `http://localhost:3000`.

---

## 🌐 Production Deployment

### Step 1 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Deploy from GitHub repo → select the `/server` folder
3. Add environment variable:
   ```
   STREAM_SOURCE_URL = https://cdn5.zohanayaan.com:1686/hls/deportesplus9.m3u8?md5=...&expires=...
   ```
4. Railway gives you a URL like: `https://stream-proxy.railway.app`
5. Copy this URL

### Step 2 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Select the `/client` folder as root directory
3. Add environment variables:
   ```
   REACT_APP_PROXY_URL = https://stream-proxy.railway.app
   REACT_APP_STREAM_TITLE = DeportesPlus Live
   REACT_APP_PLATFORM_NAME = StreamX
   ```
4. Deploy
5. You get: `https://streamx.vercel.app`

### Step 3 — Update Stream URL When It Expires

1. Get a new m3u8 source URL
2. Go to Railway dashboard
3. Update `STREAM_SOURCE_URL` environment variable
4. Railway auto-restarts — **no redeploy needed**

### Step 4 — Custom Domain (Optional)

**Vercel:**
1. Settings → Domains → Add your domain
2. Point DNS A record to Vercel IP

**Railway:**
1. Settings → Domain → Add custom domain
2. Point DNS CNAME to Railway URL

---

## ✅ Deployment Checklist

- [ ] Server deployed on Railway with `STREAM_SOURCE_URL` set
- [ ] Test: `https://your-backend.railway.app/stream/index.m3u8` returns m3u8 data
- [ ] Client deployed on Vercel with `REACT_APP_PROXY_URL` set
- [ ] Test: `https://streamx.vercel.app/watch` plays the stream
- [ ] Custom domain added (optional)
- [ ] Know how to update `STREAM_SOURCE_URL` when it expires

---

## 🔧 Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `STREAM_SOURCE_URL` | The source m3u8 URL to proxy | ✅ |
| `PORT` | Server port (default: 4000) | ❌ |

### Client (`client/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_PROXY_URL` | URL of the deployed proxy server | ✅ |
| `REACT_APP_STREAM_TITLE` | Title shown on the watch page | ❌ |
| `REACT_APP_PLATFORM_NAME` | Platform branding name | ❌ |

---

## How the Proxy Works

1. **Client** requests `/stream/index.m3u8` from the proxy
2. **Proxy** fetches the real m3u8 from `STREAM_SOURCE_URL` with proper `Referer` header
3. **Proxy** rewrites all `.ts` segment URLs in the manifest to point to `/stream/segment?url=ENCODED_URL`
4. **Client** (hls.js) parses the modified m3u8 and requests segments through the proxy
5. **Proxy** fetches each segment from the real CDN and pipes it to the client

This architecture handles:
- ✅ CORS restrictions
- ✅ Referer-based access control
- ✅ Expiring URLs (just update the env variable)
- ✅ No FFmpeg needed — pure HTTP proxy

---

## License

MIT
