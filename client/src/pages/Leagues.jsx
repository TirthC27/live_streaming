import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Calendar, Clock, ArrowLeft, X, Play } from "@phosphor-icons/react";

const getLogo = (id) => `https://imagecache.365scores.com/image/upload/f_auto,w_48,h_48,c_limit,q_auto:eco,d_Competitors:default1.png/Competitors/${id}`;
const getLeagueLogo = (id) => `https://imagecache.365scores.com/image/upload/f_auto,w_48,h_48,c_limit,q_auto:eco,d_Competitions:default1.png/Competitions/${id}`;

const LEAGUE_CONFIG = [
  { id: 5930, name: "World Cup",          priority: 1, hasGroups: true  },
  { id: 364,  name: "Euros",              priority: 2, hasGroups: true  },
  { id: 192,  name: "Champions League",   priority: 3, hasGroups: true  },
  { id: 7,    name: "Premier League",     priority: 4, hasGroups: false },
  { id: 11,   name: "La Liga",            priority: 4, hasGroups: false },
  { id: 25,   name: "Bundesliga",         priority: 4, hasGroups: false },
  { id: 17,   name: "Serie A",            priority: 4, hasGroups: false },
  { id: 16,   name: "Ligue 1",            priority: 4, hasGroups: false },
  { id: 193,  name: "Europa League",      priority: 5, hasGroups: true  },
  { id: 565,  name: "FA Cup",             priority: 6, hasGroups: false },
  { id: 573,  name: "EFL Cup",            priority: 6, hasGroups: false },
  { id: 592,  name: "Copa del Rey",       priority: 6, hasGroups: false },
  { id: 579,  name: "DFB Pokal",          priority: 6, hasGroups: false },
  { id: 585,  name: "Coppa Italia",       priority: 6, hasGroups: false },
  { id: 588,  name: "Coupe de France",    priority: 6, hasGroups: false },
  { id: 272,  name: "AFCON",              priority: 7, hasGroups: true  },
];

const TARGET_COMPETITIONS = new Set(LEAGUE_CONFIG.map(l => l.id));

function getFormattedDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

