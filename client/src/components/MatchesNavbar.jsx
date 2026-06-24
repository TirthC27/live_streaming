import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { MagnifyingGlass, List, SoccerBall, DiscordLogo, TelegramLogo, RedditLogo, XLogo, Heart, Globe, Users, SignIn, } from "@phosphor-icons/react";
import { useState } from "react";
const NAV_ITEMS = [
    { label: "Favourites", icon: Heart, to: "/upcoming" },
    { label: "Leagues", icon: Globe, to: "/leagues" },
    { label: "Community", icon: Users, to: "/upcoming" },
];
export default function MatchesNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const query = searchParams.get("search") || "";

    const handleSearchChange = (e) => {
        const val = e.target.value;
        if (location.pathname !== "/matches") {
            navigate(`/matches?search=${encodeURIComponent(val)}`);
        } else {
            if (val) {
                setSearchParams({ search: val });
            } else {
                setSearchParams({});
            }
        }
    };

    return (<header className="sticky top-0 z-40 bg-[#1b1843]/80 backdrop-blur-xl border-b border-white/5 w-full">
      <div className="flex max-w-[1400px] items-center gap-4 px-6 py-4 mx-auto">
        {/* Hamburger */}
        <button className="rounded p-1.5 text-zinc-400 transition-colors hover:text-white md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          <List size={22}/>
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white shrink-0">
          <SoccerBall size={26} weight="fill" className="text-accent"/>
          <span>
            HI<span className="text-accent">FOOTBALL</span>
          </span>
        </Link>

        {/* Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md ml-6 gap-0">
          <input type="text" placeholder="Search matches, leagues, teams..." value={query} onChange={handleSearchChange} className="flex-1 rounded-l-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none backdrop-blur-sm transition-colors focus:border-emerald-500/50"/>
          <button className="rounded-r-xl bg-pink-200 px-4 py-3 text-black font-semibold transition-colors hover:bg-pink-300 active:scale-[0.98]">
            <MagnifyingGlass size={22} weight="bold"/>
          </button>
        </div>

        {/* Social icons */}
        <div className="hidden lg:flex items-center gap-2 ml-4">
          {[
            { icon: DiscordLogo, color: "bg-indigo-600" },
            { icon: TelegramLogo, color: "bg-sky-500" },
            { icon: RedditLogo, color: "bg-orange-600" },
            { icon: XLogo, color: "bg-zinc-700" },
        ].map(({ icon: Icon, color }, i) => (
          <Link key={i} to="/upcoming" className={`flex h-8 w-8 items-center justify-center rounded-full ${color} text-white transition-opacity hover:opacity-80`}>
              <Icon size={16} weight="fill"/>
          </Link>
        ))}
        </div>

        {/* Nav items */}
        <nav className="hidden md:flex items-center gap-5 ml-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (<Link key={label} to={to} className="flex flex-col items-center gap-0.5 text-zinc-400 transition-colors hover:text-white">
              <Icon size={18}/>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>))}
        </nav>

        {/* Login */}
        <Link to="/upcoming" className="ml-4 hidden md:flex items-center gap-2 rounded-lg bg-pink-300 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-pink-400">
          <SignIn size={16} weight="bold"/>
          Login
        </Link>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (<nav className="border-t border-zinc-800 px-6 pb-4 md:hidden bg-[#1b1843]">
          <div className="mt-3 flex gap-2">
            <input type="text" placeholder="Search matches..." value={query} onChange={handleSearchChange} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none"/>
            <button className="rounded-lg bg-accent px-4 text-white">
              <MagnifyingGlass size={16}/>
            </button>
          </div>
          {NAV_ITEMS.map(({ label, to }) => (<Link key={label} to={to} className="block rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white" onClick={() => setMobileOpen(false)}>
              {label}
            </Link>))}
          <Link to="/upcoming" className="mt-2 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
            Login
          </Link>
        </nav>)}
    </header>);
}
