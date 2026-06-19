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
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-background px-6 py-5">
        {/* Avatar + text */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 overflow-hidden">
            <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExempjZmVzbGZtNXl6MHM1YWpmMnV5NDl3YzFyamJudnNsOXk3ZjkxYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UqWIbfRyfTjaRulMO/giphy.gif" alt="Football" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Share FootyStream</p>
            <p className="text-xs text-zinc-500">with your mates</p>
          </div>
        </div>

        <span className="text-sm font-semibold text-zinc-400">
          120k <span className="text-xs font-normal text-zinc-500">Shares</span>
        </span>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {[
            { icon: TelegramLogo, label: "Share", bg: "bg-sky-500" },
            { icon: XLogo, label: "Share", bg: "bg-zinc-700" },
            { icon: RedditLogo, label: "Share", bg: "bg-orange-600" },
            { icon: DiscordLogo, label: "Share", bg: "bg-indigo-500" },
            { icon: ShareNetwork, label: "", bg: "bg-zinc-700" },
          ].map(({ icon: Icon, label, bg }, i) => (
            <button
              key={i}
              className={`flex items-center gap-2 rounded-lg ${bg} px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.97]`}
            >
              <Icon size={16} weight="fill" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* Left: about text */}
        <div>
          <h2 className="text-xl font-bold text-white">
            FootyStream — Watch live football online for free
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
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
        </div>

        {/* Right: empty for now, this is where the trending sidebar would go
            on the reference but we already have it full-width above */}
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
