const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * In-memory map of active FFmpeg transcoding processes.
 * Key: channelKey, Value: { process, startedAt, sourceUrl }
 */
const activeTranscoders = new Map();

const TEMP_BASE = '/tmp/streamx-transcode';

/**
 * Get the output directory for a channel's transcoded files.
 */
function getOutputDir(channelKey) {
  return path.join(TEMP_BASE, channelKey);
}

/**
 * Start FFmpeg transcoding for a channel.
 * Produces 4 quality variants: 1080p, 720p, 480p, 360p.
 * Generates a master.m3u8 with all variants listed.
 */
function startTranscoding(channelKey, sourceUrl) {
  if (activeTranscoders.has(channelKey)) {
    throw new Error(`Transcoding already active for channel '${channelKey}'`);
  }

  const outputDir = getOutputDir(channelKey);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const referer = process.env.STREAM_REFERER || 'https://executeandship.com/';

  // Build FFmpeg arguments for 4 quality outputs
  const args = [
    '-i', sourceUrl,
    '-headers', `Referer: ${referer}\r\n`,
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',

    // 1080p
    '-map', '0:v:0', '-map', '0:a:0',
    '-c:v:0', 'libx264', '-b:v:0', '3000k', '-s:v:0', '1920x1080',
    '-c:a:0', 'aac', '-b:a:0', '128k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(outputDir, '1080p_%03d.ts'),
    path.join(outputDir, '1080p.m3u8'),

    // 720p
    '-map', '0:v:0', '-map', '0:a:0',
    '-c:v:1', 'libx264', '-b:v:1', '1500k', '-s:v:1', '1280x720',
    '-c:a:1', 'aac', '-b:a:1', '128k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(outputDir, '720p_%03d.ts'),
    path.join(outputDir, '720p.m3u8'),

    // 480p
    '-map', '0:v:0', '-map', '0:a:0',
    '-c:v:2', 'libx264', '-b:v:2', '800k', '-s:v:2', '854x480',
    '-c:a:2', 'aac', '-b:a:2', '96k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(outputDir, '480p_%03d.ts'),
    path.join(outputDir, '480p.m3u8'),

    // 360p
    '-map', '0:v:0', '-map', '0:a:0',
    '-c:v:3', 'libx264', '-b:v:3', '400k', '-s:v:3', '640x360',
    '-c:a:3', 'aac', '-b:a:3', '64k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', path.join(outputDir, '360p_%03d.ts'),
    path.join(outputDir, '360p.m3u8'),
  ];

  console.log(`🎬 Starting FFmpeg transcoding for ${channelKey}...`);

  const ffmpegProcess = spawn('ffmpeg', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  ffmpegProcess.stdout.on('data', (data) => {
    // FFmpeg outputs progress to stderr, stdout is usually empty
  });

  ffmpegProcess.stderr.on('data', (data) => {
    // Log only important lines (avoid flooding)
    const line = data.toString().trim();
    if (line.includes('error') || line.includes('Error') || line.includes('Opening')) {
      console.log(`[FFmpeg ${channelKey}] ${line}`);
    }
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[FFmpeg ${channelKey}] Process exited with code ${code}`);
    activeTranscoders.delete(channelKey);
  });

  ffmpegProcess.on('error', (err) => {
    console.error(`[FFmpeg ${channelKey}] Spawn error:`, err.message);
    activeTranscoders.delete(channelKey);
  });

  activeTranscoders.set(channelKey, {
    process: ffmpegProcess,
    startedAt: new Date().toISOString(),
    sourceUrl,
    pid: ffmpegProcess.pid,
  });

  // Generate master.m3u8
  const masterContent = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080
/transcoded/${channelKey}/1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
/transcoded/${channelKey}/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
/transcoded/${channelKey}/480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360
/transcoded/${channelKey}/360p.m3u8
`;

  fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterContent);

  console.log(`✅ Transcoding started for ${channelKey} (PID: ${ffmpegProcess.pid})`);

  return {
    channelKey,
    status: 'started',
    pid: ffmpegProcess.pid,
    startedAt: new Date().toISOString(),
    outputDir,
  };
}

/**
 * Stop FFmpeg transcoding for a channel.
 */
function stopTranscoding(channelKey) {
  const transcoder = activeTranscoders.get(channelKey);
  if (!transcoder) {
    throw new Error(`No active transcoding for channel '${channelKey}'`);
  }

  console.log(`🛑 Stopping transcoding for ${channelKey} (PID: ${transcoder.pid})...`);

  try {
    transcoder.process.kill('SIGTERM');
  } catch (e) {
    console.error(`Error killing FFmpeg process for ${channelKey}:`, e.message);
    try {
      transcoder.process.kill('SIGKILL');
    } catch (e2) {
      // Process might already be dead
    }
  }

  activeTranscoders.delete(channelKey);

  // Cleanup temp files
  const outputDir = getOutputDir(channelKey);
  try {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error(`Error cleaning up temp files for ${channelKey}:`, e.message);
  }

  console.log(`✅ Transcoding stopped for ${channelKey}`);

  return { channelKey, status: 'stopped' };
}

/**
 * Get the status of all active transcoding processes.
 */
function getTranscodingStatus() {
  const status = {};
  for (const [channelKey, transcoder] of activeTranscoders) {
    status[channelKey] = {
      active: true,
      pid: transcoder.pid,
      startedAt: transcoder.startedAt,
      sourceUrl: transcoder.sourceUrl,
    };
  }
  return status;
}

/**
 * Check if a specific channel is currently being transcoded.
 */
function isTranscoding(channelKey) {
  return activeTranscoders.has(channelKey);
}

/**
 * Get the path to a transcoded file.
 */
function getTranscodedFilePath(channelKey, filename) {
  return path.join(getOutputDir(channelKey), filename);
}

module.exports = {
  startTranscoding,
  stopTranscoding,
  getTranscodingStatus,
  isTranscoding,
  getTranscodedFilePath,
  getOutputDir,
};
