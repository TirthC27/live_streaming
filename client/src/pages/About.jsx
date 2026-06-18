import React from 'react';

const About = () => {
  const platformName = process.env.REACT_APP_PLATFORM_NAME || 'StreamX';

  const steps = [
    {
      number: '01',
      title: 'Source Capture',
      description: 'Live streams are captured from source providers and encoded into HLS format for optimal delivery across all networks and devices.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Proxy Delivery',
      description: 'Our intelligent proxy server handles stream delivery, adding required headers, managing CORS, and rewriting segment URLs for seamless playback.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Adaptive Playback',
      description: 'HLS adaptive streaming automatically adjusts video quality based on your connection speed, ensuring smooth playback without buffering.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-accent">{platformName}</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            {platformName} is a modern live streaming platform built for speed and reliability.
            We deliver real-time content using HLS adaptive streaming technology,
            ensuring the best possible viewing experience on any device and any network.
          </p>
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How It <span className="text-accent">Works</span>
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group relative flex gap-6 p-6 rounded-2xl bg-surface/50 border border-border/50 backdrop-blur-sm hover:border-accent/30 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step number */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg group-hover:bg-accent/20 transition-colors duration-300">
                  {step.number}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent">{step.icon}</span>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[52px] top-[76px] w-[2px] h-[24px] bg-gradient-to-b from-accent/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Tech <span className="text-accent">Stack</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 18', desc: 'Frontend' },
              { name: 'hls.js', desc: 'Player' },
              { name: 'Node.js', desc: 'Backend' },
              { name: 'Express', desc: 'Proxy' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="p-4 rounded-xl bg-surface/50 border border-border/50 text-center hover:border-accent/30 transition-all duration-300"
              >
                <div className="text-white font-semibold mb-1">{tech.name}</div>
                <div className="text-muted text-xs">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl bg-surface/50 border border-border/50 p-8 text-center backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-3">Get in Touch</h2>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">
            Have questions or feedback? We'd love to hear from you.
          </p>
          <a
            href="mailto:contact@streamx.app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(229,9,20,0.3)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Contact Us
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border/30 text-center">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} {platformName}. Built with ❤️ for live streaming.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
