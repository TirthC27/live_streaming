import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import MatchesNavbar from "./components/MatchesNavbar";
import HomePage from "./pages/HomePage";
import CommunityPostPage from "./pages/CommunityPostPage";
import MatchesPage from "./pages/MatchesPage";

function NavbarManager() {
  const location = useLocation();
  return location.pathname === "/matches" ? <MatchesNavbar /> : <Navbar />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#1b1843]">
        <NavbarManager />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community/post/:postId" element={<CommunityPostPage />} />
          <Route path="/matches" element={<MatchesPage />} />
        </Routes>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
          <p>FootyStream &copy; {new Date().getFullYear()}. For educational purposes only.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
