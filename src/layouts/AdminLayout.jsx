import { useEffect, useState } from "react";
import { LayoutDashboard } from "../assets/icons/LayoutDashboard";
import { ShieldCheck } from "../assets/icons/ShieldCheck";
import { FileText } from "../assets/icons/FileText";
import { MessageSquare } from "../assets/icons/MessageSquare";
import { Menu } from "../assets/icons/Menu";
import { X } from "../assets/icons/X";
import { Wallet } from "../assets/icons/Wallet";
import { Users } from "../assets/icons/Users";
import { Store } from "../assets/icons/Store";
import { User } from "../assets/icons/User";
import { ShoppingCart } from "../assets/icons/ShoppingCart";
import { NavLink, Outlet, Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { LogOut } from "../assets/icons/LogOut";
import { BellRing } from "../assets/icons/BellRing";
import { Globe } from "../assets/icons/Globe";
import { Activity } from "../assets/icons/Activity";
import { Zap } from "../assets/icons/Zap";
import { apiClient } from "../api/client";
import { useSiteConfig } from "../context/SiteConfigContext";
import { useTheme } from "../context/ThemeContext";
import { Moon } from "../assets/icons/Moon";
import { Sun } from "../assets/icons/Sun";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const { siteConfig } = useSiteConfig();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    const pullNotifications = async () => {
      try {
        const list = await apiClient.get("/content/notifications/my");
        if (!cancelled) {
          const items = Array.isArray(list) ? list : [];
          setUnreadNotifications(items.filter((n) => !n.read).length);
        }
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    };
    pullNotifications();
    intervalId = window.setInterval(pullNotifications, 12000);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { to: "/admin", label: "Stats", icon: LayoutDashboard, end: true },
    { to: "/admin/verify", label: "Verify Sellers", icon: ShieldCheck },
    { to: "/admin/contentcuration", label: "Content Curation", icon: FileText },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/website-control", label: "Website Control", icon: Globe },
    { to: "/admin/ads", label: "Ads", icon: Activity },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: Zap },
    { to: "/admin/guide", label: "Admin Guide", icon: FileText },
    {
      to: "/admin/supporttickets",
      label: "Support Tickets",
      icon: MessageSquare,
    },
    { to: "/admin/monetization", label: "Monetization", icon: Wallet },
    { to: "/admin/users", label: "Customers", icon: Users },
    { to: "/admin/sellers", label: "Sellers", icon: Store },
    { to: "/admin/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-zoop-clay/10 relative">
      {/* --- MOBILE HEADER TOGGLE --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-white dark:glass-card text-zoop-obsidian dark:text-white p-2 rounded-xl pointer-events-auto border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <Menu width={24} height={24} stroke="black" />
        </button>
      </div>

      {/* --- OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-white dark:glass-card border-r border-zoop-clay p-6 z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] md:shadow-none flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-10 flex-shrink-0">
          <div className="inline-flex items-center gap-2">
            {siteConfig?.brandLogoUrl ? (
              <img
                src={siteConfig.brandLogoUrl}
                alt="brand"
                className="h-8 w-8 rounded object-cover"
              />
            ) : null}
            <h2 className="text-zoop-copper font-900 tracking-tighter uppercase italic text-2xl">
              {siteConfig?.adminPanelTitle || "Admin Control"}
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-zoop-moss transition-colors"
          >
            <X width={24} height={24} className="stroke-current" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar -mr-4 pr-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 group shrink-0 ${
                  isActive
                    ? "bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] translate-x-2"
                    : "text-gray-500 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    width={20}
                    height={20}
                    stroke="currentColor"
                    className={isActive ? "" : "opacity-70 group-hover:opacity-100"}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-zoop-moss rounded-full animate-pulse"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* THEME TOGGLE */}
        <div className="mt-4 px-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-zoop-obsidian dark:text-white/75 group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zoop-moss text-zoop-obsidian' : 'bg-zoop-obsidian text-white'}`}>
                {isDarkMode ? <Moon width={16} height={16} /> : <Sun width={16} height={16} />}
              </div>
              <span className="group-hover:translate-x-1 transition-transform">
                {isDarkMode ? "Dark Theme" : "Light Theme"}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-zoop-moss' : 'bg-gray-200'}`}>
              <div className={`w-3 h-3 rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-5 bg-zoop-obsidian' : 'translate-x-0 bg-white'}`} />
            </div>
          </button>
        </div>

        <div className="mt-auto pt-6 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group font-bold mb-4"
          >
            <LogOut
              width={20}
              height={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Sign Out</span>
          </button>

          <div className="bg-zoop-obsidian text-white p-4 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-zoop-moss">
              System Status
            </p>
            <p className="text-xs font-bold mt-1">All Systems Normal</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain custom-scrollbar p-4 pt-20 md:p-8 md:pt-8">
        <div className="mb-4 flex items-center justify-between bg-white dark:glass-card border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
            Admin Console
          </p>
          <Link
            to="/admin/notifications"
            className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-bold text-zoop-obsidian dark:text-white"
            aria-label="Admin notifications"
          >
            <BellRing width={18} height={18} />
            <span className="hidden sm:inline">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-zoop-moss text-zoop-obsidian dark:text-white text-[10px] font-black flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
