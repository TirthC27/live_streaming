import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";
import { ArrowLeft } from "@phosphor-icons/react";

interface StreamSource {
  id: string;
  title: string;
  url: string;
  description: string;
}

const STREAM_SOURCES: Record<string, StreamSource> = {
  bein: {
    id: "bein",
    title: "BeIN Sports Xtra",
    url: "https://amg01334-beinsportsllc-beinxtra-samsungau-eiyvc.amagi.tv/playlist/amg01334-beinsportsllc-beinxtra-samsungau/playlist.m3u8",
    description: "Live Sports Broadcast Channel",
  },
  google: {
    id: "google",
    title: "Google Linear HLS",
    url: "https://dai.google.com/linear/hls/pb/event/GxrCGmwST0ixsrc_QgB6qw/stream/2a13ecad-d853-4070-bf97-6e0f116cbda4:TPE/master.m3u8",
    description: "Direct Event Stream Channel",
  },
};

export default function LiveStreamPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stream = STREAM_SOURCES[streamId || ""] || STREAM_SOURCES.bein;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(stream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream.url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [stream.url]);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/matches"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} /> Back to Matches
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
              <video
                ref={videoRef}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{stream.title}</h1>
              <p className="text-sm text-zinc-400 mt-1">{stream.description}</p>
            </div>
          </div>

          {/* Right sidebar: Ads and Info - order-2 on mobile */}
          <div className="space-y-6 order-2">
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">
                Advertisement
              </h3>
              <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/30">
                <span className="text-xs text-zinc-500">Sponsored Ad Space</span>
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
                  <strong className="text-white">Server:</strong> CDN Edge
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
