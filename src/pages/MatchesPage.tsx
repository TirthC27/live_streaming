import { Link } from "react-router-dom";
import { Play, Clock, Trophy, Eye } from "@phosphor-icons/react";
import {
  FEATURED_MATCH,
  UPCOMING_MATCHES,
  LAST_5_MATCHES,
  LIVE_MATCHES,
  HIGHLIGHTS,
} from "../data/matches";

/* ─── Left Column Sections ─── */

function FeaturedMatch() {
  const m = FEATURED_MATCH;
  return (
    <div className="rounded-xl border border-white/5 bg-[#373196] overflow-hidden">
      {/* Banner image */}
      <div className="relative h-48">
        <img
          src="/placeholder.webp"
          alt=""
          className="h-full w-full object-cover object-[50%_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#373196] via-[#373196]/50 to-transparent" />
        <span className="absolute top-3 left-3 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Full Time
        </span>
      </div>
      {/* Score */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col items-center gap-2">
          <img src={m.home.logo} alt={m.home.name} className="h-12 w-12 object-contain" />
          <span className="text-xs font-medium text-zinc-300">{m.home.name}</span>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {m.homeScore} <span className="text-zinc-600 mx-2">-</span> {m.awayScore}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{m.league} &middot; {m.date}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img src={m.away.logo} alt={m.away.name} className="h-12 w-12 object-contain" />
          <span className="text-xs font-medium text-zinc-300">{m.away.name}</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingMatches() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#373196] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
        <Clock size={18} className="text-accent" />
        Upcoming Matches
      </h3>
      <div className="space-y-0 divide-y divide-zinc-800">
        {UPCOMING_MATCHES.map((m, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img src={m.home.logo} alt={m.home.name} className="h-7 w-7 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
                <img src={m.away.logo} alt={m.away.name} className="h-7 w-7 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{m.home.name} vs {m.away.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-emerald-400">{m.date}, {m.time}</p>
              <p className="text-[11px] text-zinc-500">{m.league}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Last5Matches() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#373196] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
        <Trophy size={18} className="text-amber-400" />
        Last 5 Matches
      </h3>
      <div className="space-y-0 divide-y divide-zinc-800">
        {LAST_5_MATCHES.map((m, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src={m.home.logo} alt={m.home.name} className="h-6 w-6 object-contain" />
              <span className="text-sm text-zinc-300 w-20 truncate">{m.home.shortName}</span>
            </div>
            <span className="rounded-md bg-zinc-800 px-3 py-1 text-sm font-bold text-white">
              {m.homeScore} - {m.awayScore}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 w-20 truncate text-right">{m.away.shortName}</span>
              <img src={m.away.logo} alt={m.away.name} className="h-6 w-6 object-contain" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdsPlaceholder() {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#373196]/50">
      <span className="text-xs text-zinc-400">Advertisement</span>
    </div>
  );
}

/* ─── Right Column Sections ─── */

function TopHighlights() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#373196] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Top Highlights</h3>
        <button className="text-xs text-zinc-500 transition-colors hover:text-accent">View All</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {HIGHLIGHTS.map((h, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={h.thumbnail}
                alt={h.title}
                className="aspect-video w-full object-cover object-[50%_20%] transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/10" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                {h.duration}
              </span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <Play size={28} weight="fill" className="text-white drop-shadow-lg" />
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-zinc-200 line-clamp-2">{h.title}</p>
            <p className="text-[11px] text-zinc-500">{h.league}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveNow() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#373196] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          Live Now
        </h3>
        <button className="text-xs text-zinc-500 transition-colors hover:text-accent">View All</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {LIVE_MATCHES.map((m, i) => (
          <div
            key={i}
            className="min-w-[200px] flex-shrink-0 rounded-lg border border-white/5 bg-[#2d2878] p-4"
          >
            <span className="mb-3 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {m.minute}
            </span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <img src={m.home.logo} alt={m.home.name} className="h-8 w-8 object-contain" />
                <span className="text-[11px] text-zinc-400">{m.home.shortName}</span>
              </div>
              <span className="text-lg font-bold text-white">
                {m.homeScore} - {m.awayScore}
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <img src={m.away.logo} alt={m.away.name} className="h-8 w-8 object-contain" />
                <span className="text-[11px] text-zinc-400">{m.away.shortName}</span>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-500">{m.league}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            <Eye size={24} className="mr-2 inline text-accent" />
            Matches
          </h1>
          <Link
            to="/"
            className="text-sm text-zinc-500 transition-colors hover:text-accent"
          >
            &larr; Back to Home
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            <FeaturedMatch />
            <UpcomingMatches />
            <Last5Matches />
            <AdsPlaceholder />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <TopHighlights />
            <LiveNow />
            <AdsPlaceholder />
          </div>
        </div>
      </div>
    </div>
  );
}
