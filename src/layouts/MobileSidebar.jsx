import React from "react";
import { Link } from "react-router-dom";
import { User } from "../assets/icons/User";
import { X } from "../assets/icons/X";
import { ChevronRight } from "../assets/icons/ChevronRight";
import { Moon } from "../assets/icons/Moon";
import { Sun } from "../assets/icons/Sun";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const MobileSidebar = ({ isOpen, onClose, categories = [], quickLinks = [] }) => {
  const { user, logout } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const displayCategories = categories.length > 0
    ? categories
    : ["Fashion", "Electronics", "Home", "Local", "Brands"];
  const helpLinks = quickLinks.length > 0
    ? quickLinks
    : [
        { label: "Your Orders", path: "/history" },
        { label: "Track Order", path: "/track" },
        { label: "Wishlist", path: "/wishlist" },
        { label: "Customer Support", path: "/contact" },
      ];

  return (
    <>
      {/* --- BACKDROP --- */}
      <div
        className={`fixed inset-0 bg-zoop-obsidian/60 z-[200] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* --- SIDEBAR PANEL --- */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[320px] max-w-[88vw] bg-white dark:glass-card z-[201] shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-in-out flex flex-col overflow-hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* 1. USER HEADER SECTION */}
        <div className="bg-zoop-obsidian p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-zoop-obsidian dark:bg-zoop-obsidian/40 rounded-2xl flex items-center justify-center text-xl shadow-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] shadow-zoop-copper/40 dark:shadow-zoop-moss/40 text-zoop-copper dark:text-zoop-moss">
              <User stroke="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zoop-moss uppercase tracking-widest">
                Hello,
              </p>
              <h3 className="text-white font-900 text-lg italic tracking-tighter">
                {user ? user.displayName || user.name || "Account" : "Sign In"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X width={20} height={20} stroke="currentColor" />
          </button>
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-6">
          {/* CATEGORIES SECTION */}
          <section className="px-8 mb-10">
            <h4 className="text-[10px] font-black text-zoop-copper uppercase tracking-[0.3em] mb-6">
              Shop by Category
            </h4>
            <ul className="space-y-4">
              {displayCategories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/category/${cat.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "")}`}
                    className="flex justify-between items-center group"
                    onClick={onClose}
                  >
                    <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-2 transition-transform">
                      {cat}
                    </span>
                    <ChevronRight
                      width={16}
                      height={16}
                      className="text-gray-200 group-hover:text-zoop-moss transition-colors"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="h-px bg-gray-50 dark:bg-white/5 mx-8 mb-10" />

          {/* MY ACCOUNT SECTION (Only show if logged in) */}
          {user && (
            <>
              <section className="px-8 mb-10">
                <h4 className="text-[10px] font-black text-zoop-copper uppercase tracking-[0.3em] mb-6">
                  My Account
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link
                      to="/profile"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-2 transition-transform">
                        My Profile
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-300 dark:text-gray-600 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile?edit=1"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-2 transition-transform">
                        Edit Profile
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-300 dark:text-gray-600 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/history"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-2 transition-transform">
                        My Orders
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-300 dark:text-gray-600 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/wishlist"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-2 transition-transform">
                        My Wishlist
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-300 dark:text-gray-600 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                </ul>
              </section>

              <div className="h-px bg-gray-50 dark:bg-white/5 mx-8 mb-10" />
            </>
          )}

          {/* THEME TOGGLE */}
          <section className="px-8 mb-10">
            <h4 className="text-[10px] font-black text-gray-800 dark:text-gray-300 uppercase tracking-[0.3em] mb-4">
              Appearance
            </h4>
            <button
              onClick={toggleTheme}
              className="w-full flex justify-between items-center group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 rounded-[16px] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zoop-moss text-zoop-obsidian' : 'bg-zoop-obsidian text-white'}`}>
                  {isDarkMode ? <Moon width={18} height={18} /> : <Sun width={18} height={18} />}
                </div>
                <span className="text-sm font-bold text-zoop-obsidian dark:text-white group-hover:translate-x-1 transition-transform">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-zoop-moss' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-6 bg-zoop-obsidian' : 'translate-x-0 bg-white'}`} />
              </div>
            </button>
          </section>

          {/* HELP & SETTINGS */}
          <section className="px-8 mb-10">
            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">
              Quick Links
            </h4>
            <ul className="space-y-4">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    onClick={onClose}
                    className="text-sm font-bold text-gray-500 hover:text-zoop-obsidian transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* APP STATS (Amazon Style Small Banner) */}
          <div className="mx-8 p-6 bg-zoop-canvas dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-zoop-copper mb-1">
              Same-Day
            </p>
            <p className="text-xs font-bold text-zoop-obsidian dark:text-white leading-tight">
              Pick your city to see products that can arrive today.
            </p>
          </div>
        </div>

        {/* 3. FOOTER LOGOUT/LOGIN */}
        <div className="border-t border-gray-100 dark:border-white/10 bg-gradient-to-t from-white via-white/95 to-white/80 dark:from-zoop-obsidian dark:via-zoop-obsidian/95 dark:to-zoop-obsidian/80 p-4 backdrop-blur-xl">
          {!user ? (
            <Link
              to="/login"
              className="w-full bg-zoop-obsidian text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
              onClick={onClose}
            >
              Sign Into Account
            </Link>
          ) : (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full bg-red-400 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-red-700 hover:text-white transition-all"
            >
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
