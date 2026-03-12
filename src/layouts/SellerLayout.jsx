import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Menu } from "../assets/icons/Menu";
import { X } from "../assets/icons/X";
import { LayoutDashboard } from "../assets/icons/LayoutDashboard";
import { Package } from "../assets/icons/Package";
import { ClipboardList } from "../assets/icons/ClipboardList";
import { Wallet } from "../assets/icons/Wallet";
import { Plus } from "../assets/icons/Plus";
import { Box } from "../assets/icons/Box";
import { Store } from "../assets/icons/Store";
import { Zap } from "../assets/icons/Zap";
import { TrendingUp } from "../assets/icons/TrendingUp";
import { LogOut } from "../assets/icons/LogOut";
import { BellRing } from "../assets/icons/BellRing";
import { Shield } from "../assets/icons/Shield";
import { FileText } from "../assets/icons/FileText";
import { apiClient } from "../api/client";
import { useSiteConfig } from "../context/SiteConfigContext";
import { useTheme } from "../context/ThemeContext";
import { Moon } from "../assets/icons/Moon";
import { Sun } from "../assets/icons/Sun";

const SellerLayout = () => {
  const { user } = useUser();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const { siteConfig, replaceBrandText } = useSiteConfig();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    const pullNotifications = async () => {
      if (!user) {
        setUnreadNotifications(0);
        return;
      }
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
  }, [user]);

  if (siteConfig?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-zoop-obsidian text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zoop-moss">
            Maintenance Mode
          </p>
          <h1 className="text-4xl font-black">
            {replaceBrandText("Seller panel is temporarily unavailable")}
          </h1>
          <p className="text-white/70">
            {siteConfig?.maintenanceMessage ||
              "We are applying website updates. Please check back shortly."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect if pending verification or not yet onboarded
  if (user && user.role === "seller") {
    if (user.verificationStatus === "pending") {
      return <Navigate to="/seller/waiting" replace />;
    }
    if (!user.verificationStatus) {
      return <Navigate to="/seller/onboarding" replace />;
    }
    if (user.verificationStatus === "rejected") {
      return <Navigate to="/seller/waiting" replace />;
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      navigate("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const navItems = [
    { to: "/seller", label: "Dashboard", end: true, icon: LayoutDashboard },
    { to: "/seller/add-product", label: "Add Product", icon: Plus },
    { to: "/seller/orders", label: "Orders", icon: ClipboardList },
    { to: "/seller/products", label: "Products", icon: Box },
    { to: "/seller/ads", label: "Ads & Promo", icon: TrendingUp },
    { to: "/seller/payouts", label: "Payouts", icon: Wallet },
    { to: "/seller/subscription", label: "Subscription Plans", icon: Zap },
    { to: "/seller/instructions", label: "Seller Guide", icon: FileText },
    { to: "/seller/settings", label: "Store Settings", icon: Shield },
    { to: "/seller/profile", label: "Store Profile", icon: Store },
  ];

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-zoop-canvas relative">
      {/* --- MOBILE HEADER TOGGLE --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian p-2 rounded-xl pointer-events-auto shadow-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
          <Menu width={24} height={24} className="stroke-current" />
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
        className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-zoop-obsidian text-zoop-obsidian dark:text-white border-r border-gray-100 dark:border-white/10 p-8 z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] md:shadow-none flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={
          user?.subscription?.sidebarColor
            ? { backgroundColor: user.subscription.sidebarColor }
            : undefined
        }
      >
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <div className="inline-flex items-center gap-2">
            {siteConfig?.brandLogoUrl ? (
              <img
                src={siteConfig.brandLogoUrl}
                alt="brand"
                className="h-8 w-8 rounded object-cover bg-white/10"
              />
            ) : null}
            <h2 className="text-zoop-moss font-900 text-2xl tracking-tighter uppercase italic">
              Seller
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-zoop-moss transition-colors"
          >
            <X width={24} height={24} className="stroke-current" />
          </button>
        </div>

        {/* Seller info chip */}
        {user && (
          <div className="mb-6 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-3 shrink-0 border border-gray-100 dark:border-white/5">
            <div className="w-9 h-9 bg-zoop-moss rounded-full flex items-center justify-center text-zoop-obsidian font-black text-sm shrink-0">
              {(user.displayName ||
                user.name ||
                user.email ||
                "S")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zoop-obsidian dark:text-white text-xs font-black truncate">
                {user.displayName || user.name || "Seller"}
              </p>
              <p className="text-gray-500 dark:text-white/40 text-[10px] truncate">{user.email}</p>
              {user?.subscription?.planName && (
                <p className="text-zoop-moss text-[10px] font-black truncate mt-1">
                  {user.subscription.planName}
                </p>
              )}
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar -mr-4 pr-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 ${
                  isActive
                    ? "bg-zoop-moss text-zoop-obsidian dark:text-white shadow-[0_0_20px_rgba(183,232,75,0.3)] scale-105"
                    : "text-gray-500 dark:text-white/75 hover:text-zoop-obsidian dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    width={18}
                    height={18}
                    stroke={isActive ? "currentColor" : "currentColor"}
                    className={isActive ? "" : "opacity-70 group-hover:opacity-100"}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* THEME TOGGLE */}
        <div className="mt-4 px-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/75 group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zoop-moss text-zoop-obsidian' : 'bg-zoop-obsidian text-white'}`}>
                {isDarkMode ? <Moon width={16} height={16} /> : <Sun width={16} height={16} />}
              </div>
              <span className="group-hover:translate-x-1 transition-transform">
                {isDarkMode ? "Dark Theme" : "Light Theme"}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-zoop-moss' : 'bg-white/20'}`}>
              <div className={`w-3 h-3 rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-5 bg-zoop-obsidian' : 'translate-x-0 bg-white'}`} />
            </div>
          </button>
        </div>

        {/* Logout button at bottom */}
        <div className="mt-6 pt-6 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut width={18} height={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain custom-scrollbar p-4 pt-20 md:p-10 md:pt-10">
        <div className="mb-4 flex items-center justify-between bg-white dark:glass-card border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
            Seller Workspace
          </p>
          <Link
            to="/seller/notifications"
            className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-bold text-zoop-obsidian dark:text-white"
            aria-label="Seller notifications"
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

export default SellerLayout;
