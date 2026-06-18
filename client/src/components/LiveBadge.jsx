import React from 'react';

function LiveBadge({ size = 'default' }) {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs gap-1.5',
    default: 'px-3 py-1 text-sm gap-2',
    large: 'px-4 py-1.5 text-base gap-2.5',
  };

  const dotSizes = {
    small: 'w-1.5 h-1.5',
    default: 'w-2 h-2',
    large: 'w-2.5 h-2.5',
  };

  return (
    <div
      className={`inline-flex items-center bg-accent/15 border border-accent/30 rounded-full font-bold text-accent uppercase tracking-wider ${sizeClasses[size]}`}
    >
      <span className={`${dotSizes[size]} bg-accent rounded-full animate-pulse-live`} />
      <span>Live</span>
    </div>
  );
}

export default LiveBadge;
