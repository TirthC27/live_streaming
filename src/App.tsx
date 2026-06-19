import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import CommunityPostPage from "./pages/CommunityPostPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#1b1843]">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community/post/:postId" element={<CommunityPostPage />} />
        </Routes>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
          <p>FootyStream &copy; {new Date().getFullYear()}. For educational purposes only.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
