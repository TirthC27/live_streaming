export interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  authorInitials: string;
  category: string;
  categoryColor: string;
  timeAgo: string;
  comments: number;
  views: number;
  upvotes: number;
}

export const POSTS: Post[] = [
  {
    id: "6a34aa68897",
    title: "Mbappe's hat-trick was unreal last night",
    body: "Three goals in 25 minutes. The second one where he cut inside from the left and curled it top bins was pure class. Haven't seen finishing like that since R9.",
    author: "GoalMachine99",
    authorInitials: "GM",
    category: "General",
    categoryColor: "emerald",
    timeAgo: "2h ago",
    comments: 24,
    views: 1840,
    upvotes: 67,
  },
  {
    id: "b7c12ef4501",
    title: "Best free streaming links for Premier League?",
    body: "Looking for reliable HD streams for this weekend's fixtures. The ones I had last season are all dead now.",
    author: "StreamHunter",
    authorInitials: "SH",
    category: "Questions",
    categoryColor: "sky",
    timeAgo: "4h ago",
    comments: 31,
    views: 3200,
    upvotes: 42,
  },
  {
    id: "d9e55ba2c73",
    title: "Champions League draw predictions thread",
    body: "Quarter-final draw is tomorrow. Drop your predictions below. I'm calling it now: Real Madrid vs City again, and Arsenal vs Bayern.",
    author: "TacticsBoard",
    authorInitials: "TB",
    category: "Discussion",
    categoryColor: "amber",
    timeAgo: "5h ago",
    comments: 56,
    views: 4100,
    upvotes: 89,
  },
  {
    id: "f1a88cd9e22",
    title: "Stream keeps buffering during second half",
    body: "Anyone else getting constant buffering around the 60-70 min mark? Happens every match day. My connection is 200mbps so it's not on my end.",
    author: "PixelPitch",
    authorInitials: "PP",
    category: "Questions",
    categoryColor: "sky",
    timeAgo: "6h ago",
    comments: 18,
    views: 920,
    upvotes: 15,
  },
  {
    id: "a3c44fe7b11",
    title: "New site update: multi-cam angles now available",
    body: "We've added tactical cam and player-tracking cam for selected matches. Try it out during this weekend's El Clasico.",
    author: "Admin",
    authorInitials: "AD",
    category: "Updates",
    categoryColor: "rose",
    timeAgo: "1d ago",
    comments: 12,
    views: 5600,
    upvotes: 134,
  },
  {
    id: "e6d77ab3f99",
    title: "Unpopular opinion: Serie A is the best league right now",
    body: "The tactical quality in Serie A this season is miles ahead of every other league. Atalanta, Inter, Napoli all playing elite football. PL is just vibes and chaos.",
    author: "CalcioFan",
    authorInitials: "CF",
    category: "General",
    categoryColor: "emerald",
    timeAgo: "8h ago",
    comments: 73,
    views: 2900,
    upvotes: 38,
  },
];

export const CATEGORIES = [
  { name: "All", count: 10 },
  { name: "Updates", count: 2 },
  { name: "General", count: 4 },
  { name: "Suggestions", count: 1 },
  { name: "Questions", count: 3 },
  { name: "Discussion", count: 4 },
  { name: "Feedback", count: 0 },
];

export const TOP_SEARCHES = [
  "Premier League",
  "Champions League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "World Cup Qualifiers",
  "Europa League",
  "FA Cup",
];
