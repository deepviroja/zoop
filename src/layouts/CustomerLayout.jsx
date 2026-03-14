import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import LocationModal from "../components/shared/LocationModal";
import MobileSidebar from "./MobileSidebar";
import Loader from "../components/ui/Loader";
import { Shield } from "../assets/icons/Shield";
import { useUser } from "../context/UserContext";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon } from "../assets/icons/SearchIcon";
import AnimatedCartIcon from "../components/shared/AnimatedCartIcon";

import BottomNav from "../components/shared/BottomNav";
import { apiClient } from "../api/client";
import { Menu } from "../assets/icons/Menu";
import { X } from "../assets/icons/X";
import { ChevronDown } from "../assets/icons/ChevronDown";
import { Zap } from "../assets/icons/Zap";
import { Heart } from "../assets/icons/Heart";
import { Instagram } from "../assets/icons/Instagram";
import { Facebook } from "../assets/icons/Facebook";
import { Box } from "../assets/icons/Box";
// Heart replaces Star for wishlist to align with updated UX
import { BellRing } from "../assets/icons/BellRing";
import { ChevronLeft } from "../assets/icons/ChevronLeft";
import { ChevronRight } from "../assets/icons/ChevronRight";
import { User } from "../assets/icons/User";
import { LogOut } from "../assets/icons/LogOut";
import { useSiteConfig } from "../context/SiteConfigContext";
import { useTheme } from "../context/ThemeContext";
import { ShoppingCart } from "../assets/icons/ShoppingCart";
import { Moon } from "../assets/icons/Moon";
import { Sun } from "../assets/icons/Sun";
import { formatInrWithSymbol } from "../utils/currency";
import { useQuery } from "../hooks/useQuery";

