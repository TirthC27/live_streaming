import { Link } from "react-router-dom";
import { MagnifyingGlass, List, SoccerBall, } from "@phosphor-icons/react";
import { useState } from "react";
const NAV_ITEMS = ["Home", "Live Matches", "Leagues", "Highlights", "Community"];
export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    return (<header className="sticky top-0 z-40 border-b border-white/5 bg-[#1b1843]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <SoccerBall size={28} weight="fill" className="text-accent"/>
          <span>
            FOOTY<span className="text-accent">STREAM</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (<Link key={item} to={item === "Home" ? "/" : "#"} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
              {item}
            </Link>))}
        </nav>

        {/* Search + mobile toggle */}
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
            <MagnifyingGlass size={20}/>
          </button>
          <button className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <List size={22}/>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (<nav className="border-t border-white/5 px-6 pb-4 md:hidden">
          {NAV_ITEMS.map((item) => (<Link key={item} to={item === "Home" ? "/" : "#"} className="block rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" onClick={() => setMobileOpen(false)}>
              {item}
            </Link>))}
        </nav>)}
    </header>);
}
