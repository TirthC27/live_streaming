import {
  MagnifyingGlass,
  Play,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { TOP_SEARCHES } from "../data/posts";

export default function Hero() {
  return (
    <section className="px-32 pt-0 pb-6">
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background image + overlay */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <img
            src="/placeholder.webp"
            alt=""
            className="h-full w-full object-cover object-[center_10px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b1843] via-[#1b1843]/85 to-[#433f81]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1843] via-transparent to-[#433f81]/50" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-[1400px] px-24 py-20 md:py-28">
          <div className="max-w-xl">
            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              FOOTY<span className="text-emerald-400">STREAM</span>
            </h1>

            {/* Search bar */}
            <div className="mt-8 flex gap-0">
              <input
                type="text"
                placeholder="Search matches, leagues, teams..."
                className="flex-1 rounded-l-xl border border-zinc-700 bg-zinc-800/80 px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none backdrop-blur-sm transition-colors focus:border-emerald-500/50"
              />
              <button className="rounded-r-xl bg-pink-200 px-5 text-black font-semibold transition-colors hover:bg-pink-300 active:scale-[0.98]">
                <MagnifyingGlass size={20} weight="bold" />
              </button>
            </div>

            {/* Top searches */}
            <div className="mt-4 text-sm leading-relaxed text-zinc-400">
              <span className="font-medium text-zinc-300">Top search:</span>{" "}
              {TOP_SEARCHES.map((s, i) => (
                <span key={s}>
                  <a href="#" className="transition-colors hover:text-pink-300">
                    {s}
                  </a>
                  {i < TOP_SEARCHES.length - 1 && (
                    <span className="mx-1 text-zinc-600">|</span>
                  )}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Link to="/matches" className="mt-8 flex items-center gap-3 rounded-xl bg-pink-200 px-7 py-3.5 font-semibold text-black transition-colors hover:bg-pink-300 active:scale-[0.98] w-fit">
              Watch Live
              <Play size={18} weight="fill" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