const CustomerLayout = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { location, updateLocation, isLoading, user, logout } = useUser();
  const [searchSearchParams] = useSearchParams();
  const locationPath = useLocation();
  const qParam = searchSearchParams.get("q");

  const [searchQuery, setSearchQuery] = useState(qParam || ""); // Initialize with URL param
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showDesktopSuggestions, setShowDesktopSuggestions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const desktopSearchRef = useRef(null);
  const { siteConfig, brandName, replaceBrandText } = useSiteConfig();

  useEffect(() => {
    setSearchQuery(qParam || "");
  }, [qParam]);

  const { data: searchProductsData } = useQuery({
    queryKey: ["products", "search_suggestions"],
    queryFn: () => apiClient.get("/products"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", "my", user?.uid || user?.id || user?.email || "anon"],
    enabled: Boolean(user),
    queryFn: () => apiClient.get("/content/notifications/my"),
    staleTime: 10 * 1000,
    refetchInterval: 12 * 1000,
    initialData: [],
  });

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetchNotifications, user]);

  const searchProducts = Array.isArray(searchProductsData) ? searchProductsData : [];
  const notifications = user && Array.isArray(notificationsData) ? notificationsData : [];
  const unreadNotifications = user ? notifications.filter((n) => !n.read).length : 0;
  const notificationItems = user ? notifications.slice(0, 6) : [];

  // Scroll direction logic
  // On mobile the header is always visible (like BottomNav).
  // On desktop (md+) it hides on scroll-down and reappears on scroll-up.
  const [scrollDir, setScrollDir] = useState("up");
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollYRef = useRef(0);
  const scrollDirRef = useRef("up");
  const lastDirChangeYRef = useRef(0);
  const scrollTickingRef = useRef(false);

  useEffect(() => {
    scrollDirRef.current = scrollDir;
  }, [scrollDir]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        // Compact header state (avoid redundant renders)
        const nextCompact = currentScrollY > (window.innerWidth < 768 ? 80 : 90);
        setIsCompact((prev) => (prev === nextCompact ? prev : nextCompact));

        // Always reveal when near top to avoid "stuck hidden" state
        if (currentScrollY <= 8) {
          if (scrollDirRef.current !== "up") setScrollDir("up");
          scrollDirRef.current = "up";
          lastDirChangeYRef.current = currentScrollY;
          lastScrollYRef.current = currentScrollY;
          scrollTickingRef.current = false;
          return;
        }

        const diff = currentScrollY - lastScrollYRef.current;
        const absDiff = Math.abs(diff);

        // Ignore tiny scroll jitter to prevent flicker
        if (absDiff < 6) {
          scrollTickingRef.current = false;
          return;
        }

        const nextDir = diff > 0 ? "down" : "up";

        // Add hysteresis: don't flip direction unless the user scrolls enough
        const directionFlipDistance = window.innerWidth < 768 ? 18 : 24;
        const sinceLastFlip = Math.abs(currentScrollY - lastDirChangeYRef.current);

        if (nextDir !== scrollDirRef.current && sinceLastFlip >= directionFlipDistance) {
          // Only start hiding after a small distance from top
          if (nextDir === "down" && currentScrollY <= 50) {
            scrollTickingRef.current = false;
            return;
          }
          setScrollDir(nextDir);
          scrollDirRef.current = nextDir;
          lastDirChangeYRef.current = currentScrollY;
        }

        lastScrollYRef.current = currentScrollY;
        scrollTickingRef.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Always jump to top after navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [locationPath.pathname]);

  const desktopLiveResults =
    searchQuery.trim() === ""
      ? []
      : searchProducts.filter((product) => {
          const q = searchQuery.toLowerCase();
          const title = (product.title || product.name || "").toLowerCase();
          const brand = String(product.brand || "").toLowerCase();
          const category = String(
            product.category || product.categoryId || "",
          ).toLowerCase();
          const desc = String(product.description || "").toLowerCase();
          return (
            Number(product.stock || 0) > 0 &&
            (title.includes(q) ||
              brand.includes(q) ||
              category.includes(q) ||
              desc.includes(q))
          );
        });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDesktopSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    // setShowDesktopSuggestions(false); // Removed sync state update
    // Instead we rely on path transitions causing re-renders or other effects
  }, [locationPath.pathname, qParam]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!desktopSearchRef.current) return;
      if (!desktopSearchRef.current.contains(e.target)) {
        setShowDesktopSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (isLoading) return <Loader fullScreen />;

  const brandLogoUrl = String(siteConfig?.brandLogoUrl || "").trim();
  const brandTextColor = String(siteConfig?.brandTextColor || "#b7e84b");
  const brandFontFamily = String(siteConfig?.brandFontFamily || "inherit");
  const brandFontWeight = String(siteConfig?.brandFontWeight || "900");
  const brandStyle = {
    color: brandTextColor,
    fontFamily: brandFontFamily,
    fontWeight: brandFontWeight,
  };
  const announcementBanner =
    siteConfig?.announcementBanner ||
    `Order before 6 PM -> SAME-DAY delivery in ${location}!`;
  const rawSubNav =
    Array.isArray(siteConfig?.subNavCategories) &&
    siteConfig.subNavCategories.length > 0
      ? siteConfig.subNavCategories
      : [
          "Electronics",
          "Fashion",
          "Homemade Food",
          "Local Artisans",
          "Global Brands",
        ];

  const rawSidebarCats =
    Array.isArray(siteConfig?.customerSidebarCategories) &&
    siteConfig.customerSidebarCategories.length > 0
      ? siteConfig.customerSidebarCategories
      : rawSubNav;

  // Filter out categories that have zero active products in searchProducts
  const filterActiveCategories = (categories) => {
    if (!searchProducts || searchProducts.length === 0) return categories; // Show all until products load
    return categories.filter((cat) => {
      return searchProducts.some((p) => {
        const catStr = String(cat).toLowerCase().trim();
        const pCat = String(p.category || p.categoryId || "").toLowerCase();
        return pCat.includes(catStr) || catStr.includes(pCat);
      });
    });
  };

  const subNavCategories = filterActiveCategories(rawSubNav);
  const customerSidebarCategories = filterActiveCategories(rawSidebarCats);

  const customerSidebarQuickLinks =
    Array.isArray(siteConfig?.customerSidebarQuickLinks) &&
    siteConfig.customerSidebarQuickLinks.length > 0
      ? siteConfig.customerSidebarQuickLinks
      : [
          { label: "Your Orders", path: "/history" },
          { label: "Track Order", path: "/track" },
          { label: "Wishlist", path: "/wishlist" },
          { label: "Customer Support", path: "/contact" },
        ];

  const mobileAccountLink =
    String(user?.role || "") === "admin"
      ? { label: "Admin Panel", path: "/admin" }
      : String(user?.role || "") === "seller"
        ? { label: "Seller Panel", path: "/seller" }
        : user
          ? { label: "My Account", path: "/profile" }
          : { label: "Login", path: "/login" };

  if (siteConfig?.maintenanceMode && String(user?.role || "") !== "admin") {
    return (
      <div className="min-h-screen bg-zoop-obsidian text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zoop-moss">
            Maintenance Mode
          </p>
          <h1 className="text-4xl font-black">
            {replaceBrandText("Zoop is temporarily unavailable")}
          </h1>
          <p className="text-white/70">
            {siteConfig?.maintenanceMessage ||
              "We are applying website updates. Please check back shortly."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zoop-canvas dark:bg-[#050505] relative font-sans">
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-zoop-obsidian flex flex-col items-center justify-center text-white"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-zoop-moss mb-4"></div>
            <p className="font-black text-xl text-zoop-moss animate-pulse tracking-widest">
              LOGGING OUT...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={updateLocation}
      />

      {/* --- TOP NOTIFICATION BAR (Not Sticky) --- */}
      <div
        className={`bg-gradient-to-r from-zoop-moss to-green-500 text-zoop-obsidian dark:text-white font-black text-center text-xs md:text-sm z-50 shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] animate-pulse flex items-center justify-center gap-2 transition-all duration-500 ${
          scrollDir === "down"
            ? "h-0 opacity-0 overflow-hidden pointer-events-none"
            : "py-2.5 opacity-100"
        }`}
      >
        <Zap width={16} height={16} fill="black" />
        {announcementBanner}
        <Zap width={16} height={16} fill="black" />
      </div>

      {/* --- HEADER (Sticky Liquid) --- */}
      <header
        className={`supports-[backdrop-filter]:backdrop-blur-3xl bg-white/70 dark:bg-black/60 self-center text-zoop-obsidian dark:text-white sticky top-0 z-[60] transition-all duration-500 shadow-sm border-b border-gray-100 dark:border-white/10 ${
          scrollDir === "down" ? "w-[98%] md:w-[96%] px-[20%] rounded-full top-2 mx-auto" : "w-full"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 relative ">
          <div
            className={`flex items-center gap-3 transition-all duration-500 overflow-visible ${
              scrollDir === "down" 
                ? "h-16 py-1 justify-between px-6" 
                : "h-20 md:h-24 py-2 justify-between px-4"
            }`}
          >
            {/* LOGO */}
            <Link
              to="/"
              className={`transition-all duration-500 flex items-center gap-2 flex-shrink-0 ${
                scrollDir === "down" 
                  ? "text-2xl scale-110" 
                  : "text-3xl md:text-4xl pl-2 md:pl-4 tracking-tighter"
              }`}
            >
              <span 
                style={brandStyle}
                className={`transition-transform duration-500 font-black tracking-tighter py-1 px-4 rounded-full  ${scrollDir === 'down' ? 'opacity-100 ' : ''}`}
              >
                {brandName || "ZOOP"}
              </span>
            </Link>


            {/* DESKTOP SEARCH BAR - SMART CAPSULE */}
            <form
              ref={desktopSearchRef}
              onSubmit={handleSearch}
              className={`hidden md:flex items-center bg-white/95 dark:bg-zoop-obsidian/90 backdrop-blur-2xl rounded-full shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-700 ring-2 ${
                scrollDir === "down"
                  ? "w-[420px] max-w-[44vw] mx-4 py-1"
                  : "flex-1 mx-8 max-w-3xl"
              } relative ${
                searchQuery
                  ? "ring-zoop-moss/50 shadow-zoop-moss/20 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
                  : "ring-transparent"
              } focus-within:ring-zoop-moss focus-within:shadow-[0_0_20px_rgba(163,230,53,0.3)]`}
            >
              {/* Location Dropdown (desktop-only, hidden in compact header) */}
              {scrollDir !== "down" && (
                <>
                  <div
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center pl-6 pr-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-50/10 rounded-l-full group"
                  >
                    <div className="relative mr-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-zoop-moss opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-zoop-moss"></span>
                    </div>
                    <span className="mr-2 text-xs font-black uppercase text-zoop-obsidian dark:text-white whitespace-nowrap">
                      {location}
                    </span>
                    <div
                      className={`transition-transform duration-300 text-gray-400 group-hover:text-zoop-obsidian ${
                        isLocationModalOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown width={14} height={14} />
                    </div>
                  </div>

                </>
              )}

              {/* Search Input */}
              <div className="px-1 flex-1 relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDesktopSuggestions(true);
                  }}
                  onFocus={() => setShowDesktopSuggestions(true)}
                  placeholder="Search products, brands, categories"
                  className={`w-full pl-4 pr-12 rounded-full ${
                    isCompact ? "py-2.5 text-xs" : "py-3 text-sm"
                  } text-zoop-obsidian dark:text-white bg-transparent focus:outline-none font-medium placeholder:text-gray-400`}
                />

                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-12 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X width={16} height={16} />
                  </button>
                )}

                {/* Floating Search Button */}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-zoop-moss text-zoop-obsidian dark:text-white p-2 rounded-full font-black hover:bg-zoop-moss/80 hover:scale-105 active:scale-95 transition-all shadow-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center"
                >
                  <SearchIcon width={18} height={18} />
                </button>
              </div>

              {showDesktopSuggestions && searchQuery.trim() !== "" && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:glass-card border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] max-h-[70vh] overflow-y-auto p-3 z-[70]">
                  {desktopLiveResults.length > 0 ? (
                    <div className="space-y-2">
                      {desktopLiveResults.slice(0, 20).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            navigate(`/product/${product.id}`);
                            setSearchQuery("");
                            setShowDesktopSuggestions(false);
                          }}
                          className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={product.thumbnailUrl || product.image}
                            alt={product.title || product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-white/10"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zoop-obsidian dark:text-white truncate">
                              {product.title || product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.brand || brandName} •{" "}
                              {formatInrWithSymbol(product.price || 0, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                          <ChevronRight
                            width={16}
                            height={16}
                            className="text-gray-300"
                          />
                        </button>
                      ))}
                      <button
                        type="submit"
                        className="w-full mt-1 py-2.5 rounded-xl bg-zoop-obsidian text-white text-sm font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-colors"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 px-2 py-3">
                      No products found
                    </p>
                  )}
                </div>
              )}
            </form>

            {/* RIGHT ACTIONS */}
            <div
              className={`flex items-center gap-3 md:gap-4 text-sm font-bold transition-all duration-500 ${
                scrollDir === "down"
                  ? "opacity-100 visible w-auto translate-x-0 scale-100"
                  : "opacity-100 visible translate-x-0 scale-100"
              }`}
            >
              {user && scrollDir !== "down" && (
                <div className="hidden md:block relative group">
                  <button
                    type="button"
                    onClick={() => navigate("/notifications")}
                    className="relative p-2.5 rounded-full bg-gray-50/50 dark:bg-white/5 hover:bg-zoop-moss/20 transition-all border border-gray-100 dark:border-white/10"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <BellRing width={20} height={20} className="stroke-zoop-obsidian dark:stroke-white" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-zoop-moss text-zoop-obsidian dark:text-white text-[10px] font-black flex items-center justify-center">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:glass-card rounded-xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                      <p className="text-sm font-black text-zoop-obsidian dark:text-white">
                        Notifications
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/notifications")}
                        className="text-xs font-bold text-zoop-moss hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2">
                      {notificationItems.length === 0 ? (
                        <p className="text-sm text-gray-500 p-2">
                          No notifications yet
                        </p>
                      ) : (
                        notificationItems.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => navigate("/notifications")}
                            className={`w-full text-left p-2 rounded-lg mb-1 ${
                              n.read
                                ? "hover:bg-gray-50 dark:hover:bg-white/5"
                                : "bg-zoop-moss/10 hover:bg-zoop-moss/20"
                            }`}
                          >
                            <p className="text-sm font-bold text-zoop-obsidian dark:text-white line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {n.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => navigate("/notifications")}
                  className="md:hidden relative p-3 rounded-xl bg-gray-50/50 dark:bg-white/5 hover:bg-zoop-moss/15 transition-all border border-gray-100 dark:border-white/10 text-zoop-obsidian dark:text-white"
                  aria-label="Notifications"
                >
                  <BellRing width={26} height={26} className="stroke-current" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-zoop-moss text-zoop-obsidian dark:text-white text-[10px] font-black flex items-center justify-center">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </button>
              )}
              {/* MOBILE CART ICON */}
              <div className="md:hidden block -mr-2 scale-90">
                <AnimatedCartIcon />
              </div>

              {/* Admin / Seller Panel Quick Access Button */}
              {user && user.role === "admin" && scrollDir !== "down" && (
                <Link
                  to="/admin"
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-black hover:bg-red-600 transition-all"
                >
                  <Shield width={14} height={14} />
                  Admin Panel
                </Link>
              )}
              {user && user.role === "seller" && scrollDir !== "down" && (
                <Link
                  to={
                    user.verificationStatus === "approved"
                      ? "/seller/dashboard"
                      : user.verificationStatus === "pending" ||
                          user.verificationStatus === "rejected"
                        ? "/seller/waiting"
                        : "/seller/onboarding"
                  }
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-lg text-xs font-black hover:bg-zoop-moss/80 transition-all"
                >
                  <Box width={14} height={14} />
                  {user.verificationStatus === "approved"
                    ? "Seller Panel"
                    : "Seller Status"}
                </Link>
              )}

              {user ? (
                <>
                  {/* Desktop Account Dropdown */}
                  <div className="hidden md:block relative group">
                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all">
                      {scrollDir !== "down" && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            Hello
                          </p>
                          <p className="text-sm font-bold text-zoop-moss leading-none flex items-center gap-1">
                            {user.displayName || user.email?.split("@")[0]}
                            <ChevronDown
                              width={12}
                              height={12}
                              stroke="currentColor"
                              className="text-zoop-obsidian dark:text-white group-hover:rotate-180 transition-transform"
                            />
                          </p>
                        </div>
                      )}
                      {scrollDir === "down" && (
                        <div className="text-right ">
                          <p className="text-sm font-bold text-zoop-moss leading-none flex items-center gap-1">
                            {user.displayName || user.email?.split("@")[0]}
                            <ChevronDown
                              width={24}
                              height={24}
                              stroke="currentColor"
                              className="text-zoop-obsidian dark:text-white group-hover:rotate-180 transition-transform"
                            />
                          </p>
                        </div>
                      )}
                      <div className="h-8 w-8 bg-white/10 dark:bg-zoop-moss/20 rounded-full flex items-center justify-center">
                        <User width={16} height={16} className="text-zoop-obsidian dark:text-zoop-moss" />
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:glass-card rounded-xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="p-4 border-b border-gray-100 dark:border-white/10">
                        <p className="text-sm font-black text-zoop-obsidian dark:text-white">
                          {user.displayName || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.role && user.role !== "customer" && (
                          <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest bg-zoop-moss/20 text-zoop-obsidian dark:text-white px-2 py-0.5 rounded-full">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 py-2 px-2 w-full  items-left">
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            activeClassName="bg-zoop-moss text-white"
                            className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-bold text-zoop-moss"
                          >
                            <Shield width={18} height={18} />
                            Admin Panel
                          </Link>
                        )}
                        {user.role === "seller" && (
                          <Link
                            to={
                              user.verificationStatus === "approved"
                                ? "/seller/dashboard"
                                : user.verificationStatus === "pending" ||
                                    user.verificationStatus === "rejected"
                                  ? "/seller/waiting"
                                  : "/seller/onboarding"
                            }
                            className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-zoop-moss"
                          >
                            <Box width={18} height={18} />
                            {user.verificationStatus === "approved"
                              ? "Seller Panel"
                              : "Seller Status"}
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <User width={18} height={18} />
                          My Profile
                        </Link>
                        <Link
                          to="/history"
                          className="flex items-center h-8 gap-2 py-1 px-0 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <Box width={18} height={18} />
                          My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <Heart width={18} height={18} />
                          My Wishlist
                        </Link>
                        <Link
                          to="/cart"
                          className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <ShoppingCart width={18} height={18} />
                          My Cart
                        </Link>

                        <div className="h-px bg-gray-100 dark:bg-white/10 my-2" />

                        <button
                          onClick={async () => {
                            setIsLoggingOut(true);
                            setTimeout(async () => {
                              await logout();
                              setIsLoggingOut(false);
                            }, 800);
                          }}
                          className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-bold text-red-600"
                        >
                          <LogOut width={18} height={18} />
                          Logout
                        </button>

                        <div className="h-px bg-gray-100 dark:bg-white/10 my-2" />

                        {/* Theme Toggle in Dropdown */}
                        <button
                          onClick={toggleTheme}
                          className="flex items-center justify-between w-full h-10 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            {isDarkMode ? (
                              <Moon width={18} height={18} className="text-zoop-moss" />
                            ) : (
                              <Sun width={18} height={18} className="text-zoop-obsidian" />
                            )}
                            {isDarkMode ? "Dark Mode" : "Light Mode"}
                          </div>
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-zoop-moss' : 'bg-gray-300'}`}>
                            <div className={`w-3 h-3 rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-4 bg-zoop-obsidian' : 'translate-x-0 bg-white'}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {scrollDir === "down" ? (
                    <Link
                      to="/login"
                      className="hidden md:flex items-center gap-2 bg-zoop-moss text-zoop-obsidian dark:text-white px-4 py-2 rounded-full font-black hover:bg-zoop-moss/85 transition-colors shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] text-xs"
                      aria-label="Sign in"
                    >
                      <User width={16} height={16} className="stroke-current" />
                      Login
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/seller/signup"
                        className="hidden lg:block hover:text-zoop-moss text-zoop-obsidian dark:text-white transition-colors"
                      >
                        Become a Seller
                      </Link>
                      <Link
                        to="/login"
                        className="hidden sm:block bg-zoop-moss text-zoop-obsidian dark:text-white px-4 py-2 rounded-sm font-black hover:bg-white hover:scale-105 transition-all shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] text-xs md:text-sm"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </>
              )}
              {scrollDir !== "down" && (
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    to="/wishlist"
                    className="hover:scale-110 active:scale-95 transition-transform text-zoop-obsidian dark:text-white"
                  >
                    <Heart width={24} height={24} className="stroke-current" />
                  </Link>
                  <AnimatedCartIcon
                    stroke="#1a1a1a"
                    className="text-zoop-obsidian dark:text-white active:scale-95 transition-transform"
                  />
                </div>
              )}
              <button onClick={() => setSidebarOpen(true)} className="block">
                <div className="relative group">
                  <div className="h-10 w-10 bg-zoop-moss/80 hover:bg-white/10 dark:hover:bg-white/10 rounded-xl flex items-center justify-center cursor-pointer transition-all group shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                    <Menu width={24} height={24} className="stroke-zoop-obsidian dark:stroke-zoop-obsidian" />
                  </div>
                  <span className="absolute -top-1 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoop-moss opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-zoop-moss border-2 border-white"></span>
                  </span>
                </div>
              </button>
            </div>
          </div>
          {/* Redesigned Mobile Header Action Row - Hidden on scroll down for better focus */}
          <div className={`md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 transition-all duration-300 ${scrollDir === 'down' ? 'h-0 opacity-0 invisible overflow-hidden' : 'h-12 opacity-100 visible'}`}>
            <Link
              to={mobileAccountLink.path}
              className="shrink-0 rounded-full bg-zoop-moss px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zoop-obsidian dark:text-white shadow-lg shadow-zoop-moss/20"
            >
              {mobileAccountLink.label}
            </Link>
          </div>
        </div>

        {/* MOBILE FULL SCREEN SEARCH */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 bg-white dark:glass-card z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
            <form
              onSubmit={handleSearch}
              className="p-4 flex items-center gap-3 bg-white dark:glass-card border-b border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            >
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-gray-500 p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft width={24} height={24} />
              </button>
              <div className="flex-1 flex bg-gray-100 dark:bg-white/10 rounded-xl overflow-hidden items-center group focus-within:ring-2 ring-zoop-moss/20 transition-all">
                <div className="pl-3 text-gray-400">
                  <SearchIcon width={18} height={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  className="w-full px-3 py-3 bg-transparent text-zoop-obsidian dark:text-white text-base font-medium focus:outline-none placeholder:text-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-3 text-gray-400 hover:text-red-500"
                  >
                    <X width={16} height={16} />
                  </button>
                )}
              </div>
            </form>

            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-white/5 p-4">
              {/* Live Results */}
              {searchQuery.trim() !== "" ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Top Results
                  </p>
                  {searchProducts
                    .filter(
                      (p) =>
                        Number(p.stock || 0) > 0 &&
                        ((p.title || p.name || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                          String(p.brand || "")
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
                    )
                    .slice(0, 10)
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          navigate(`/product/${product.id}`);
                          setIsMobileSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-4 bg-white dark:glass-card p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform"
                      >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.thumbnailUrl || product.image}
                            alt={product.title || product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zoop-obsidian dark:text-white text-sm line-clamp-1">
                            {product.title || product.name}
                          </p>
                          <p className="text-gray-500 text-xs mb-1">
                            {product.brand}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-zoop-obsidian dark:text-white font-black text-sm">
                              {formatInrWithSymbol(product.price || 0, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            {Number(product.stock || 0) > 0 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-300">
                          <ChevronRight width={20} height={20} />
                        </div>
                      </div>
                    ))}
                  {searchProducts.filter(
                    (p) =>
                      Number(p.stock || 0) > 0 &&
                      (p.title || p.name || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  ).length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-white dark:glass-card inline-block p-4 rounded-full mb-3 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        <SearchIcon
                          width={32}
                          height={32}
                          className="text-gray-300"
                        />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No products found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try searching for something else
                      </p>
                    </div>
                  )}
                  {
                    // "View all results" button
                    searchProducts.filter(
                      (p) =>
                        Number(p.stock || 0) > 0 &&
                        (p.title || p.name || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    ).length > 0 && (
                      <button
                        onClick={handleSearch}
                        className="w-full py-3 bg-white dark:glass-card border border-gray-200 dark:border-white/10 text-zoop-moss font-bold rounded-xl mt-4"
                      >
                        View All Results
                      </button>
                    )
                  }
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <p className="text-sm text-gray-400">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setSearchQuery("Shoes")}
                      className="px-4 py-2 bg-white dark:glass-card border border-gray-200 dark:border-white/10 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400"
                    >
                      Shoes
                    </button>
                    <button
                      onClick={() => setSearchQuery("Watch")}
                      className="px-4 py-2 bg-white dark:glass-card border border-gray-200 dark:border-white/10 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400"
                    >
                      Watch
                    </button>
                    <button
                      onClick={() => setSearchQuery("Local")}
                      className="px-4 py-2 bg-white dark:glass-card border border-gray-200 dark:border-white/10 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400"
                    >
                      Local
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* MOBILE SIDEBAR MODAL ROOT */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={customerSidebarCategories}
        quickLinks={customerSidebarQuickLinks}
      />

      {/* --- SUB NAV --- */}
      <nav className="bg-white mt-4 dark:glass-card dark:bg-black border-b border-gray-200 shadow-sm z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex gap-4 md:gap-8 items-center overflow-x-auto whitespace-nowrap no-scrollbar text-sm">
            <NavLink
              to="/products?type=Local"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2  md:text-sm shadow-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-full font-black text-xs transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-zoop-obsidian text-white"
                    : "bg-zoop-moss text-zoop-obsidian dark:text-white hover:bg-zoop-moss/60"
                }`
              }
            >
              <Zap width={18} height={18} />
              SAME-DAY
            </NavLink>
            <NavLink
              to="/products"
              end
              className={({ isActive }) =>
                `text-xs md:text-sm font-bold uppercase tracking-tighter transition-all flex-shrink-0 ${
                  isActive
                    ? "text-zoop-copper  border-b-2 border-zoop-copper pb-1"
                    : "text-gray-500 dark:text-gray-300 hover:text-zoop-obsidian dark:hover:text-white hover:border-b-2 hover:border-zoop-moss pb-1 border-b-2 border-transparent"
                }`
              }
            >
              Discover All Products
            </NavLink>

            {subNavCategories.map((item) => (
              <NavLink
                key={item}
                to={`/category/${item.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `text-xs md:text-sm font-bold uppercase tracking-tighter transition-all flex-shrink-0 ${
                    isActive
                      ? "text-zoop-copper border-b-2 border-zoop-copper pb-1"
                      : "text-gray-500 dark:text-gray-300 hover:text-zoop-obsidian dark:hover:text-white hover:border-b-2 hover:border-zoop-moss pb-1 border-b-2 border-transparent"
                  }`
                }
              >
                {item}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      {/* MAIN CONTENT */}
      <main className="pb-20 relative min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={locationPath.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet context={{ scrollDir }} />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-zoop-obsidian text-white pt-16 pb-8 mt-20">
        {/* Your existing footer code - already mobile friendly */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-16 border-b border-white/10 text-sm">
            {/* Value props */}
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <Zap width={32} height={32} stroke="#b7e84b" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Hyper-Local Speed</h4>
                <p className="text-white/60 text-xs mt-1">
                  Delivered within 4-6 hours from your city
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <Heart width={32} height={32} stroke="#b7e84b" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Artisan First</h4>
                <p className="text-white/60 text-xs mt-1">
                  Zero commission for home-makers & micro sellers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <Box width={32} height={32} stroke="#b7e84b" />
              </div>
              <div>
                <h4 className="font-bold text-lg">National Reach</h4>
                <p className="text-white/60 text-xs mt-1">
                  Ship anywhere in India with trusted partners
                </p>
              </div>
            </div>
          </div>

          {/* --- MIDDLE SECTION: LINKS --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-sm">
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className="text-3xl tracking-tighter inline-flex items-center gap-2"
              >
                {brandLogoUrl ? (
                  <img
                    src={brandLogoUrl}
                    alt={brandName}
                    className="h-7 w-7 rounded object-cover bg-white dark:glass-card"
                  />
                ) : null}
                <span style={brandStyle}>{brandName}</span>
              </Link>
              <p className="text-white/40 text-xs mt-4">
                The bridge between local craftsmanship and global standards.
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                Demo purpose only. Prices, offers, stock, payments, and
                deliveries shown here are for demonstration and testing.
              </p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-zoop-moss mb-6">
                Shop {brandName}
              </h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li>
                  <Link
                    to="/category/local-artisans"
                    className="hover:text-white transition-colors"
                  >
                    Local Artisans
                  </Link>
                </li>
                <li>
                  <Link
                    to="/category/global-brands"
                    className="hover:text-white transition-colors"
                  >
                    Global Brands
                  </Link>
                </li>
                <li>
                  <Link
                    to="/category/fashion"
                    className="hover:text-white transition-colors"
                  >
                    Men's Collection
                  </Link>
                </li>
                <li>
                  <Link
                    to="/category/fashion"
                    className="hover:text-white transition-colors"
                  >
                    Women's Ethnic
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-zoop-moss mb-6">
                Sell with Us
              </h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li>
                  <Link
                    to="/seller/signup"
                    className="hover:text-white transition-colors"
                  >
                    Become a Seller
                  </Link>
                </li>
                <li>
                  <Link
                    to="/seller/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Seller Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/seller/instructions"
                    className="hover:text-white transition-colors"
                  >
                    Seller Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="hover:text-white transition-colors"
                  >
                    Fulfillment Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-zoop-moss mb-6">
                Support
              </h5>
              <ul className="space-y-4 text-sm text-white/60">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    {replaceBrandText("About Us")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/track"
                    className="hover:text-white transition-colors"
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="hover:text-white transition-colors"
                  >
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* --- BOTTOM SECTION: LEGAL --- */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 text-xs font-bold text-white/30 uppercase tracking-widest">
              <Link to="/terms" className="hover:text-zoop-moss">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-zoop-moss">
                Privacy
              </Link>
              <Link to="/cookies" className="hover:text-zoop-moss">
                Cookies
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-white/20 text-[10px] font-black uppercase tracking-tighter">
                {replaceBrandText("Zoop is only for Demo Purpose")}
              </span>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-zoop-moss transition-all cursor-pointer group">
                  <Instagram
                    width={16}
                    height={16}
                    className="text-white group-hover:text-zoop-obsidian"
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-zoop-moss transition-all cursor-pointer group">
                  <Facebook
                    width={16}
                    height={16}
                    className="text-white group-hover:text-zoop-obsidian"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav onSearchClick={() => setIsMobileSearchOpen(true)} />
    </div>
  );
};

export default CustomerLayout;
