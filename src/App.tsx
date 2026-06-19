import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import MatchesNavbar from "./components/MatchesNavbar";
import HomePage from "./pages/HomePage";
import CommunityPostPage from "./pages/CommunityPostPage";
import MatchesPage from "./pages/MatchesPage";
import LiveStreamPage from "./pages/LiveStreamPage";

function NavbarManager() {
  const location = useLocation();
  return location.pathname === "/matches" || location.pathname.startsWith("/watch") ? <MatchesNavbar /> : <Navbar />;
}

function MobileRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isMobile = window.innerWidth <= 768; // Standard tablet/phone breakpoint
    if (isMobile && location.pathname === "/") {
      navigate("/matches", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#1b1843]">
        <MobileRedirect />
        <NavbarManager />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community/post/:postId" element={<CommunityPostPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/watch/:streamId" element={<LiveStreamPage />} />
        </Routes>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
          <p>FootyStream &copy; {new Date().getFullYear()}. For educational purposes only.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