/* ─── Modal 1: View All Table Standings ─── */
function ViewAllTableModal({ league, onClose }) {
    const [standings, setStandings] = useState([]);
    const [brackets, setBrackets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStandingsAndBrackets() {
            try {
                const urls = [
                    fetch(`https://webws.365scores.com/web/standings/?appTypeId=5&langId=1&timezoneName=Asia/Calcutta&userCountryId=80&competitions=${league.id}`)
                ];
                if (league.hasGroups) {
                    urls.push(fetch(`https://webws.365scores.com/web/brackets/?appTypeId=5&langId=1&timezoneName=Asia/Calcutta&userCountryId=80&competitions=${league.id}`));
                }

                const responses = await Promise.all(urls);
                const standingsData = await responses[0].json();
                
                let bracketsData = null;
                if (responses[1]) {
                    bracketsData = await responses[1].json();
                }

                setStandings(standingsData.standings || []);
                setBrackets(bracketsData?.brackets || []);
            } catch (err) {
                console.error("Failed to load standings data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStandingsAndBrackets();
    }, [league.id, league.hasGroups]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
            <div className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 bg-[#0F1020] overflow-hidden text-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#1b1843] px-6 py-4">
                    <div className="flex items-center gap-3">
                        <img src={getLeagueLogo(league.id)} alt="" className="h-8 w-8 object-contain" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                        <h3 className="text-lg font-bold text-white">{league.name} - Full Standings</h3>
                    </div>
                    <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"/>
                        </div>
                    ) : (
                        <>
                            {/* Group stage or League stage */}
                            {league.hasGroups && standings.length > 0 ? (
                                <div className="space-y-8">
                                    {standings.map((std, sIdx) => {
                                        const groups = std.groups || [];
                                        const rows = std.rows || [];
                                        
                                        if (groups.length === 0) {
                                            return (
                                                <div key={sIdx}>
                                                    <StandingsTableTitle title={std.displayName || "League Stage"} />
                                                    <StandingsTableRows rows={rows} />
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={sIdx} className="space-y-6">
                                                {groups.map((group) => {
                                                    const groupRows = rows.filter(r => r.groupNum === group.num);
                                                    return (
                                                        <div key={group.num} className="bg-[#1b1843]/30 p-4 rounded-xl border border-white/5">
                                                            <StandingsTableTitle title={group.name} />
                                                            <StandingsTableRows rows={groupRows} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : standings.length > 0 ? (
                                <div className="bg-[#1b1843]/30 p-4 rounded-xl border border-white/5">
                                    <StandingsTableRows rows={standings[0].rows || []} />
                                </div>
                            ) : (
                                <div className="text-center text-zinc-500 py-8">No standings data available</div>
                            )}

                            {/* Knockout bracket */}
                            {league.hasGroups && brackets.length > 0 && (
                                <div className="mt-8 space-y-8">
                                    <h4 className="text-base font-bold text-accent border-b border-white/5 pb-2 uppercase tracking-wider">Knockout Stage</h4>
                                    <KnockoutBracketTree brackets={brackets} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function StandingsTableTitle({ title }) {
    return <h4 className="mb-3 text-sm font-bold text-zinc-300 border-b border-white/5 pb-1">{title}</h4>;
}

function StandingsTableRows({ rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                        <th className="py-2 px-1">Rank</th>
                        <th className="py-2 px-1">Team</th>
                        <th className="py-2 px-1 text-center">P</th>
                        <th className="py-2 px-1 text-center">W</th>
                        <th className="py-2 px-1 text-center">D</th>
                        <th className="py-2 px-1 text-center">L</th>
                        <th className="py-2 px-1 text-center">GF</th>
                        <th className="py-2 px-1 text-center">GA</th>
                        <th className="py-2 px-1 text-center">GD</th>
                        <th className="py-2 px-1 text-center">Pts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                    {rows.map((row) => (
                        <tr key={row.position} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-1 font-semibold text-zinc-400">{row.position}</td>
                            <td className="py-2.5 px-1 font-medium text-white flex items-center gap-2">
                                <img src={getLogo(row.competitor.id)} alt="" className="h-5 w-5 object-contain shrink-0" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                                <span className="truncate max-w-[150px]">{row.competitor.symbolicName || row.competitor.name}</span>
                            </td>
                            <td className="py-2.5 px-1 text-center text-zinc-300">{row.gamePlayed}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-300">{row.gamesWon}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-300">{row.gamesEven}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-300">{row.gamesLost}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-450">{row.for}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-450">{row.against}</td>
                            <td className="py-2.5 px-1 text-center text-zinc-450 font-medium">{row.for - row.against}</td>
                            <td className="py-2.5 px-1 text-center font-bold text-emerald-400">{row.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function KnockoutBracketTree({ brackets }) {
    const stages = brackets[0]?.stages || [];
    
    const getStageGroups = (stageNum) => {
        const stage = stages.find(s => s.num === stageNum);
        return stage?.groups || [];
    };

    const r32 = getStageGroups(2);
    const r16 = getStageGroups(3);
    const qf = getStageGroups(4);
    const sf = getStageGroups(5);
    const f = getStageGroups(6);

    // Left columns
    const r32Left = r32.slice(0, 8);
    const r16Left = r16.slice(0, 4);
    const qfLeft = qf.slice(0, 2);
    const sfLeft = sf.slice(0, 1);

    // Center
    const finalMatch = f.find(g => g.name.toLowerCase().includes("final") && !g.name.toLowerCase().includes("third") && !g.name.toLowerCase().includes("3rd")) || f[0];
    const thirdPlaceMatch = f.find(g => g.name.toLowerCase().includes("third") || g.name.toLowerCase().includes("3rd")) || f[1];

    // Right columns
    const sfRight = sf.slice(1, 2);
    const qfRight = qf.slice(2, 4);
    const r16Right = r16.slice(4, 8);
    const r32Right = r32.slice(8, 16);

    const renderMatchCard = (group) => {
        if (!group) return null;
        const p1 = group.participants?.[0];
        const p2 = group.participants?.[1];
        const score = group.score || [];
        const isWinner1 = score[0] > score[1] || p1?.isWinner;
        const isWinner2 = score[1] > score[0] || p2?.isWinner;
        
        const game = group.games?.[0];
        const dateStr = game?.startTime 
            ? new Date(game.startTime).toLocaleDateString([], { month: "numeric", day: "numeric" }) + " " + new Date(game.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
            : "TBD";

        return (
            <div key={group.num} className="rounded-lg border border-white/5 bg-[#1b1843]/50 p-2.5 text-[11px] space-y-1.5 hover:border-white/10 transition-colors w-[180px] shrink-0 relative">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-medium">
                    <span>{dateStr}</span>
                    <span className="text-zinc-600 font-bold">M{group.num}</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {p1?.competitorId ? (
                                <img src={getLogo(p1.competitorId)} alt="" className="h-3.5 w-3.5 object-contain shrink-0"/>
                            ) : (
                                <span className="w-3.5 h-3.5 rounded bg-zinc-800 shrink-0 inline-block"/>
                            )}
                            <span className={`truncate ${isWinner1 ? "font-bold text-emerald-400" : "text-zinc-300"}`}>
                                {p1?.name || "TBD"}
                            </span>
                        </div>
                        <span className="font-bold text-white shrink-0">{score[0] !== undefined ? score[0] : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {p2?.competitorId ? (
                                <img src={getLogo(p2.competitorId)} alt="" className="h-3.5 w-3.5 object-contain shrink-0"/>
                            ) : (
                                <span className="w-3.5 h-3.5 rounded bg-zinc-800 shrink-0 inline-block"/>
                            )}
                            <span className={`truncate ${isWinner2 ? "font-bold text-emerald-400" : "text-zinc-300"}`}>
                                {p2?.name || "TBD"}
                            </span>
                        </div>
                        <span className="font-bold text-white shrink-0">{score[1] !== undefined ? score[1] : "-"}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderColumn = (title, matches, justify = "space-around") => {
        const justifyClass = justify === "between" ? "justify-between" : (justify === "around" ? "justify-around" : "justify-center");
        return (
            <div className="flex flex-col min-w-[200px] shrink-0 items-center">
                <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-1 w-full text-center">{title}</h5>
                <div className={`flex flex-col h-[550px] ${justifyClass} w-full items-center gap-2 pr-1`}>
                    {matches.map(m => renderMatchCard(m))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-4 select-none scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {/* Left Side */}
            {r32Left.length > 0 && renderColumn("Round of 32", r32Left, "between")}
            {r16Left.length > 0 && renderColumn("Round of 16", r16Left, "around")}
            {qfLeft.length > 0 && renderColumn("Quarter-final", qfLeft, "around")}
            {sfLeft.length > 0 && renderColumn("Semi-final", sfLeft, "center")}

            {/* Center: Final and 3rd Place */}
            <div className="flex flex-col min-w-[200px] shrink-0 items-center justify-between h-[590px]">
                {/* Final */}
                {finalMatch && (
                    <div className="flex flex-col items-center w-full mt-4">
                        <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 border-b border-white/5 pb-1 w-full text-center">Final</h5>
                        {renderMatchCard(finalMatch)}
                    </div>
                )}

                {/* 3rd Place Play-off */}
                {thirdPlaceMatch && (
                    <div className="flex flex-col items-center w-full mb-4">
                        <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 border-b border-white/5 pb-1 w-full text-center">3rd Place Play-off</h5>
                        {renderMatchCard(thirdPlaceMatch)}
                    </div>
                )}
            </div>

            {/* Right Side */}
            {sfRight.length > 0 && renderColumn("Semi-final", sfRight, "center")}
            {qfRight.length > 0 && renderColumn("Quarter-final", qfRight, "around")}
            {r16Right.length > 0 && renderColumn("Round of 16", r16Right, "around")}
            {r32Right.length > 0 && renderColumn("Round of 32", r32Right, "between")}
        </div>
    );
}

/* ─── Modal 2 & 3: Matches (Upcoming & Previous) ─── */
function MatchesModal({ league, type, onClose }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMatches() {
            try {
                const today = new Date();
                let startDate, endDate;
                if (type === "upcoming") {
                    startDate = new Date(today);
                    endDate = new Date(today);
                    endDate.setDate(today.getDate() + 15);
                } else {
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 15);
                    endDate = new Date(today);
                }

                const startStr = getFormattedDate(startDate);
                const endStr = getFormattedDate(endDate);

                const res = await fetch(`https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&startDate=${startStr}&endDate=${endStr}&onlyMajorGames=true&competitions=${league.id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    let games = (data.games || []).filter(g => g.competitionId === league.id);
                    if (type === "upcoming") {
                        // Sched
                        games = games.filter(g => g.shortStatusText === "NS" || g.statusText === "NS" || g.statusGroup === 2);
                        games.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                    } else {
                        // Finished
                        games = games.filter(g => g.shortStatusText === "FT" || g.shortStatusText === "Ended" || g.statusText === "Ended" || g.statusGroup === 4);
                        games.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                        
                        // Fetch details for finished matches to get scorers in parallel
                        games = await Promise.all(
                            games.slice(0, 10).map(async (m) => {
                                try {
                                    const detailRes = await fetch(`https://webws.365scores.com/web/game/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&gameId=${m.id}`);
                                    if (detailRes.ok) {
                                        const detailData = await detailRes.json();
                                        const gameObj = detailData.game || {};
                                        const events = gameObj.events || [];
                                        const members = gameObj.members || [];
                                        
                                        const memberMap = new Map(members.map(mem => [mem.id, mem]));
                                        const goalEvents = events.filter(e => e.eventType && e.eventType.id === 1);
                                        
                                        const homeScorers = [];
                                        const awayScorers = [];
                                        
                                        goalEvents.forEach(evt => {
                                            const scorer = memberMap.get(evt.playerId);
                                            const scorerName = scorer ? scorer.shortName || scorer.name : "Goal";
                                            const time = evt.gameTimeDisplay;
                                            const goalStr = `${scorerName} ${time}`;
                                            if (evt.competitorId === m.homeCompetitor.id) {
                                                homeScorers.push(goalStr);
                                            } else if (evt.competitorId === m.awayCompetitor.id) {
                                                awayScorers.push(goalStr);
                                            }
                                        });
                                        
                                        return {
                                            ...m,
                                            homeScorers,
                                            awayScorers
                                        };
                                    }
                                } catch (err) {
                                    console.error("Error fetching detail for finished match", m.id, err);
                                }
                                return { ...m, homeScorers: [], awayScorers: [] };
                            })
                        );
                    }
                    setMatches(games);
                }
            } catch (err) {
                console.error("Failed to load matches", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMatches();
    }, [league.id, type]);

    const title = type === "upcoming" ? "Upcoming Matches" : "Previous Matches";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
            <div className="relative flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0F1020] overflow-hidden text-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#1b1843] px-6 py-4">
                    <h3 className="text-lg font-bold text-white">{league.name} - {title}</h3>
                    <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-800">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"/>
                        </div>
                    ) : matches.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-8">
                            {type === "upcoming" ? "No upcoming matches in the next 15 days" : "No recent matches in the last 15 days"}
                        </p>
                    ) : (
                        matches.map((m) => {
                            if (type === "previous") {
                                return (
                                    <div key={m.id} className="flex flex-col py-4 px-3 rounded-lg hover:bg-white/5 transition-colors gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            {/* Home Team */}
                                            <div className="flex flex-col gap-1 w-5/12 min-w-0">
                                                <div className="flex items-center gap-2 w-full justify-start">
                                                    <img src={getLogo(m.homeCompetitor.id)} alt="" className="h-6 w-6 object-contain shrink-0"/>
                                                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{m.homeCompetitor.symbolicName || m.homeCompetitor.name}</span>
                                                </div>
                                                {m.homeScorers && m.homeScorers.length > 0 && (
                                                    <div className="text-[10px] text-zinc-400 pl-8 w-full flex flex-col gap-0.5 text-left">
                                                        {m.homeScorers.map((s, idx) => (
                                                            <span key={idx}>⚽ {s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Score & Info */}
                                            <div className="flex flex-col items-center justify-center flex-shrink-0 w-2/12">
                                                <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                                                    {m.homeCompetitor.score} - {m.awayCompetitor.score}
                                                </span>
                                                <span className="text-[9px] text-zinc-500 mt-1 text-center whitespace-nowrap">
                                                    {new Date(m.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex flex-col gap-1 w-5/12 min-w-0">
                                                <div className="flex items-center gap-2 w-full justify-end">
                                                    <span className="text-xs sm:text-sm font-semibold text-zinc-200 truncate text-right">{m.awayCompetitor.symbolicName || m.awayCompetitor.name}</span>
                                                    <img src={getLogo(m.awayCompetitor.id)} alt="" className="h-6 w-6 object-contain shrink-0"/>
                                                </div>
                                                {m.awayScorers && m.awayScorers.length > 0 && (
                                                    <div className="text-[10px] text-zinc-400 pr-8 w-full flex flex-col gap-0.5 items-end text-right">
                                                        {m.awayScorers.map((s, idx) => (
                                                            <span key={idx}>{s} ⚽</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={m.id} className="flex items-center justify-between py-4 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <img src={getLogo(m.homeCompetitor.id)} alt="" className="h-8 w-8 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800"/>
                                            <img src={getLogo(m.awayCompetitor.id)} alt="" className="h-8 w-8 rounded-full border-2 border-zinc-900 object-contain bg-zinc-800"/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {m.homeCompetitor.name} vs {m.awayCompetitor.name}
                                            </p>
                                            <p className="text-[11px] text-zinc-500">
                                                {new Date(m.startTime).toLocaleDateString([], { month: "short", day: "numeric" })} at {" "}
                                                {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 whitespace-nowrap">
                                            {m.roundName || "Scheduled"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── WorldCupLeagueCard Component ─── */
function WorldCupLeagueCard({ league, onViewAllTable, onUpcomingMatches, onPreviousMatches }) {
    const [standings, setStandings] = useState([]);
    const [brackets, setBrackets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("standings");

    useEffect(() => {
        async function fetchWorldCupData() {
            try {
                const [stdRes, brkRes] = await Promise.all([
                    fetch(`https://webws.365scores.com/web/standings/?appTypeId=5&langId=1&timezoneName=Asia/Calcutta&userCountryId=80&competitions=5930`),
                    fetch(`https://webws.365scores.com/web/brackets/?appTypeId=5&langId=1&timezoneName=Asia/Calcutta&userCountryId=80&competitions=5930`)
                ]);
                if (stdRes.ok && brkRes.ok) {
                    const stdData = await stdRes.json();
                    const brkData = await brkRes.json();
                    const fetchedStandings = stdData.standings || [];
                    const fetchedBrackets = brkData.brackets || [];
                    setStandings(fetchedStandings);
                    setBrackets(fetchedBrackets);

                    const currentStage = fetchedBrackets[0]?.stages?.find(s => s.isCurrentStage);
                    if (currentStage && currentStage.num >= 2) {
                        setActiveTab("bracket");
                    } else {
                        setActiveTab("standings");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch World Cup details inline", err);
            } finally {
                setLoading(false);
            }
        }
        fetchWorldCupData();
    }, [league.id]);

    return (
        <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5 md:col-span-2 flex flex-col justify-between space-y-4">
            {/* Header with Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src={getLeagueLogo(league.id)} alt="" className="h-10 w-10 object-contain" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                    <div>
                        <h3 className="text-base font-bold text-white">{league.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">2026 Season • Active Stage</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setActiveTab("standings")}
                        className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${activeTab === "standings" ? "bg-pink-200 text-black animate-none" : "bg-[#100e35] text-zinc-400 hover:text-white"}`}
                    >
                        Standings
                    </button>
                    <button 
                        onClick={() => setActiveTab("bracket")}
                        className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${activeTab === "bracket" ? "bg-pink-200 text-black animate-none" : "bg-[#100e35] text-zinc-400 hover:text-white"}`}
                    >
                        Bracket
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"/>
                    </div>
                ) : activeTab === "standings" && standings.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-[350px] overflow-y-auto pr-1">
                        {standings.map((std, sIdx) => {
                            const groups = std.groups || [];
                            const rows = std.rows || [];
                            return groups.map((group) => {
                                const groupRows = rows.filter(r => r.groupNum === group.num);
                                return (
                                    <div key={group.num} className="bg-[#0f0d2c]/60 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                                        <h4 className="text-[11px] font-bold text-accent mb-2">{group.name}</h4>
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                                                    <th className="py-2 text-left">#</th>
                                                    <th className="py-2 text-left">Team</th>
                                                    <th className="py-2 text-center font-bold">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupRows.slice(0, 4).map((row) => (
                                                    <tr key={row.position} className="border-b border-zinc-800/10 last:border-0 hover:bg-white/5 transition-colors">
                                                        <td className="py-2 text-zinc-400 font-semibold">{row.position}</td>
                                                        <td className="py-2 font-medium text-white flex items-center gap-1">
                                                            <img src={getLogo(row.competitor.id)} alt="" className="h-4 w-4 object-contain shrink-0"/>
                                                            <span className="truncate max-w-[100px]">{row.competitor.symbolicName || row.competitor.name}</span>
                                                        </td>
                                                        <td className="py-2 text-center font-bold text-emerald-400">{row.points}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            });
                        })}
                    </div>
                ) : activeTab === "bracket" && brackets.length > 0 ? (
                    <KnockoutBracketTree brackets={brackets} />
                ) : (
                    <p className="text-xs text-zinc-400 text-center py-8">Information currently unavailable</p>
                )}
            </div>

            {/* Bottom Actions - Styled using Pink buttons */}
            <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
                <button onClick={onViewAllTable} className="rounded bg-pink-200 px-4 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-all uppercase tracking-wider">
                    Full Standings
                </button>
                <button onClick={onUpcomingMatches} className="rounded bg-pink-200 px-4 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-all uppercase tracking-wider flex items-center justify-center gap-1">
                    <Calendar size={12}/> Upcoming
                </button>
                <button onClick={onPreviousMatches} className="rounded bg-pink-200 px-4 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-all uppercase tracking-wider flex items-center justify-center gap-1">
                    <Clock size={12}/> Prev
                </button>
            </div>
        </div>
    );
}

/* ─── LeagueCard Component ─── */
function LeagueCard({ league, onViewAllTable, onUpcomingMatches, onPreviousMatches }) {
    const [topStandings, setTopStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPreviewStandings() {
            try {
                const res = await fetch(`https://webws.365scores.com/web/standings/?appTypeId=5&langId=1&timezoneName=Asia/Calcutta&userCountryId=80&competitions=${league.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const rows = data.standings?.[0]?.rows || [];
                    setTopStandings(rows.slice(0, 5));
                }
            } catch (err) {
                console.error("Failed to fetch standings preview for league ID", league.id, err);
            } finally {
                setLoading(false);
            }
        }
        fetchPreviewStandings();
    }, [league.id]);

    return (
        <div className="rounded-xl border border-white/5 bg-[#1b1843] p-5 flex flex-col justify-between">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <img src={getLeagueLogo(league.id)} alt="" className="h-10 w-10 object-contain" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                    <div>
                        <h3 className="text-base font-bold text-white">{league.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Hierarchy Priority {league.priority}</p>
                    </div>
                </div>

                {/* Standings Table Preview */}
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"/>
                    </div>
                ) : topStandings.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-8">Standings details currently unavailable</p>
                ) : (
                    <div className="mb-4">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                                    <th className="py-1 px-0.5">#</th>
                                    <th className="py-1 px-0.5">Team</th>
                                    <th className="py-1 px-0.5 text-center">P</th>
                                    <th className="py-1 px-0.5 text-center">W</th>
                                    <th className="py-1 px-0.5 text-center">D</th>
                                    <th className="py-1 px-0.5 text-center">L</th>
                                    <th className="py-1 px-0.5 text-center font-bold">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topStandings.map((row) => (
                                    <tr key={row.position} className="border-b border-zinc-800/20 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="py-1.5 px-0.5 font-semibold text-zinc-400">{row.position}</td>
                                        <td className="py-1.5 px-0.5 font-medium text-white flex items-center gap-1.5">
                                            <img src={getLogo(row.competitor.id)} alt="" className="h-4 w-4 object-contain shrink-0" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                                            <span className="truncate max-w-[100px]">{row.competitor.symbolicName || row.competitor.name}</span>
                                        </td>
                                        <td className="py-1.5 px-0.5 text-center text-zinc-400">{row.gamePlayed}</td>
                                        <td className="py-1.5 px-0.5 text-center text-zinc-400">{row.gamesWon}</td>
                                        <td className="py-1.5 px-0.5 text-center text-zinc-400">{row.gamesEven}</td>
                                        <td className="py-1.5 px-0.5 text-center text-zinc-400">{row.gamesLost}</td>
                                        <td className="py-1.5 px-0.5 text-center font-bold text-emerald-400">{row.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
                <button onClick={onViewAllTable} className="rounded bg-pink-200 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-colors uppercase tracking-wider">
                    View Table
                </button>
                <button onClick={onUpcomingMatches} className="rounded bg-pink-200 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-colors uppercase tracking-wider flex items-center justify-center gap-1">
                    <Calendar size={12}/> Upcoming
                </button>
                <button onClick={onPreviousMatches} className="rounded bg-pink-200 py-2 text-[10px] font-bold text-black hover:bg-pink-300 transition-colors uppercase tracking-wider flex items-center justify-center gap-1">
                    <Clock size={12}/> Prev
                </button>
            </div>
        </div>
    );
}

function NewsSection() {
    const [news, setNews] = useState([]);
    const [sources, setSources] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch("https://webws.365scores.com/web/news/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&isPreview=true");
                if (res.ok) {
                    const data = await res.json();
                    setNews(data.news || []);
                    
                    const sourceMap = {};
                    (data.newsSources || []).forEach(src => {
                        sourceMap[src.id] = src.name;
                    });
                    setSources(sourceMap);
                }
            } catch (err) {
                console.error("Failed to load news", err);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    if (loading) {
        return (
            <div className="md:col-span-2 bg-[#1b1843] border border-white/5 rounded-xl p-5">
                <h3 className="text-base font-bold text-white mb-4">Latest Football News</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="animate-pulse bg-[#0f0d2c]/60 rounded-lg p-3 space-y-3">
                            <div className="aspect-video w-full bg-zinc-800 rounded"/>
                            <div className="h-4 bg-zinc-850 rounded w-3/4"/>
                            <div className="h-3 bg-zinc-850 rounded w-1/2"/>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (news.length === 0) return null;

    return (
        <div className="md:col-span-2 bg-[#1b1843] border border-white/5 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"/>
                Latest Football News
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {news.slice(0, 4).map((item) => {
                    const sourceName = sources[item.sourceId] || "News Source";
                    const dateStr = new Date(item.publishDate).toLocaleDateString([], { month: "short", day: "numeric" });
                    
                    return (
                        <a 
                            key={item.id} 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#0f0d2c]/60 rounded-lg border border-white/5 hover:border-white/10 hover:bg-[#201d4a] transition-all group overflow-hidden flex flex-col justify-between"
                        >
                            <div>
                                <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                                    <img src={item.image || "/placeholder.webp"} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" onError={(e) => { e.target.src = "/placeholder.webp"; }}/>
                                </div>
                                <div className="p-3 space-y-2">
                                    <p className="text-xs font-bold text-zinc-200 line-clamp-2 group-hover:text-pink-300 transition-colors">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                            <div className="px-3 pb-3 flex items-center justify-between text-[10px] text-zinc-500 font-medium border-t border-white/5 pt-2 mt-2">
                                <span className="truncate max-w-[100px]">{sourceName}</span>
                                <span>{dateStr}</span>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function LeaguesPage() {
    const [activeLeagues, setActiveLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal Control State
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [activeModalType, setActiveModalType] = useState(null); // 'table', 'upcoming', 'previous'

    useEffect(() => {
        async function checkActiveLeagues() {
            try {
                const today = new Date();
                
                const pastDate = new Date(today);
                pastDate.setDate(today.getDate() - 15);
                const startDateStr = getFormattedDate(pastDate);

                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + 15);
                const endDateStr = getFormattedDate(futureDate);

                const res = await fetch(`https://webws.365scores.com/web/games/allscores/?appTypeId=5&langId=1&timezoneName=Asia%2FCalcutta&userCountryId=80&sports=1&startDate=${startDateStr}&endDate=${endDateStr}&onlyMajorGames=true`);
                
                if (res.ok) {
                    const data = await res.json();
                    const games = data.games || [];
                    
                    const activeIds = new Set(
                        games
                            .filter(g => TARGET_COMPETITIONS.has(g.competitionId))
                            .map(g => g.competitionId)
                    );

                    const filtered = LEAGUE_CONFIG
                        .filter(l => activeIds.has(l.id))
                        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

                    setActiveLeagues(filtered);
                }
            } catch (err) {
                console.error("Failed to check active leagues", err);
            } finally {
                setLoading(false);
            }
        }
        checkActiveLeagues();
    }, []);

    return (
        <div className="min-h-screen w-full overflow-x-hidden" style={{
            background: "linear-gradient(180deg, #15151E 0%, #0F1020 20%, #090B14 100%)",
        }}>
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
                {/* Page header */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-amber-400" size={24}/>
                        Active Leagues & Standings
                    </h1>
                    <Link to="/" className="text-sm text-zinc-500 transition-colors hover:text-accent">
                        &larr; Back to Home
                    </Link>
                </div>

                {loading ? (
                    <div className="flex h-96 items-center justify-center text-white">
                        <div className="flex flex-col items-center gap-2">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"/>
                            <span>Loading active leagues...</span>
                        </div>
                    </div>
                ) : activeLeagues.length === 0 ? (
                    <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1b1843] p-8 text-center">
                        <Trophy size={48} className="text-zinc-600 mb-3"/>
                        <h2 className="text-lg font-bold text-white mb-1">No Active Leagues found</h2>
                        <p className="text-sm text-zinc-400 max-w-sm">There are no matches scheduled for target leagues within the current 30-day window (today ± 15 days).</p>
                    </div>
                ) : activeLeagues[0]?.id === 5930 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 1st league (World Cup) */}
                        <WorldCupLeagueCard 
                            league={activeLeagues[0]}
                            onViewAllTable={() => { setSelectedLeague(activeLeagues[0]); setActiveModalType("table"); }}
                            onUpcomingMatches={() => { setSelectedLeague(activeLeagues[0]); setActiveModalType("upcoming"); }}
                            onPreviousMatches={() => { setSelectedLeague(activeLeagues[0]); setActiveModalType("previous"); }}
                        />
                        {/* News Section */}
                        <NewsSection />
                        {/* Remaining leagues */}
                        {activeLeagues.slice(1).map((league) => (
                            <LeagueCard 
                                key={league.id} 
                                league={league}
                                onViewAllTable={() => { setSelectedLeague(league); setActiveModalType("table"); }}
                                onUpcomingMatches={() => { setSelectedLeague(league); setActiveModalType("upcoming"); }}
                                onPreviousMatches={() => { setSelectedLeague(league); setActiveModalType("previous"); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* First 2 leagues */}
                        {activeLeagues.slice(0, 2).map((league) => (
                            <LeagueCard 
                                key={league.id} 
                                league={league}
                                onViewAllTable={() => { setSelectedLeague(league); setActiveModalType("table"); }}
                                onUpcomingMatches={() => { setSelectedLeague(league); setActiveModalType("upcoming"); }}
                                onPreviousMatches={() => { setSelectedLeague(league); setActiveModalType("previous"); }}
                            />
                        ))}
                        {/* News Section */}
                        <NewsSection />
                        {/* Remaining leagues */}
                        {activeLeagues.slice(2).map((league) => {
                            if (league.id === 5930) {
                                return (
                                    <WorldCupLeagueCard 
                                        key={league.id} 
                                        league={league}
                                        onViewAllTable={() => { setSelectedLeague(league); setActiveModalType("table"); }}
                                        onUpcomingMatches={() => { setSelectedLeague(league); setActiveModalType("upcoming"); }}
                                        onPreviousMatches={() => { setSelectedLeague(league); setActiveModalType("previous"); }}
                                    />
                                );
                            }
                            return (
                                <LeagueCard 
                                    key={league.id} 
                                    league={league}
                                    onViewAllTable={() => { setSelectedLeague(league); setActiveModalType("table"); }}
                                    onUpcomingMatches={() => { setSelectedLeague(league); setActiveModalType("upcoming"); }}
                                    onPreviousMatches={() => { setSelectedLeague(league); setActiveModalType("previous"); }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View All Table Modal */}
            {selectedLeague && activeModalType === "table" && (
                <ViewAllTableModal 
                    league={selectedLeague} 
                    onClose={() => {
                        setSelectedLeague(null);
                        setActiveModalType(null);
                    }}
                />
            )}

            {/* Matches Modals */}
            {selectedLeague && (activeModalType === "upcoming" || activeModalType === "previous") && (
                <MatchesModal 
                    league={selectedLeague}
                    type={activeModalType}
                    onClose={() => {
                        setSelectedLeague(null);
                        setActiveModalType(null);
                    }}
                />
            )}
        </div>
    );
}