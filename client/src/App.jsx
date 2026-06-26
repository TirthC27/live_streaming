import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';
import FootyNavbar from './components/FootyNavbar';
import MatchesNavbar from './components/MatchesNavbar';
import Home from './pages/Home';
import Watch from './pages/Watch';
import About from './pages/About';
import Matches from './pages/Matches';
import Leagues from './pages/Leagues';
import CommunityPost from './pages/CommunityPost';
import LiveStream from './pages/LiveStream';
import ComingSoon from './pages/ComingSoon';

function NavbarManager() {
  const location = useLocation();
  const usesMatchesNavbar =
    location.pathname === '/matches' || location.pathname.startsWith('/watch');

  return usesMatchesNavbar ? <MatchesNavbar /> : <FootyNavbar />;
}

function MobileRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth <= 768 && location.pathname === '/') {
      navigate('/matches', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <div className="min-h-screen bg-[#1b1843] text-white font-sans">
      <MobileRedirect />
      <NavbarManager />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/watch/:streamId" element={<LiveStream />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/community/post/:postId" element={<CommunityPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/upcoming" element={<ComingSoon />} />
        </Routes>
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        <p>HiFootball &copy; {new Date().getFullYear()}. For educational purposes only.</p>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
