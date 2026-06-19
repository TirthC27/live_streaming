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

// Target Competition IDs (World Cup, Euros, Champions League, Europa League, Top 5 leagues, domestic cups, AFCON)
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

// Preference ranking helper (lower is more preferred)
function getCompetitionPreference(compId: number): number {
  if (compId === 5930) return 1; // World Cup
  if (compId === 364) return 2;  // Euros
  if (compId === 192) return 3;  // Champions League
  if (TARGET_COMPETITIONS.has(compId)) {
    if (compId === 193) return 5; // Europa League
    if ([7, 11, 25, 17, 16].includes(compId)) return 4; // Top 5 leagues
    if ([565, 573, 592, 579, 585, 588].includes(compId)) return 6; // Domestic cups
    if (compId === 272) return 7; // AFCON
  }
  return 8; // Others
}

/* ─── Left Column Sections ─── */

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
            {match.homeCompetitor.score >= 0 ? match.homeCompetitor.score : 0}{" "}
            <span className="text-zinc-600 mx-2">-</span>{" "}
            {match.awayCompetitor.score >= 0 ? match.awayCompetitor.score : 0}
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

function UpcomingMatches({ matches, showAll, onToggleShowAll }: { matches: Game[]; showAll: boolean; onToggleShowAll: () => void }) {
  const displayMatches = showAll ? matches : matches.slice(0, 5);

  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Clock size={18} className="text-accent" />
          Upcoming Matches
        </h3>
        {matches.length > 5 && (
          <button onClick={onToggleShowAll} className="text-xs text-zinc-500 hover:text-accent transition-colors">
            {showAll ? "Show Less" : "View All"}
          </button>
        )}
      </div>
      {displayMatches.length === 0 ? (
        <p className="text-sm text-zinc-400">No scheduled matches for target leagues</p>
      ) : (
        <div className="space-y-0 divide-y divide-zinc-800">
          {displayMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
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

function Last5Matches({ matches }: { matches: Game[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
        <Trophy size={18} className="text-amber-400" />
        Last 5 Matches
      </h3>
      {matches.length === 0 ? (
        <p className="text-sm text-zinc-400">No recent target matches</p>
      ) : (
        <div className="space-y-0 divide-y divide-zinc-800">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <img src={getLogo(m.homeCompetitor.id)} alt={m.homeCompetitor.name} className="h-6 w-6 object-contain" />
                <span className="text-sm text-zinc-300 w-24 truncate">{m.homeCompetitor.symbolicName || m.homeCompetitor.name}</span>
              </div>
              <span className="rounded-md bg-zinc-800 px-3 py-1 text-sm font-bold text-white">
                {m.homeCompetitor.score} - {m.awayCompetitor.score}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-300 w-24 truncate text-right">{m.awayCompetitor.symbolicName || m.awayCompetitor.name}</span>
                <img src={getLogo(m.awayCompetitor.id)} alt={m.awayCompetitor.name} className="h-6 w-6 object-contain" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdsPlaceholder() {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#1b1843]/50">
      <span className="text-xs text-zinc-400">Advertisement</span>
    </div>
  );
}

/* ─── Right Column Sections ─── */

function TopHighlights({ highlights }: { highlights: Highlight[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Top Highlights</h3>
        <button className="text-xs text-zinc-500 transition-colors hover:text-accent">View All</button>
      </div>
      {highlights.length === 0 ? (
        <p className="text-sm text-zinc-400">No highlights loaded</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

function LiveNow({ matches, showAll, onToggleShowAll }: { matches: Game[]; showAll: boolean; onToggleShowAll: () => void }) {
  const displayMatches = showAll ? matches : matches.slice(0, 5);

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
        {matches.length > 5 && (
          <button onClick={onToggleShowAll} className="text-xs text-zinc-500 hover:text-accent transition-colors">
            {showAll ? "Show Less" : "View All"}
          </button>
        )}
      </div>
      {displayMatches.length === 0 ? (
        <p className="text-sm text-zinc-400">No target live matches right now</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {displayMatches.map((m) => (
            <div
              key={m.id}
              className="min-w-[200px] flex-shrink-0 rounded-lg border border-white/5 bg-[#1b1843] p-4"
            >
              <span className="mb-3 inline-block rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                {m.gameTimeDisplay || "LIVE"}
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <img src={getLogo(m.homeCompetitor.id)} alt={m.homeCompetitor.name} className="h-8 w-8 object-contain" />
                  <span className="text-[11px] text-zinc-400">{m.homeCompetitor.symbolicName || m.homeCompetitor.name}</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {m.homeCompetitor.score >= 0 ? m.homeCompetitor.score : 0} - {m.awayCompetitor.score >= 0 ? m.awayCompetitor.score : 0}
                </span>
                <div className="flex flex-col items-center gap-1.5">
                  <img src={getLogo(m.awayCompetitor.id)} alt={m.awayCompetitor.name} className="h-8 w-8 object-contain" />
                  <span className="text-[11px] text-zinc-400">{m.awayCompetitor.symbolicName || m.awayCompetitor.name}</span>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-zinc-500">{m.competitionName || "Soccer"}</p>
            </div>
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
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 overflow-hidden">
            <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExempjZmVzbGZtNXl6MHM1YWpmMnV5NDl3YzFyamJudnNsOXk3ZjkxYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UqWIbfRyfTjaRulMO/giphy.gif" alt="Football" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-semibold text-pink-300">Share FootyStream</p>
            <p className="text-sm text-zinc-300">to your friends</p>
          </div>
          <div className="ml-4 flex flex-col items-center">
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

/* ─── Page ─── */

export default function MatchesPage() {
  const [live, setLive] = useState<Game[]>([]);
  const [upcoming, setUpcoming] = useState<Game[]>([]);
  const [finished, setFinished] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<Game | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  
  const [showAllLive, setShowAllLive] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  
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

        if (activeFeaturedMatch) {
          const homeName = activeFeaturedMatch.homeCompetitor.name;
          const awayName = activeFeaturedMatch.awayCompetitor.name;
          const query = `${homeName} vs ${awayName} match highlights`;
          const ytApiKey = "AIzaSyBEEoEANYvmqeGXaXXofNbQIAE4D1cGpFg";
          try {
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
                query
              )}&type=video&key=${ytApiKey}`
            );
            if (ytRes.ok) {
              const ytData = await ytRes.json();
              if (ytData.items && ytData.items.length > 0) {
                featuredYtThumbnail = ytData.items[0].snippet.thumbnails?.high?.url || ytData.items[0].snippet.thumbnails?.medium?.url || "";
              }
            }
          } catch (err) {
            console.error("YouTube API failed for featured match:", err);
          }
        }

        const updatedFeatured = activeFeaturedMatch
          ? { ...activeFeaturedMatch, ytThumbnail: featuredYtThumbnail }
          : null;

        setLive(liveMatches);
        setUpcoming(upcomingMatches);
        setFinished(finishedMatches.slice(0, 5));
        setFeatured(updatedFeatured);

        // Generate highlights list based on the top 4 finished matches
        const activeFinished = finishedMatches.slice(0, 4);
        const dynamicHighlights: Highlight[] = await Promise.all(activeFinished.map(async (match, idx) => {
          const homeName = match.homeCompetitor.name;
          const awayName = match.awayCompetitor.name;
          const title = `${homeName} vs ${awayName} Highlights`;
          
          // Selection of Unsplash sports images for realistic football mock thumbnails
          const fallbackThumbs = [
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80",
            "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=300&q=80",
            "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=300&q=80",
            "https://images.unsplash.com/photo-1431324155629-1a6edd17ab6e?auto=format&fit=crop&w=300&q=80"
          ];

          let videoUrl = `https://www.youtube.com/watch?v=dQw4w9WgXcQ`;
          let thumbnail = fallbackThumbs[idx % fallbackThumbs.length];
          const ytApiKey = "AIzaSyBEEoEANYvmqeGXaXXofNbQIAE4D1cGpFg";
          const query = `${homeName} vs ${awayName} match highlights`;

          try {
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
                query
              )}&type=video&key=${ytApiKey}`
            );
            if (ytRes.ok) {
              const ytData = await ytRes.json();
              if (ytData.items && ytData.items.length > 0) {
                const item = ytData.items[0];
                videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || thumbnail;
              }
            }
          } catch (err) {
            console.error("YouTube API failed:", err);
          }

          return {
            title,
            duration: "10:00",
            thumbnail,
            url: videoUrl
          };
        }));

        // Set state
        setHighlights(dynamicHighlights);
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
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
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
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Left column */}
            <div className="space-y-6">
              <FeaturedMatch match={featured} />
              <UpcomingMatches
                matches={upcoming}
                showAll={showAllUpcoming}
                onToggleShowAll={() => setShowAllUpcoming(!showAllUpcoming)}
              />
              <Last5Matches matches={finished} />
              <AdsPlaceholder />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <TopHighlights highlights={highlights} />
              <LiveNow
                matches={live}
                showAll={showAllLive}
                onToggleShowAll={() => setShowAllLive(!showAllLive)}
              />
              <ShareBar />
              <AdsPlaceholder />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
