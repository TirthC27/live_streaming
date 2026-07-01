import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import LoadingSpinner from './LoadingSpinner';
import OfflineScreen from './OfflineScreen';

/**
 * HLSPlayer — channel-aware HLS player with ABR quality selector.
 * @param {string} channelKey - channel identifier (e.g. 'channel1')
 * @param {string} [streamUrl] - optional override URL (e.g. for transcoded streams)
 */
function HLSPlayer({ channelKey, streamUrl: streamUrlOverride }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ABR quality state
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [bandwidth, setBandwidth] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const proxyBase = process.env.REACT_APP_PROXY_URL;
  const url = streamUrlOverride || `${proxyBase}/stream/${channelKey}/index.m3u8`;

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setIsOffline(false);
    setIsLive(false);
    setLevels([]);
    setCurrentLevel(-1);
    setSelectedLevel(-1);
    setBandwidth(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        lowLatencyMode: false,
        enableWorker: true,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 20000,
        levelLoadingTimeOut: 20000,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLive(true);
        setIsLoading(false);

        // Collect quality levels
        if (data.levels && data.levels.length > 0) {
          const lvls = data.levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}k`,
          }));
          setLevels(lvls);
        }

        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentLevel(data.level);
      });

      hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
        if (data.stats && data.stats.loaded && data.stats.loading) {
          const bw = Math.round((data.stats.loaded * 8) / (data.stats.loading.end - data.stats.loading.start) * 1000);
          if (bw > 0) setBandwidth(bw);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS Network Error:', data);
              setIsOffline(true);
              setIsLoading(false);
              setIsLive(false);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS Media Error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('HLS Fatal Error:', data);
              setIsOffline(true);
              setIsLoading(false);
              setIsLive(false);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLive(true);
        setIsLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setIsOffline(true);
        setIsLoading(false);
        setIsLive(false);
      });
    } else {
      setIsOffline(true);
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer]);

  const handleRetry = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setIsLoading(true);
    setIsOffline(false);
    setTimeout(() => initPlayer(), 3000);
  }, [initPlayer]);

  const handleQualityChange = useCallback((levelIndex) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setSelectedLevel(levelIndex);
    setShowQualityMenu(false);
  }, []);

  const formatBandwidth = (bw) => {
    if (bw >= 1000000) return `${(bw / 1000000).toFixed(1)} Mbps`;
    if (bw >= 1000) return `${Math.round(bw / 1000)} Kbps`;
    return `${bw} bps`;
  };

  if (isOffline) {
    return <OfflineScreen onRetry={handleRetry} />;
  }

  const activeLabel = levels.length > 0
    ? (selectedLevel === -1
      ? `Auto${currentLevel >= 0 && levels[currentLevel] ? ` (${levels[currentLevel].label})` : ''}`
      : levels[selectedLevel]?.label || 'Unknown')
    : 'Auto';

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-border/30">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/90">
          <LoadingSpinner />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        muted
        playsInline
        controls={isLive}
      />

      {/* Live indicator overlay */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="w-2 h-2 bg-[#e50914] rounded-full animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Live</span>
        </div>
      )}

      {/* Quality selector overlay */}
      {isLive && levels.length > 1 && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowQualityMenu((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 text-xs font-semibold text-white hover:bg-black/80 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {activeLabel}
          </button>

          {showQualityMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden shadow-xl">
              {/* Bandwidth indicator */}
              {bandwidth > 0 && (
                <div className="px-3 py-2 text-[10px] text-zinc-500 border-b border-white/5">
                  Bandwidth: {formatBandwidth(bandwidth)}
                </div>
              )}

              {/* Auto option */}
              <button
                onClick={() => handleQualityChange(-1)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  selectedLevel === -1
                    ? 'bg-[#e50914]/20 text-[#e50914] font-bold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Auto {currentLevel >= 0 && levels[currentLevel] ? `(${levels[currentLevel].label})` : ''}
              </button>

              {/* Quality levels */}
              {levels
                .sort((a, b) => b.height - a.height)
                .map((level) => (
                  <button
                    key={level.index}
                    onClick={() => handleQualityChange(level.index)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      selectedLevel === level.index
                        ? 'bg-[#e50914]/20 text-[#e50914] font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {level.label}
                    <span className="text-zinc-500 ml-2">
                      {Math.round(level.bitrate / 1000)}k
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HLSPlayer;
