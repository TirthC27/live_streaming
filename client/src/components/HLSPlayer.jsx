import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import LoadingSpinner from './LoadingSpinner';
import OfflineScreen from './OfflineScreen';

function HLSPlayer() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // 'primary' | 'secondary'
  const [activeStream, setActiveStream] = useState('primary');
  const [streamConfig, setStreamConfig] = useState({
    primary: { label: 'Main Stream', available: true },
    secondary: { label: 'Backup Stream', available: false },
  });

  const proxyBase = process.env.REACT_APP_PROXY_URL;

  const streamUrls = {
    primary: `${proxyBase}/stream/index.m3u8`,
    secondary: `${proxyBase}/stream/secondary.m3u8`,
  };

  // Fetch stream config from the server (stream labels + availability)
  useEffect(() => {
    fetch(`${proxyBase}/stream/config`)
      .then(r => r.json())
      .then(data => setStreamConfig(data))
      .catch(() => {/* keep defaults */});
  }, [proxyBase]);

  const initPlayer = useCallback((streamKey) => {
    const video = videoRef.current;
    if (!video) return;

    const streamUrl = streamUrls[streamKey];

    setIsLoading(true);
    setIsOffline(false);
    setIsLive(false);

    // Destroy existing instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 20000,
        levelLoadingTimeOut: 20000,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLive(true);
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked, user will need to click play
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
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
      // Safari native HLS support
      video.src = streamUrl;
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
  }, [proxyBase]);

  useEffect(() => {
    initPlayer(activeStream);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStream]);

  const handleRetry = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setIsLoading(true);
    setIsOffline(false);
    setTimeout(() => {
      initPlayer(activeStream);
    }, 3000);
  }, [initPlayer, activeStream]);

  const switchStream = useCallback((key) => {
    if (key === activeStream) return;
    setActiveStream(key);
  }, [activeStream]);

  if (isOffline) {
    return <OfflineScreen onRetry={handleRetry} />;
  }

  const hasSecondary = streamConfig?.secondary?.available;

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
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse-live" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">Live</span>
        </div>
      )}

      {/* Stream switcher — shown only when secondary stream is configured */}
      {hasSecondary && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 p-1 bg-black/70 backdrop-blur-sm rounded-xl border border-white/10">
          <button
            id="stream-switcher-primary"
            onClick={() => switchStream('primary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeStream === 'primary'
                ? 'bg-accent text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {streamConfig.primary.label}
          </button>
          <button
            id="stream-switcher-secondary"
            onClick={() => switchStream('secondary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeStream === 'secondary'
                ? 'bg-accent text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {streamConfig.secondary.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default HLSPlayer;
