import { useState, useEffect, useCallback } from 'react';

/**
 * CountdownTimer — displays a live countdown to a target time.
 * @param {string} targetTime - ISO 8601 UTC string
 * @param {function} [onComplete] - callback when countdown reaches zero
 */
export default function CountdownTimer({ targetTime, onComplete }) {
  const computeRemaining = useCallback(() => {
    const diff = new Date(targetTime).getTime() - Date.now();
    return Math.max(0, diff);
  }, [targetTime]);

  const [remaining, setRemaining] = useState(computeRemaining);

  useEffect(() => {
    const id = setInterval(() => {
      const r = computeRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(id);
        if (onComplete) onComplete();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [computeRemaining, onComplete]);

  if (remaining <= 0) {
    return (
      <span className="text-green-400 font-bold text-lg animate-pulse">
        Starting...
      </span>
    );
  }

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  let display;
  if (h > 0) {
    display = `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    display = `${m}m ${s}s`;
  } else {
    display = `${s}s`;
  }

  return (
    <span className="text-[#e50914] font-bold text-lg tabular-nums">
      {display}
    </span>
  );
}
