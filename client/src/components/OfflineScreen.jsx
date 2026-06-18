import React from 'react';

function OfflineScreen({ onRetry }) {
  return (
    <div className="w-full aspect-video bg-surface rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-border/30 flex items-center justify-center animate-fade-in">
      <div className="text-center px-6 py-10 max-w-md">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-card flex items-center justify-center ring-1 ring-border/50">
          <svg
            className="w-10 h-10 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0"
            />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            {/* Slash line */}
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </div>

        {/* Text */}
        <h3 className="text-xl font-bold text-white mb-2">Stream is currently offline</h3>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          The stream will be back soon. Please check back in a few moments or click retry to reconnect.
        </p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          Retry Connection
        </button>

        {/* Status Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/50 animate-pulse" />
          <span className="text-xs text-muted/60">Waiting for stream...</span>
        </div>
      </div>
    </div>
  );
}

export default OfflineScreen;
