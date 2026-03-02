import React from "react";
import { Link } from "react-router-dom";
import { User } from "../assets/icons/User";
import { X } from "../assets/icons/X";
import { ChevronRight } from "../assets/icons/ChevronRight";
import { useUser } from "../context/UserContext";

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useUser();
  const categories = [
    "Men's Fashion",
    "Artisan Jewelry",
    "Home Decor",
    "Organic Wellness",
    "Local Footwear",
  ];
  const helpLinks = [
    { label: "Your Orders", path: "/history" },
    { label: "Track Logistics", path: "/track" },
    { label: "Customer Support", path: "/contact" },
    { label: "Sell on Zoop", path: "/seller/signup" },
  ];

  return (
    <>
      {/* --- BACKDROP --- */}
      <div
        className={`fixed h-[calc(100vh+4rem)] w-full inset-0 bg-zoop-obsidian/60 z-[200] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* --- SIDEBAR PANEL --- */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-0rem)] w-[320px] bg-white z-[201] shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* 1. USER HEADER SECTION */}
        <div className="bg-zoop-obsidian p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-zoop-obsidian rounded-2xl flex items-center justify-center text-xl shadow-md shadow-zoop-moss/40">
              <User stroke="#b7e84b" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zoop-moss uppercase tracking-widest">
                Hello,
              </p>
              <h3 className="text-white font-900 text-lg italic tracking-tighter">
                {user ? user.name : "Sign In_"}
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
        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          {/* CATEGORIES SECTION */}
          <section className="px-8 mb-10">
            <h4 className="text-[10px] font-black text-zoop-copper uppercase tracking-[0.3em] mb-6">
              Market Nodes
            </h4>
            <ul className="space-y-4">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/category/${cat.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "")}`}
                    className="flex justify-between items-center group"
                    onClick={onClose}
                  >
                    <span className="text-sm font-bold text-zoop-obsidian group-hover:translate-x-2 transition-transform">
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

          <div className="h-px bg-gray-50 mx-8 mb-10" />

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
                      <span className="text-sm font-bold text-zoop-obsidian group-hover:translate-x-2 transition-transform">
                        My Profile
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-200 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile?edit=1"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian group-hover:translate-x-2 transition-transform">
                        Edit Profile
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-200 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/history"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian group-hover:translate-x-2 transition-transform">
                        My Orders
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-200 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/wishlist"
                      className="flex justify-between items-center group"
                      onClick={onClose}
                    >
                      <span className="text-sm font-bold text-zoop-obsidian group-hover:translate-x-2 transition-transform">
                        My Wishlist
                      </span>
                      <ChevronRight
                        width={16}
                        height={16}
                        className="text-gray-200 group-hover:text-zoop-moss transition-colors"
                      />
                    </Link>
                  </li>
                </ul>
              </section>

              <div className="h-px bg-gray-50 mx-8 mb-10" />
            </>
          )}

          {/* HELP & SETTINGS */}
          <section className="px-8 mb-10">
            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">
              Support_Logs
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
          <div className="mx-8 p-6 bg-zoop-canvas rounded-[2rem] border border-gray-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-zoop-copper mb-1">
              Local Edge
            </p>
            <p className="text-xs font-bold text-zoop-obsidian leading-tight">
              Same-Day Delivery active in Surat Node.
            </p>
          </div>
        </div>

        {/* 3. FOOTER LOGOUT/LOGIN */}
        <div className="p-4 border-t border-gray-50 bg-white">
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
