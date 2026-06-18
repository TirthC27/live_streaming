import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const platformName = process.env.REACT_APP_PLATFORM_NAME || 'StreamX';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-red-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-accent/30 bg-accent/10 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span className="text-sm font-medium text-accent">Live Now</span>
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 tracking-tight">
            <span className="text-accent">{platformName}</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted mb-4 font-light">
            Live sports, live events, live everything.
          </p>

          <p className="text-base text-muted/60 mb-10 max-w-xl mx-auto">
            Stream your favorite content in ultra-low latency with adaptive HLS streaming. No buffering, no delays — just pure live action.
          </p>

          {/* CTA Button */}
          <Link
            to="/watch"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(229,9,20,0.4)]"
          >
            Watch Live Now
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-slide-up">
            Why <span className="text-accent">{platformName}</span>?
          </h2>
          <p className="text-muted text-center mb-16 max-w-lg mx-auto">
            Built for performance, designed for everyone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <div className="group p-8 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-sm hover:border-accent/30 hover:bg-surface/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(229,9,20,0.1)]">
              <div className="text-4xl mb-4">🔴</div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent transition-colors duration-300">
                Live Streaming
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Watch events as they happen in real-time. No recordings, no delays — pure live content delivered straight to your screen.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="group p-8 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-sm hover:border-accent/30 hover:bg-surface/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(229,9,20,0.1)]">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent transition-colors duration-300">
                All Devices
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Stream on desktop, tablet, or mobile. Our adaptive player adjusts quality based on your connection for a seamless experience.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="group p-8 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-sm hover:border-accent/30 hover:bg-surface/80 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(229,9,20,0.1)]">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent transition-colors duration-300">
                Low Latency
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Near-zero delay with HLS adaptive streaming technology. Stay in sync with live events as they unfold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-border/30">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">99.9%</div>
            <div className="text-sm text-muted">Uptime</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">&lt;2s</div>
            <div className="text-sm text-muted">Latency</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent mb-2">HD</div>
            <div className="text-sm text-muted">Quality</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-xl">{platformName}</span>
            <span className="text-muted text-sm">— Live Streaming Platform</span>
          </div>
          <div className="text-muted text-sm">
            © {new Date().getFullYear()} {platformName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
