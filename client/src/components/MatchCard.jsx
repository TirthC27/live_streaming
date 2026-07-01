import { Link } from 'react-router-dom';
import { Play, Clock, CalendarBlank } from '@phosphor-icons/react';
import CountdownTimer from './CountdownTimer';

/**
 * MatchCard — renders a scheduled match in LIVE, UPCOMING, or CLOSED state.
 */
export default function MatchCard({ match }) {
  if (!match) return null;

  const isLive = match.isStreamOpen || match.status === 'live';
  const isUpcoming = match.isUpcoming || match.status === 'upcoming';
  const channelKey = match.channel?.channelKey;
  const channelName = match.channel?.channelName || 'Unknown Channel';

  const formattedStart = new Date(match.scheduledStart).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // ── LIVE STATE ──
  if (isLive && channelKey) {
    return (
      <Link
        to={`/watch/${channelKey}`}
        className="group block rounded-xl border border-green-500/30 bg-[#1b1843] overflow-hidden
                   hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
      >
        {/* Thumbnail */}
        {match.thumbnailUrl && (
          <div className="relative h-36 overflow-hidden">
            <img src={match.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b1843] via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={40} weight="fill" className="text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        <div className="p-4">
          {/* LIVE badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {match.sportType || 'Football'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">{match.matchTitle}</h3>
          <p className="text-[11px] text-zinc-400">{channelName}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">{formattedStart}</span>
            <span className="text-[11px] font-semibold text-green-400 group-hover:text-green-300 transition-colors">
              Watch Now →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ── UPCOMING STATE ──
  if (isUpcoming) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#1b1843] overflow-hidden hover:border-white/10 transition-all duration-300">
        {match.thumbnailUrl && (
          <div className="relative h-36 overflow-hidden">
            <img src={match.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b1843] via-[#1b1843]/60 to-transparent" />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 rounded-md bg-amber-600/20 border border-amber-600/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
              <Clock size={10} weight="bold" />
              Upcoming
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {match.sportType || 'Football'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">{match.matchTitle}</h3>
          <p className="text-[11px] text-zinc-400">{channelName}</p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <CalendarBlank size={12} />
              <span>{formattedStart}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span>Opens in</span>
                <CountdownTimer
                  targetTime={match.streamOpenTime}
                  onComplete={() => window.location.reload()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CLOSED STATE ──
  return (
    <div className="rounded-xl border border-white/5 bg-[#1b1843]/60 overflow-hidden opacity-60">
      <div className="p-4">
        <span className="rounded-md bg-zinc-700/50 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
          Ended
        </span>
        <h3 className="text-sm font-medium text-zinc-400 mt-2 line-clamp-2">{match.matchTitle}</h3>
        <p className="text-[11px] text-zinc-500 mt-1">{channelName} · {formattedStart}</p>
      </div>
    </div>
  );
}
