const axios = require('axios');
const channelService = require('./channelService');
const scheduleService = require('./scheduleService');

// ─── Stream fetch headers ────────────────────────────────────
const STREAM_HEADERS = {
  'Referer': process.env.STREAM_REFERER || 'https://executeandship.com/',
  'User-Agent': process.env.STREAM_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

// ─── URL helpers ─────────────────────────────────────────────

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

// ─── M3U8 rewriting ──────────────────────────────────────────

/**
 * Build the proxy URL for a given asset, scoped to a channelKey.
 */
function getProxyUrlForAsset(assetUrl, channelKey, forcePlaylist = false) {
  const lower = assetUrl.split('?')[0].toLowerCase();
  if (forcePlaylist || lower.endsWith('.m3u8')) {
    return `/stream/${channelKey}/variant?url=${encodeURIComponent(assetUrl)}`;
  }
  return `/stream/${channelKey}/segment?url=${encodeURIComponent(assetUrl)}`;
}

/**
 * Rewrite URI="..." attributes in HLS tags (e.g. #EXT-X-MEDIA, #EXT-X-I-FRAME-STREAM-INF).
 */
function rewriteUriAttribute(line, baseUrl, channelKey) {
  return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
    try {
      const absoluteUrl = new URL(uri, baseUrl).href;
      const forcePlaylist = line.trim().startsWith('#EXT-X-MEDIA') || line.trim().startsWith('#EXT-X-I-FRAME-STREAM-INF');
      return `URI="${getProxyUrlForAsset(absoluteUrl, channelKey, forcePlaylist)}"`;
    } catch (e) {
      return `URI="${uri}"`;
    }
  });
}

/**
 * Rewrite all URLs in m3u8 content to route through our proxy, scoped to a channel.
 */
function rewriteM3u8Content(m3u8Content, baseUrl, channelKey) {
  let nextUriIsPlaylist = false;

  return m3u8Content.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed === '') return line;

    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI="')) {
        return rewriteUriAttribute(line, baseUrl, channelKey);
      }
      nextUriIsPlaylist = trimmed.startsWith('#EXT-X-STREAM-INF');
      return line;
    }

    try {
      const absoluteUrl = new URL(trimmed, baseUrl).href;
      const rewrittenUrl = getProxyUrlForAsset(absoluteUrl, channelKey, nextUriIsPlaylist);
      nextUriIsPlaylist = false;
      return rewrittenUrl;
    } catch (e) {
      nextUriIsPlaylist = false;
      return line;
    }
  }).join('\n');
}

/**
 * Check if m3u8 content is a master playlist (contains #EXT-X-STREAM-INF).
 */
function checkIfMasterPlaylist(content) {
  return content.includes('#EXT-X-STREAM-INF');
}

// ─── Proxy functions ─────────────────────────────────────────

/**
 * Proxy the main m3u8 for a channel. Handles schedule gating,
 * master vs. single quality detection, and URL rewriting.
 */
async function proxyM3u8(channelKey, req, res) {
  // STEP 1: Get channel from DB
  const channel = await channelService.getChannelByKey(channelKey);
  if (!channel) {
    return res.status(404).json({ error: `Channel '${channelKey}' not found` });
  }

  // STEP 2: Check schedule
  const scheduleCheck = await scheduleService.isStreamOpenForChannel(channelKey);
  if (!scheduleCheck.open) {
    return res.status(403).json({
      error: 'Stream not available yet',
      opensAt: scheduleCheck.opensAt || null,
      nextMatch: scheduleCheck.nextMatch || null,
      reason: scheduleCheck.reason || 'scheduled',
    });
  }

  // STEP 3: Determine which URL to use
  const streamUrl = channel.activeUrl;
  if (!streamUrl) {
    return res.status(500).json({ error: `No active URL configured for channel '${channelKey}'` });
  }

  // Try primary, fall back to secondary
  const candidates = [];
  if (channel.activeStreamStrategy === 'redirected' && channel.activeResolvedUrl) {
    candidates.push(channel.activeResolvedUrl);
  }
  if (streamUrl && !candidates.includes(streamUrl)) {
    candidates.push(streamUrl);
  }

  let lastError;
  for (const candidate of candidates) {
    try {
      // STEP 4: Fetch m3u8
      const response = await axios.get(candidate, {
        headers: STREAM_HEADERS,
        responseType: 'text',
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        lastError = new Error(`Upstream returned status ${response.status}`);
        continue;
      }

      const m3u8Content = response.data;
      const finalUrl = getFinalResponseUrl(response, candidate);

      // STEP 5: Rewrite URLs with channelKey scope
      const rewrittenContent = rewriteM3u8Content(m3u8Content, finalUrl, channelKey);

      // STEP 6: Send response
      res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
      });

      return res.send(rewrittenContent);
    } catch (error) {
      lastError = error;
      console.error(`Error fetching m3u8 candidate for ${channelKey}:`, error.message);
    }
  }

  // All candidates failed — try secondary
  if (channel.secondaryUrl) {
    try {
      const response = await axios.get(channel.secondaryUrl, {
        headers: STREAM_HEADERS,
        responseType: 'text',
        timeout: 10000,
      });

      const m3u8Content = response.data;
      const finalUrl = getFinalResponseUrl(response, channel.secondaryUrl);
      const rewrittenContent = rewriteM3u8Content(m3u8Content, finalUrl, channelKey);

      res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
      });

      return res.send(rewrittenContent);
    } catch (secondaryError) {
      console.error(`Secondary stream also failed for ${channelKey}:`, secondaryError.message);
    }
  }

  res.status(502).json({
    error: 'Failed to fetch stream manifest',
    details: lastError?.message || 'All stream URLs failed',
  });
}

/**
 * Proxy a variant playlist (a specific quality level within a master playlist).
 */
async function proxyVariantPlaylist(channelKey, variantUrl, req, res) {
  try {
    const decodedUrl = decodeURIComponent(variantUrl);

    const response = await axios.get(decodedUrl, {
      headers: STREAM_HEADERS,
      responseType: 'text',
      timeout: 10000,
    });

    const m3u8Content = response.data;
    const finalUrl = getFinalResponseUrl(response, decodedUrl);
    const rewrittenContent = rewriteM3u8Content(m3u8Content, finalUrl, channelKey);

    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    });

    res.send(rewrittenContent);
  } catch (error) {
    console.error(`Error fetching variant playlist for ${channelKey}:`, error.message);
    res.status(502).json({ error: 'Failed to fetch variant playlist', details: error.message });
  }
}

/**
 * Proxy a .ts segment — fetch from source with spoofed headers and pipe to client.
 */
async function proxySegment(channelKey, segmentUrl, req, res) {
  try {
    const decodedUrl = decodeURIComponent(segmentUrl);

    const response = await axios.get(decodedUrl, {
      headers: STREAM_HEADERS,
      responseType: 'stream',
      timeout: 15000,
    });

    const contentType = response.headers['content-type'] || 'video/mp2t';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    response.data.pipe(res);
  } catch (error) {
    console.error(`Error fetching segment for ${channelKey}:`, error.message);
    res.status(502).json({ error: 'Failed to fetch stream segment', details: error.message });
  }
}

module.exports = {
  proxyM3u8,
  proxyVariantPlaylist,
  proxySegment,
  checkIfMasterPlaylist,
  isHttpUrl,
  STREAM_HEADERS,
  getFinalResponseUrl,
};
