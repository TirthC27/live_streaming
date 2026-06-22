import { Link } from "react-router-dom";
import { MagnifyingGlass, List, SoccerBall, } from "@phosphor-icons/react";
import { useState } from "react";
const NAV_ITEMS = ["Home", "Live Matches", "Leagues", "Highlights", "Community"];
const getNavItemLink = (item) => {
    if (item === "Home") return "/";
    if (item === "Live Matches") return "/matches";
    if (item === "Leagues") return "/leagues";
    if (item === "Highlights") return "/matches";
    if (item === "Community") return "/#trending-posts";
    return "#";
};
export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const renderNavItem = (item, mobile = false) => {
        const to = getNavItemLink(item);
        const className = mobile 
            ? "block rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            : "rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white";
        
        if (item === "Community") {
            return (
                <a key={item} href={to} onClick={(e) => {
                    const element = document.getElementById("trending-posts");
                    if (element) {
                        e.preventDefault();
                        element.scrollIntoView({ behavior: "smooth" });
                    }
                    setMobileOpen(false);
                }} className={className}>
                    {item}
                </a>
            );
        }
        return (
            <Link key={item} to={to} className={className} onClick={() => setMobileOpen(false)}>
                {item}
            </Link>
        );
    };

    return (<header className="sticky top-0 z-40 border-b border-white/5 bg-[#1b1843]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <SoccerBall size={28} weight="fill" className="text-accent"/>
          <span>
            HI<span className="text-accent">FOOTBALL</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => renderNavItem(item, false))}
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
          {NAV_ITEMS.map((item) => renderNavItem(item, true))}
        </nav>)}
    </header>);
}
