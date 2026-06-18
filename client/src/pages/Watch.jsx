import React, { useState } from 'react';
import HLSPlayer from '../components/HLSPlayer';
import LiveBadge from '../components/LiveBadge';

const Watch = () => {
  const [copied, setCopied] = useState(false);
  const streamTitle = process.env.REACT_APP_STREAM_TITLE || 'Live Stream';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-4 px-4 md:px-8 pb-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Player Section - 70% on desktop */}
          <div className="w-full lg:w-[70%]">
            <div className="rounded-2xl overflow-hidden bg-surface border border-border/50 shadow-2xl">
              <HLSPlayer />
            </div>
          </div>

          {/* Info Panel - 30% on desktop */}
          <div className="w-full lg:w-[30%] space-y-4">
            {/* Stream Info Card */}
            <div className="rounded-2xl bg-surface/80 border border-border/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <LiveBadge />
                <span className="text-xs text-muted px-3 py-1 rounded-full bg-card border border-border/50">
                  HD
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{streamTitle}</h2>

              <div className="flex items-center gap-2 text-muted text-sm mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>1,243 watching</span>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card hover:bg-border/50 border border-border/50 text-white font-medium transition-all duration-300 hover:border-accent/30"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share Stream</span>
                  </>
                )}
              </button>
            </div>

            {/* Quality Card */}
            <div className="rounded-2xl bg-surface/80 border border-border/50 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                Stream Quality
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Auto (HLS Adaptive)</div>
                  <div className="text-muted text-xs">Quality adjusts to your connection</div>
                </div>
              </div>
            </div>

            {/* Server Status Card */}
            <div className="rounded-2xl bg-surface/80 border border-border/50 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                Server Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Proxy</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="text-sm text-green-400">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Protocol</span>
                  <span className="text-sm text-white">HLS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Latency</span>
                  <span className="text-sm text-white">~2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification for copy */}
      {copied && (
        <div className="fixed bottom-6 right-6 px-6 py-3 bg-green-500/90 text-white rounded-xl shadow-lg animate-slide-up backdrop-blur-sm z-50">
          ✓ Link copied to clipboard
        </div>
      )}
    </div>
  );
};

export default Watch;
