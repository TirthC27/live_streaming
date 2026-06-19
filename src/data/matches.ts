export interface Club {
  name: string;
  shortName: string;
  logo: string;
}

export interface CompletedMatch {
  home: Club;
  away: Club;
  homeScore: number;
  awayScore: number;
  league: string;
  date: string;
  minute?: string;
}

export interface UpcomingMatch {
  home: Club;
  away: Club;
  league: string;
  time: string;
  date: string;
}

export interface LiveMatch {
  home: Club;
  away: Club;
  homeScore: number;
  awayScore: number;
  league: string;
  minute: string;
}

export interface Highlight {
  title: string;
  league: string;
  thumbnail: string;
  duration: string;
}

// Club logo helper — uses free API-Football CDN
const logo = (id: number) =>
  `https://media.api-sports.io/football/teams/${id}.png`;

const CLUBS: Record<string, Club> = {
  manUtd:    { name: "Man United",    shortName: "MUN", logo: logo(33) },
  liverpool: { name: "Liverpool",     shortName: "LIV", logo: logo(40) },
  arsenal:   { name: "Arsenal",       shortName: "ARS", logo: logo(42) },
  chelsea:   { name: "Chelsea",       shortName: "CHE", logo: logo(49) },
  manCity:   { name: "Man City",      shortName: "MCI", logo: logo(50) },
  realMadrid:{ name: "Real Madrid",   shortName: "RMA", logo: logo(541) },
  barcelona: { name: "Barcelona",     shortName: "BAR", logo: logo(529) },
  bayern:    { name: "Bayern Munich", shortName: "BAY", logo: logo(157) },
  dortmund:  { name: "Dortmund",      shortName: "BVB", logo: logo(165) },
  psg:       { name: "PSG",           shortName: "PSG", logo: logo(85) },
  marseille: { name: "Marseille",     shortName: "MAR", logo: logo(81) },
  acMilan:   { name: "AC Milan",      shortName: "ACM", logo: logo(489) },
  interMilan:{ name: "Inter Milan",   shortName: "INT", logo: logo(505) },
  juventus:  { name: "Juventus",      shortName: "JUV", logo: logo(496) },
  napoli:    { name: "Napoli",        shortName: "NAP", logo: logo(492) },
  westHam:   { name: "West Ham",      shortName: "WHU", logo: logo(48) },
};

export const FEATURED_MATCH: CompletedMatch = {
  home: CLUBS.manUtd,
  away: CLUBS.liverpool,
  homeScore: 3,
  awayScore: 2,
  league: "Premier League",
  date: "Yesterday",
};

export const UPCOMING_MATCHES: UpcomingMatch[] = [
  { home: CLUBS.chelsea,   away: CLUBS.arsenal,   league: "Premier League", time: "8:00 PM",   date: "Today" },
  { home: CLUBS.bayern,    away: CLUBS.dortmund,   league: "Bundesliga",     time: "12:30 AM",  date: "Tomorrow" },
  { home: CLUBS.psg,       away: CLUBS.marseille,  league: "Ligue 1",        time: "3:00 AM",   date: "Tomorrow" },
  { home: CLUBS.juventus,  away: CLUBS.napoli,     league: "Serie A",        time: "9:00 PM",   date: "Tomorrow" },
];

export const LAST_5_MATCHES: CompletedMatch[] = [
  { home: CLUBS.manUtd,     away: CLUBS.liverpool,  homeScore: 3, awayScore: 2, league: "Premier League", date: "Yesterday" },
  { home: CLUBS.barcelona,  away: CLUBS.realMadrid,  homeScore: 1, awayScore: 1, league: "La Liga",        date: "2 days ago" },
  { home: CLUBS.acMilan,    away: CLUBS.interMilan,  homeScore: 0, awayScore: 2, league: "Serie A",        date: "3 days ago" },
  { home: CLUBS.bayern,     away: CLUBS.dortmund,    homeScore: 4, awayScore: 1, league: "Bundesliga",     date: "3 days ago" },
  { home: CLUBS.psg,        away: CLUBS.marseille,   homeScore: 2, awayScore: 0, league: "Ligue 1",        date: "4 days ago" },
];

export const LIVE_MATCHES: LiveMatch[] = [
  { home: CLUBS.manUtd,    away: CLUBS.liverpool,  homeScore: 2, awayScore: 1, league: "Premier League", minute: "82'" },
  { home: CLUBS.realMadrid,away: CLUBS.barcelona,  homeScore: 1, awayScore: 0, league: "La Liga",        minute: "65'" },
  { home: CLUBS.acMilan,   away: CLUBS.interMilan, homeScore: 0, awayScore: 0, league: "Serie A",        minute: "45+2'" },
];

export const HIGHLIGHTS: Highlight[] = [
  { title: "Haaland Hat-trick vs West Ham",  league: "Premier League", thumbnail: "/placeholder.webp", duration: "3:45" },
  { title: "Vinicius Jr. Stunning Goal",     league: "La Liga",        thumbnail: "/placeholder.webp", duration: "2:12" },
  { title: "Leao Goal vs Inter",             league: "Serie A",        thumbnail: "/placeholder.webp", duration: "1:58" },
  { title: "Kane's Screamer vs Dortmund",    league: "Bundesliga",     thumbnail: "/placeholder.webp", duration: "2:30" },
];
