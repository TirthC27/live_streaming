import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Clock,
  Trophy,
  TelegramLogo,
  XLogo,
  RedditLogo,
  DiscordLogo,
  ShareNetwork,
  X,
} from "@phosphor-icons/react";

interface Competitor {
  id: number;
  name: string;
  symbolicName?: string;
  score: number;
  isWinner: boolean;
}

interface Game {
  id: number;
  competitionId: number;
  startTime: string;
  statusText: string;
  shortStatusText: string;
  gameTimeDisplay: string;
  homeCompetitor: Competitor;
  awayCompetitor: Competitor;
  competitionName?: string;
  ytThumbnail?: string;
}

interface Highlight {
  title: string;
  duration: string;
  thumbnail: string;
  url: string;
}

// 365Scores competitor image helper
const getLogo = (id: number) =>
  `https://imagecache.365scores.com/image/upload/f_auto,w_48,h_48,c_limit,q_auto:eco,d_Competitors:default1.png/Competitors/${id}`;

// FeaturedMatch Component
function FeaturedMatch({ match }: { match: Game | null }) {
  if (!match) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#1b1843] p-6 text-center text-zinc-400">
        No completed target matches found
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] overflow-hidden">
      <div className="relative h-48">
        <img
          src={match.ytThumbnail || "/placeholder.webp"}
          alt=""
          className="h-full w-full object-cover object-[50%_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1843] via-[#1b1843]/50 to-transparent" />
        <span className="absolute top-3 left-3 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Latest Finished
        </span>
      </div>
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col items-center gap-2">
          <img src={getLogo(match.homeCompetitor.id)} alt={match.homeCompetitor.name} className="h-12 w-12 object-contain" />
          <span className="text-xs font-medium text-zinc-300">{match.homeCompetitor.symbolicName || match.homeCompetitor.name}</span>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">
            {match.homeCompetitor.score >= 0 ? match.homeCompetitor.score : 0} <span className="text-zinc-600 mx-2">-</span> {match.awayCompetitor.score >= 0 ? match.awayCompetitor.score : 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{match.competitionName || "Match"}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img src={getLogo(match.awayCompetitor.id)} alt={match.awayCompetitor.name} className="h-12 w-12 object-contain" />
          <span className="text-xs font-medium text-zinc-300">{match.awayCompetitor.symbolicName || match.awayCompetitor.name}</span>
        </div>
      </div>
    </div>
  );
}

// Target Competition IDs
const TARGET_COMPETITIONS = new Set([
  5930, // World Cup
  364,  // Euros
  192,  // Champions League (UCL)
  193,  // Europa League (UEL)
  7,    // Premier League
  11,   // La Liga
  25,   // Bundesliga
  17,   // Serie A
  16,   // Ligue 1
  565,  // FA Cup
  573,  // EFL Cup
  592,  // Copa del Rey
  579,  // DFB Pokal
  585,  // Coppa Italia
  588,  // Coupe de France
  272,  // AFCON
]);

function getCompetitionPreference(compId: number): number {
  if (compId === 5930) return 1;
  if (compId === 364) return 2;
  if (compId === 192) return 3;
  if (TARGET_COMPETITIONS.has(compId)) {
    if (compId === 193) return 5;
    if ([7, 11, 25, 17, 16].includes(compId)) return 4;
    if ([565, 573, 592, 579, 585, 588].includes(compId)) return 6;
    if (compId === 272) return 7;
  }
  return 8;
}

/* ─── Stats Modal (365Scores style) ─── */

interface MatchDetails {
  events: any[];
  homeLineup: any;
  awayLineup: any;
  topPerformers: any[];
}

function MatchStatsModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(
          `https://webws.365scores.com/web/game/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&gameId=${game.id}`
        );
        if (res.ok) {
          const data = await res.json();
          const gameObj = data.game || {};
          setDetails({
            events: gameObj.events || [],
            homeLineup: gameObj.homeCompetitor?.lineups || null,
            awayLineup: gameObj.awayCompetitor?.lineups || null,
            topPerformers: gameObj.topPerformers?.categories || [],
          });
        }
      } catch (err) {
        console.error("Failed to load match statistics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [game.id]);

  // Aggregate stats from lineup members
  const getAggregatedStats = () => {
    if (!details) return null;
    const statsMap: Record<string, { home: number; away: number }> = {
      "Total Shots": { home: 0, away: 0 },
      "Shots On Target": { home: 0, away: 0 },
      "Passes Completed": { home: 0, away: 0 },
      "Tackles Won": { home: 0, away: 0 },
      "Fouls Made": { home: 0, away: 0 },
    };

    const addStats = (lineup: any, key: "home" | "away") => {
      if (!lineup || !lineup.members) return;
      lineup.members.forEach((m: any) => {
        if (!m.stats) return;
        m.stats.forEach((s: any) => {
          if (statsMap[s.name]) {
            const val = parseInt(s.value) || 0;
            statsMap[s.name][key] += val;
          }
        });
      });
    };

    addStats(details.homeLineup, "home");
    addStats(details.awayLineup, "away");

    return statsMap;
  };

  const aggregated = getAggregatedStats();
  const hasAggregated = aggregated && Object.values(aggregated).some(val => val.home > 0 || val.away > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-[#0F1020] overflow-hidden text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#1b1843] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {game.competitionName}
            </span>
            <span className="text-sm text-zinc-400">{game.statusText}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scoreboard banner */}
          <div className="flex items-center justify-between rounded-xl bg-[#1b1843]/50 p-6">
            <div className="flex flex-col items-center gap-2 w-1/3">
              <img src={getLogo(game.homeCompetitor.id)} alt="" className="h-16 w-16 object-contain" />
              <span className="text-center font-bold">{game.homeCompetitor.name}</span>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold tracking-wider">
                {game.homeCompetitor.score >= 0 ? game.homeCompetitor.score : 0} - {game.awayCompetitor.score >= 0 ? game.awayCompetitor.score : 0}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{game.gameTimeDisplay || "Ended"}</p>
            </div>
            <div className="flex flex-col items-center gap-2 w-1/3">
              <img src={getLogo(game.awayCompetitor.id)} alt="" className="h-16 w-16 object-contain" />
              <span className="text-center font-bold">{game.awayCompetitor.name}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Match Stats */}
              {hasAggregated && aggregated && (
                <div className="rounded-xl bg-[#1b1843]/30 p-5">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">Team Statistics</h4>
                  <div className="space-y-4">
                    {Object.entries(aggregated).map(([name, val]) => {
                      const total = val.home + val.away || 1;
                      const homePct = Math.round((val.home / total) * 100);
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs text-zinc-300">
                            <span>{val.home}</span>
                            <span className="font-semibold text-white">{name}</span>
                            <span>{val.away}</span>
                          </div>
                          <div className="flex h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div style={{ width: `${homePct}%` }} className="bg-emerald-500 h-full" />
                            <div style={{ width: `${100 - homePct}%` }} className="bg-rose-500 h-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Match Timeline / Events */}
              {details?.events && details.events.length > 0 && (
                <div className="rounded-xl bg-[#1b1843]/30 p-5">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent border-b border-white/5 pb-2">Timeline Events</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {details.events.map((evt, idx) => {
                      const isHome = evt.competitorId === game.homeCompetitor.id;
                      return (
                        <div key={idx} className={`flex items-center gap-3 text-xs ${isHome ? "" : "flex-row-reverse"}`}>
                          <span className="font-semibold text-accent">{evt.gameTimeDisplay}</span>
                          <span className="text-zinc-300">{evt.eventType?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── List Modal (View All) ─── */

function ListModal({ title, matches, onClose, onSelectMatch: _onSelectMatch }: { title: string; matches: Game[]; onClose: () => void; onSelectMatch: (m: Game) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0F1020] overflow-hidden text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#1b1843] px-6 py-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body list */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-800">
          {matches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-4 px-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img src={getLogo(m.homeCompetitor.id)} alt="" className="h-8 w-8 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
                  <img src={getLogo(m.awayCompetitor.id)} alt="" className="h-8 w-8 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {m.homeCompetitor.name} vs {m.awayCompetitor.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">{m.competitionName}</p>
                </div>
              </div>
              <div className="text-right">
                {m.shortStatusText === "FT" || m.shortStatusText === "Ended" ? (
                  <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-bold">
                    {m.homeCompetitor.score} - {m.awayCompetitor.score}
                  </span>
                ) : (
                  <p className="text-xs text-emerald-400">
                    {new Date(m.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                    {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Left Column Sections ─── */

function FeaturedMatchRow({ match, onSelect: _onSelect }: { match: Game | null; onSelect: (g: Game) => void }) {
  return (
    <div>
      <FeaturedMatch match={match} />
    </div>
  );
}

function UpcomingMatchesRow({ matches, onSelect: _onSelect, onViewAll }: { matches: Game[]; onSelect: (g: Game) => void; onViewAll: () => void }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Clock size={18} className="text-accent" />
          Upcoming Matches
        </h3>
        {matches.length > 5 && (
          <button onClick={onViewAll} className="text-xs text-zinc-500 hover:text-accent transition-colors">
            View All
          </button>
        )}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-zinc-400">No scheduled matches for target leagues</p>
      ) : (
        <div className="space-y-0 divide-y divide-zinc-800">
          {matches.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3 rounded px-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img src={getLogo(m.homeCompetitor.id)} alt={m.homeCompetitor.name} className="h-7 w-7 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
                  <img src={getLogo(m.awayCompetitor.id)} alt={m.awayCompetitor.name} className="h-7 w-7 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {m.homeCompetitor.symbolicName || m.homeCompetitor.name} vs {m.awayCompetitor.symbolicName || m.awayCompetitor.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-emerald-400">
                  {new Date(m.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                  {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-[11px] text-zinc-500">{m.competitionName || "Soccer"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Last5MatchesRow({ matches, onSelect: _onSelect, onViewAll }: { matches: Game[]; onSelect: (g: Game) => void; onViewAll: () => void }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Trophy size={18} className="text-amber-400" />
          Prev Matches
        </h3>
        {matches.length > 5 && (
          <button onClick={onViewAll} className="text-xs text-zinc-500 hover:text-accent transition-colors">
            View All
          </button>
        )}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-zinc-400">No recent target matches</p>
      ) : (
        <div className="space-y-0 divide-y divide-zinc-800">
          {matches.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3 rounded px-1 transition-colors gap-2">
              {/* Home Team */}
              <div className="flex items-center gap-2 w-1/3 min-w-0">
                <img src={getLogo(m.homeCompetitor.id)} alt="" className="h-6 w-6 object-contain flex-shrink-0" />
                <span className="text-xs sm:text-sm text-zinc-300 truncate">{m.homeCompetitor.symbolicName || m.homeCompetitor.name}</span>
              </div>
              {/* Score Badge */}
              <div className="flex justify-center flex-shrink-0">
                <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  {m.homeCompetitor.score} - {m.awayCompetitor.score}
                </span>
              </div>
              {/* Away Team */}
              <div className="flex items-center gap-2 w-1/3 min-w-0 justify-end">
                <span className="text-xs sm:text-sm text-zinc-300 truncate text-right">{m.awayCompetitor.symbolicName || m.awayCompetitor.name}</span>
                <img src={getLogo(m.awayCompetitor.id)} alt="" className="h-6 w-6 object-contain flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Right Column Sections ─── */

function TopHighlights({ highlights }: { highlights: Highlight[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Top Highlights</h3>
      </div>
      {highlights.length === 0 ? (
        <p className="text-sm text-zinc-400">No highlights loaded</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {highlights.map((h, i) => (
            <a key={i} href={h.url} target="_blank" rel="noopener noreferrer" className="group cursor-pointer block">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={h.thumbnail}
                  alt={h.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveNow({ matches: _matches, onSelect: _onSelect, onViewAll: _onViewAll }: { matches: Game[]; onSelect: (g: Game) => void; onViewAll: () => void }) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("https://streamx-server-286096169961.us-central1.run.app/admin/stream-config", {
          headers: {
            "x-admin-secret": "StreamXAdmin@2024#Secret"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to load StreamX config", err);
      }
    }
    loadConfig();
  }, []);

  const hardcodedStreams = config ? [
    {
      id: "active",
      title: config.activeUrlLabel || "Main Stream",
      thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80",
      description: "Live Sports Broadcast"
    },
    {
      id: "secondary",
      title: config.secondaryUrlLabel || "Backup Stream",
      thumbnail: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=300&q=80",
      description: "Direct Event Stream"
    }
  ] : [];

  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          Live Now
        </h3>
      </div>
      {hardcodedStreams.length === 0 ? (
        <p className="text-sm text-zinc-400">Loading live streams...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {hardcodedStreams.map((stream, idx) => (
            <Link
              key={idx}
              to={`/watch/${stream.id}`}
              className="min-w-[240px] flex-shrink-0 rounded-lg border border-white/5 bg-[#1b1843] overflow-hidden hover:bg-white/5 transition-colors group block"
            >
              <div className="relative h-28 overflow-hidden">
                <img src={stream.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play size={24} weight="fill" className="text-white drop-shadow-md" />
                </div>
                <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider animate-pulse">
                  Live Stream
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-white truncate">{stream.title}</p>
                <p className="text-[10px] text-zinc-400 mt-1 truncate">{stream.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ShareBar() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="flex flex-col gap-6">
        {/* Top row: Avatar + Text + Shares */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 overflow-hidden flex-shrink-0">
            <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExempjZmVzbGZtNXl6MHM1YWpmMnV5NDl3YzFyamJudnNsOXk3ZjkxYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UqWIbfRyfTjaRulMO/giphy.gif" alt="Football" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-[150px]">
            <p className="text-lg font-semibold text-pink-300">Share FootyStream</p>
            <p className="text-sm text-zinc-300">to your friends</p>
          </div>
          <div className="sm:ml-auto flex flex-col items-center">
            <span className="text-2xl font-semibold text-zinc-400">2k</span>
            <span className="text-xs text-zinc-500">Shares</span>
          </div>
        </div>

        {/* Bottom row: Share buttons */}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: TelegramLogo, label: "Share", bg: "bg-blue-600" },
            { icon: XLogo, label: "Share", bg: "bg-black" },
            { icon: RedditLogo, label: "Share", bg: "bg-blue-700" },
            { icon: DiscordLogo, label: "Share", bg: "bg-red-600" },
            { icon: ShareNetwork, label: "", bg: "bg-lime-500" },
          ].map(({ icon: Icon, label, bg }, i) => (
            <button
              key={i}
              className={`flex items-center gap-2 rounded-full ${bg} px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.97]`}
            >
              <Icon size={20} weight="fill" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function MatchesPage() {
  const [live, setLive] = useState<Game[]>([]);
  const [upcoming, setUpcoming] = useState<Game[]>([]);
  const [finished, setFinished] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<Game | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  
  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Game | null>(null);
  const [activeListModal, setActiveListModal] = useState<{ title: string; matches: Game[] } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const today = new Date();
        const formatDate = (date: Date) => {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };

        const startDateStr = formatDate(today);
        
        // Future date (7 days ahead) for upcoming matches
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 7);
        const endDateStr = formatDate(futureDate);

        // Past date (7 days ago) for finished matches
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 7);
        const pastDateStr = formatDate(pastDate);

        // Request with langId=1 to guarantee English competitor names
        const [liveRes, upcomingRes, finishedRes, featuredRes] = await Promise.all([
          // Live
          fetch(`https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&startDate=${startDateStr}&endDate=${startDateStr}&onlyMajorGames=true`),
          // Upcoming
          fetch(`https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&startDate=${startDateStr}&endDate=${endDateStr}&onlyMajorGames=true`),
          // Last 5 finished
          fetch(`https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&startDate=${pastDateStr}&endDate=${startDateStr}&onlyMajorGames=true`),
          // Featured matches
          fetch(`https://webws.365scores.com/web/games/featured/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&showOdds=true&numberOfGames=4&context=1`)
        ]);

        const liveData = await liveRes.json();
        const upcomingData = await upcomingRes.json();
        const finishedData = await finishedRes.json();
        const featuredData = await featuredRes.json();

        // Helper maps for competition names
        const compMapLive = new Map<number, string>((liveData.competitions || []).map((c: any) => [c.id, c.name]));
        const compMapUp = new Map<number, string>((upcomingData.competitions || []).map((c: any) => [c.id, c.name]));
        const compMapFin = new Map<number, string>((finishedData.competitions || []).map((c: any) => [c.id, c.name]));
        const compMapFeat = new Map<number, string>((featuredData.competitions || []).map((c: any) => [c.id, c.name]));

        // Filtering target competition data and sorting by preference order
        const filterAndSort = (games: any[], compMap: Map<number, string>) => {
          return games
            .filter((g: any) => TARGET_COMPETITIONS.has(g.competitionId))
            .map((g: any) => ({
              ...g,
              competitionName: compMap.get(g.competitionId)
            }))
            .sort((a, b) => getCompetitionPreference(a.competitionId) - getCompetitionPreference(b.competitionId));
        };

        const liveMatches = filterAndSort(
          (liveData.games || []).filter((g: any) => g.shortStatusText !== "FT" && g.shortStatusText !== "Ended" && g.shortStatusText !== "NS" && g.statusGroup === 3),
          compMapLive
        );

        const upcomingMatches = filterAndSort(
          (upcomingData.games || []).filter((g: any) => g.shortStatusText === "NS" || g.statusText === "NS" || g.statusGroup === 2),
          compMapUp
        );

        const finishedMatches = filterAndSort(
          (finishedData.games || []).filter((g: any) => g.shortStatusText === "FT" || g.shortStatusText === "Ended" || g.statusText === "Ended" || g.statusGroup === 4),
          compMapFin
        );

        const featuredMatches = filterAndSort(
          featuredData.games || [],
          compMapFeat
        );

        const activeFeaturedMatch = featuredMatches[0] || finishedMatches[0] || null;
        let featuredYtThumbnail = "";

        const updatedFeatured = activeFeaturedMatch
          ? { ...activeFeaturedMatch, ytThumbnail: featuredYtThumbnail }
          : null;

        setLive(liveMatches);
        setUpcoming(upcomingMatches);
        setFinished(finishedMatches);
        setFeatured(updatedFeatured);

        // Fetch YouTube highlights from the public matches/youtube-links endpoint
        let resolvedHighlights: Highlight[] = [];
        try {
          const ytRes = await fetch("https://streamx-server-286096169961.us-central1.run.app/matches/youtube-links");
          if (ytRes.ok) {
            const ytData = await ytRes.json();
            const serverLinks = ytData.links || [];
            
            // Map valid live/highlights or map standard query fallback if API matches lack active videoId
            resolvedHighlights = serverLinks
              .filter((l: any) => l.videoId)
              .map((l: any) => ({
                title: l.videoTitle || `${l.channelName} Live Stream`,
                duration: "LIVE",
                thumbnail: l.thumbnailUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80",
                url: l.videoUrl || `https://www.youtube.com/watch?v=${l.videoId}`
              }));
          }
        } catch (err) {
          console.error("Failed to load server YouTube links:", err);
        }

        // Use fallback if server yields empty active highlights
        if (resolvedHighlights.length === 0) {
          const activeFinished = finishedMatches.slice(0, 4);
          resolvedHighlights = activeFinished.map((match: Game, idx: number) => {
            const homeName = match.homeCompetitor.name;
            const awayName = match.awayCompetitor.name;
            const title = `${homeName} vs ${awayName} Highlights`;
            const fallbackThumbs = [
              "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1431324155629-1a6edd17ab6e?auto=format&fit=crop&w=300&q=80"
            ];
            const videoUrl = `https://www.youtube.com/watch?v=dQw4w9WgXcQ`; // Secure default

            return {
              title,
              duration: "10:00",
              thumbnail: fallbackThumbs[idx % fallbackThumbs.length],
              url: videoUrl
            };
          });
        }

        setHighlights(resolvedHighlights);
      } catch (err) {
        console.error("Failed to load 365scores data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-end">
          <Link
            to="/"
            className="text-sm text-zinc-500 transition-colors hover:text-accent"
          >
            &larr; Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="flex h-96 items-center justify-center text-white">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <span>Fetching target matches...</span>
            </div>
          </div>
        ) : (
          /* Two-column layout */
          <div className="grid gap-8 lg:grid-cols-[380px_1fr] w-full max-w-full">
            {/* Left column - order-2 on mobile so highlights/streams appear first */}
            <div className="space-y-6 order-2 lg:order-1 min-w-0 w-full">
              <FeaturedMatchRow match={featured} onSelect={setSelectedMatch} />
              <UpcomingMatchesRow
                matches={upcoming}
                onSelect={setSelectedMatch}
                onViewAll={() => setActiveListModal({ title: "All Upcoming Matches", matches: upcoming })}
              />
              <Last5MatchesRow
                matches={finished}
                onSelect={setSelectedMatch}
                onViewAll={() => setActiveListModal({ title: "All Previous Matches", matches: finished })}
              />
            </div>

            {/* Right column - order-1 on mobile */}
            <div className="space-y-6 order-1 lg:order-2 min-w-0 w-full">
              <TopHighlights highlights={highlights} />
              <LiveNow
                matches={live}
                onSelect={setSelectedMatch}
                onViewAll={() => {}}
              />
              <ShareBar />
            </div>
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {selectedMatch && (
        <MatchStatsModal game={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      {/* List Modal */}
      {activeListModal && (
        <ListModal
          title={activeListModal.title}
          matches={activeListModal.matches}
          onClose={() => setActiveListModal(null)}
          onSelectMatch={() => {}}
        />
      )}
    </div>
  );
}
