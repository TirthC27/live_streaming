import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarBlank, Clock } from "@phosphor-icons/react";
import HLSPlayer from "../components/HLSPlayer";
import CountdownTimer from "../components/CountdownTimer";

const PROXY_URL = process.env.REACT_APP_PROXY_URL || "http://localhost:4000";

export default function LiveStreamPage() {
  const { channelKey } = useParams();
  const [channel, setChannel] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState(1200);

  // Random viewer count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((prev) => {
        const offset = Math.floor(Math.random() * 21) - 10;
        const nextVal = prev + offset;
        return nextVal < 1000 ? 1000 : nextVal;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch channel info and matches
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [chRes, mRes] = await Promise.all([
          fetch(`${PROXY_URL}/channels/${channelKey}`),
          fetch(`${PROXY_URL}/matches/all`),
        ]);

        if (chRes.ok) {
          const chData = await chRes.json();
          setChannel(chData);
        }

        if (mRes.ok) {
          const mData = await mRes.json();
          const channelMatches = mData.filter(
            (m) => m.channel?.channelKey === channelKey
          );
          setMatches(channelMatches);
        }
      } catch (err) {
        console.error("Failed to load stream data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [channelKey]);

  // Determine stream status
  const liveMatch = matches.find((m) => m.isStreamOpen);
  const upcomingMatch = matches.find((m) => m.isUpcoming);
  const channelActiveNoSchedule =
    channel?.isActive && matches.length === 0;
  const shouldShowPlayer = !!liveMatch || channelActiveNoSchedule;
  const shouldShowCountdown = !shouldShowPlayer && !!upcomingMatch;

  // Stream URL — use transcoded if transcoding is active
  const streamUrl =
    channel?.isTranscoding
      ? `${PROXY_URL}/transcoded/${channelKey}/master.m3u8`
      : undefined; // undefined = let HLSPlayer use default

  const getStreamTitle = () => {
    if (liveMatch) return liveMatch.matchTitle;
    if (channel?.channelName) return channel.channelName;
    return "Loading Stream...";
  };

  const toIST = (utcStr) =>
    new Date(utcStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{
          background:
            "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
        }}
      >
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // ── COUNTDOWN PAGE ──
  if (shouldShowCountdown) {
    return (
      <div
        className="min-h-screen text-white"
        style={{
          background:
            "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
        }}
      >
        <div className="mx-auto max-w-[900px] px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/matches"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#e50914] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Matches
            </Link>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#1b1843] p-8 text-center">
            {upcomingMatch.thumbnailUrl && (
              <div className="relative h-48 rounded-xl overflow-hidden mb-6 mx-auto max-w-lg">
                <img
                  src={upcomingMatch.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b1843] via-transparent to-transparent" />
              </div>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-600/20 border border-amber-600/30 px-3 py-1 text-xs font-bold uppercase text-amber-400 mb-4">
              <Clock size={12} weight="bold" />
              Upcoming
            </span>

            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {upcomingMatch.matchTitle}
            </h1>

            <p className="text-zinc-400 text-sm mb-2">
              {channel?.channelName || "StreamX"}
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-8">
              <div className="flex items-center gap-2">
                <CalendarBlank size={14} />
                <span>Starts at {toIST(upcomingMatch.scheduledStart)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Opens at {toIST(upcomingMatch.streamOpenTime)}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
                Stream opens in
              </p>
              <div className="text-4xl">
                <CountdownTimer
                  targetTime={upcomingMatch.streamOpenTime}
                  onComplete={() => window.location.reload()}
                />
              </div>
            </div>

            <p className="text-zinc-600 text-xs">
              This page will automatically refresh when the stream opens.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── NO STREAM AVAILABLE ──
  if (!shouldShowPlayer) {
    return (
      <div
        className="min-h-screen text-white"
        style={{
          background:
            "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
        }}
      >
        <div className="mx-auto max-w-[900px] px-6 py-8">
          <div className="mb-6">
            <Link
              to="/matches"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#e50914] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Matches
            </Link>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#1b1843] p-12 text-center">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-xl font-bold mb-2">No Stream Scheduled</h2>
            <p className="text-zinc-400 text-sm mb-6">
              There are no upcoming streams on{" "}
              {channel?.channelName || "this channel"} right now.
            </p>
            <Link
              to="/matches"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e50914] hover:bg-[#c4070f] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Browse Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYER PAGE ──
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/matches"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#e50914] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Matches
          </Link>
          <span className="rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
            Live Stream
          </span>
        </div>

        {/* Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main stream box */}
          <div className="space-y-4 order-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black shadow-2xl">
              <HLSPlayer channelKey={channelKey} streamUrl={streamUrl} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{getStreamTitle()}</h1>
              <p className="text-sm text-zinc-400 mt-1">
                {channel?.channelName || "StreamX"} · Live Feed
              </p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6 order-2">
            {/* Viewers Box */}
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e50914] border-b border-white/5 pb-2">
                Live Viewers
              </h3>
              <div className="mt-4 flex flex-col items-center justify-center py-6 rounded-lg bg-black/30">
                <span className="text-4xl font-extrabold text-pink-400">
                  {(viewers / 1000).toFixed(2)}k
                </span>
                <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
                  Watching Now
                </span>
              </div>
            </div>

            {/* Stream Information */}
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e50914] border-b border-white/5 pb-2">
                Stream Information
              </h3>
              <div className="mt-3 space-y-2 text-xs text-zinc-400">
                <p>
                  <strong className="text-white">Channel:</strong>{" "}
                  {channel?.channelName || channelKey}
                </p>
                <p>
                  <strong className="text-white">Format:</strong> HLS (.m3u8)
                </p>
                <p>
                  <strong className="text-white">Quality:</strong>{" "}
                  {channel?.isTranscoding ? "ABR Multi-Quality" : "Adaptive HD"}
                </p>
                <p>
                  <strong className="text-white">Server:</strong> StreamX Cloud
                  Run
                </p>
                {liveMatch && (
                  <p>
                    <strong className="text-white">Match:</strong>{" "}
                    {liveMatch.matchTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e50914] border-b border-white/5 pb-2">
                Upcoming Features
              </h3>
              <div className="mt-3 space-y-3 text-xs">
                {[
                  {
                    name: "Live Chatrooms",
                    desc: "Interact with mates in real time.",
                  },
                  {
                    name: "YouTube Highlights",
                    desc: "Catch the top plays instantly.",
                  },
                  {
                    name: "Comments Section",
                    desc: "Share your thoughts on matches.",
                  },
                  {
                    name: "Community Page",
                    desc: "Connect with fan clubs worldwide.",
                  },
                  {
                    name: "News Aggregator",
                    desc: "Stay updated with trending headlines.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start border-b border-white/5 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <span className="rounded bg-[#e50914]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#e50914] uppercase">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
