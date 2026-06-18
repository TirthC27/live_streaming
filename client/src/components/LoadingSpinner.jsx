import React from 'react';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 animate-fade-in">
      {/* Spinner */}
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-border/30" />
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin-slow" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-white mb-1">Connecting to stream...</p>
        <p className="text-xs text-muted">Please wait a moment</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
