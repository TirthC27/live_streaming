import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/watch', label: 'Watch' },
  { to: '/about', label: 'About' },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  const linkClasses = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-white after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-accent after:rounded-full'
        : 'text-muted hover:text-white'
    }`;

  const mobileLinkClasses = ({ isActive }) =>
    `block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'text-white bg-accent/10 border-l-2 border-accent'
        : 'text-muted hover:text-white hover:bg-white/5'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group" onClick={closeMobile}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:bg-accent-hover transition-colors duration-200">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Stream<span className="text-accent">X</span>
            </span>
          </NavLink>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClasses} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/watch"
              className="ml-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/25"
            >
              Watch Live
            </NavLink>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={toggleMobile}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1.5">
              <span
                className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? 'opacity-0 scale-0' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3 space-y-1 border-t border-border/50 bg-surface/95 backdrop-blur-xl">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={mobileLinkClasses}
              onClick={closeMobile}
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/watch"
            onClick={closeMobile}
            className="block mt-2 px-4 py-3 bg-accent hover:bg-accent-hover text-white text-center font-semibold rounded-lg transition-all duration-200"
          >
            🔴 Watch Live
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
