import Hero from "../components/Hero";
import TrendingPosts from "../components/TrendingPosts";
import {
  TelegramLogo,
  XLogo,
  RedditLogo,
  DiscordLogo,
  ShareNetwork,
} from "@phosphor-icons/react";

function ShareBar() {
  return (
    <div className="flex flex-col gap-6">
      {/* Top row: Avatar + Text + Shares */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 overflow-hidden">
          <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExempjZmVzbGZtNXl6MHM1YWpmMnV5NDl3YzFyamJudnNsOXk3ZjkxYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UqWIbfRyfTjaRulMO/giphy.gif" alt="Football" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-lg font-semibold text-pink-300">Share FootyStream</p>
          <p className="text-sm text-zinc-300">to your friends</p>
        </div>
        <div className="ml-4 flex flex-col items-center">
          <span className="text-2xl font-semibold text-zinc-400">2k</span>
          <span className="text-xs text-zinc-500">Shares</span>
        </div>
      </div>

      {/* Bottom row: Share buttons */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: TelegramLogo, label: "Share", bg: "bg-blue-600" },
          { icon: XLogo, label: "Share", bg: "bg-black" },
          { icon: RedditLogo, label: "Share", bg: "bg-blue-700" },
          { icon: DiscordLogo, label: "Share", bg: "bg-red-600" },
          { icon: ShareNetwork, label: "", bg: "bg-lime-500" },
        ].map(({ icon: Icon, label, bg }, i) => (
          <button
            key={i}
            className={`flex items-center gap-2 rounded-full ${bg} px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.97]`}
          >
            <Icon size={20} weight="fill" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="pb-16">
      <h2 className="text-xl font-bold text-white">
        FootyStream — Watch live football online for free
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-300">
        <p>
          Football is the most popular sport on the planet with billions of
          fans worldwide. FootyStream brings you every major league and
          tournament in HD quality, completely free. From the Premier League
          and La Liga to the Champions League and World Cup qualifiers, we
          have you covered.
        </p>
        <p>
          Our community-driven platform lets you discuss matches, share
          stream links, and connect with fellow fans. Join the conversation
          and never miss a goal again.
        </p>
      </div>
          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
            <div className="space-y-8">
              {[
                { 
                  q: "Is FootyStream really free to use?", 
                  a: "Yes, FootyStream is completely free. We believe that football should be accessible to everyone, regardless of their budget. We do not charge subscription fees, nor do we require pay-per-view payments for any of the matches broadcast on our platform." 
                },
                { 
                  q: "Do I need to create an account to start watching?", 
                  a: "Absolutely not. We prioritize simplicity and accessibility. You can access all live stream links, match schedules, and community features instantly without the need to sign up, create an account, or provide any personal information." 
                },
                { 
                  q: "What kind of matches and leagues can I watch?", 
                  a: "Our coverage is comprehensive. We stream major leagues like the Premier League, La Liga, Serie A, and Bundesliga, as well as elite competitions such as the UEFA Champions League, Europa League, and major international tournaments like the World Cup and European Championships." 
                },
                { 
                  q: "Is the streaming quality high definition?", 
                  a: "Yes, we strive to provide the best possible viewing experience. Most of our streams are available in 1080p Full HD. We continuously optimize our server infrastructure to ensure stable, high-quality streams with minimal buffering, even during high-traffic matches." 
                },
                { 
                  q: "Is it safe to use this website?", 
                  a: "We take user security very seriously. While we are a community-driven platform, our moderation team works around the clock to monitor all shared links and discussions. We actively filter out malicious content to ensure a safe and enjoyable environment for all football fans." 
                },
              ].map((item, i) => (
                <div key={i} className="border-b border-zinc-800 pb-6">
                  <p className="text-lg font-semibold text-white mb-2">{item.q}</p>
                  <p className="text-zinc-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <main className="space-y-8">
          <ShareBar />
          <AboutSection />
        </main>
        <aside>
          <TrendingPosts />
        </aside>
      </div>
    </>
  );
}
