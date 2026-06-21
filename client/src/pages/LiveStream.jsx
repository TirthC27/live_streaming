import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";
import { ArrowLeft } from "@phosphor-icons/react";
const PROXY_URL = process.env.REACT_APP_PROXY_URL || "http://localhost:4000";

export default function LiveStreamPage() {
    const { streamId } = useParams();
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [config, setConfig] = useState(null);
    const [viewers, setViewers] = useState(1200);
    useEffect(() => {
        // Viewer count changes randomly around 1200
        const interval = setInterval(() => {
            setViewers((prev) => {
                const offset = Math.floor(Math.random() * 21) - 10; // -10 to +10
                const nextVal = prev + offset;
                return nextVal < 1000 ? 1000 : nextVal; // Keep it above 1k
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        async function loadStreamConfig() {
            try {
                const res = await fetch(`${PROXY_URL}/stream/config`);
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            }
            catch (err) {
                console.error("Failed to load StreamX config:", err);
            }
        }
        loadStreamConfig();
    }, []);
    const getStreamUrl = () => {
        return streamId === "secondary"
            ? `${PROXY_URL}/stream/secondary.m3u8`
            : `${PROXY_URL}/stream/index.m3u8`;
    };
    const getStreamTitle = () => {
        if (!config)
            return "Loading Stream...";
        return streamId === "secondary"
            ? config.secondary?.label || "Backup Stream"
            : config.primary?.label || "Main Stream";
    };
    const streamUrl = getStreamUrl();
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !streamUrl)
            return;
        let hls = null;
        setIsPlaying(false);
        if (Hls.isSupported()) {
            hls = new Hls({
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
                video.play().catch(() => { });
                setIsPlaying(true);
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal)
                    return;
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls?.recoverMediaError();
                    return;
                }
                setIsPlaying(false);
                hls?.destroy();
            });
        }
        else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
            video.addEventListener("loadedmetadata", () => {
                video.play().catch(() => { });
                setIsPlaying(true);
            });
        }
        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [streamUrl]);
    return (<div className="min-h-screen text-white" style={{
            background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
        }}>
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/matches" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-accent transition-colors">
            <ArrowLeft size={16}/> Back to Matches
          </Link>
          <span className="rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
            Live Stream
          </span>
        </div>

        {/* Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main stream box - order-1 on mobile */}
          <div className="space-y-4 order-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black shadow-2xl">
              <video ref={videoRef} controls playsInline className="h-full w-full object-contain"/>
              {!isPlaying && (<div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"/>
                </div>)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{getStreamTitle()}</h1>
              <p className="text-sm text-zinc-400 mt-1">Live Feed Channel from StreamX Server</p>
            </div>
          </div>

          {/* Right sidebar: Ads and Info - order-2 on mobile */}
          <div className="space-y-6 order-2">
            {/* Viewers Box (Replaces Advertisement Block) */}
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">
                Live Viewers
              </h3>
              <div className="mt-4 flex flex-col items-center justify-center py-6 rounded-lg bg-black/30">
                <span className="text-4xl font-extrabold text-pink-400">
                  {(viewers / 1000).toFixed(2)}k
                </span>
                <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Watching Now</span>
              </div>
            </div>

            {/* Upcoming Features Box */}
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">
                Upcoming Features
              </h3>
              <div className="mt-3 space-y-3 text-xs">
                {[
            { name: "Live Chatrooms", desc: "Interact with mates in real time." },
            { name: "YouTube Highlights", desc: "Catch the top plays instantly." },
            { name: "Comments Section", desc: "Share your thoughts on matches." },
            { name: "Community Page", desc: "Connect with fan clubs worldwide." },
            { name: "News Aggregator", desc: "Stay updated with trending headlines." }
        ].map((item, idx) => (<div key={idx} className="flex justify-between items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">{item.desc}</p>
                    </div>
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase">
                      Soon
                    </span>
                  </div>))}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">
                Stream Information
              </h3>
              <div className="mt-3 space-y-2 text-xs text-zinc-400">
                <p>
                  <strong className="text-white">Format:</strong> HLS (.m3u8)
                </p>
                <p>
                  <strong className="text-white">Quality:</strong> Adaptive HD
                </p>
                <p>
                  <strong className="text-white">Server:</strong> StreamX Cloud Run
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
