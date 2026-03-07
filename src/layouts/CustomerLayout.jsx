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
import { SearchIcon } from "../assets/icons/SearchIcon";
import AnimatedCartIcon from "../components/shared/AnimatedCartIcon";

import BottomNav from "../components/shared/BottomNav";
import { apiClient } from "../api/client";
import { Menu } from "../assets/icons/Menu";
import { X } from "../assets/icons/X";
import { ChevronDown } from "../assets/icons/ChevronDown";
import { Zap } from "../assets/icons/Zap";
import { Instagram } from "../assets/icons/Instagram";
import { Facebook } from "../assets/icons/Facebook";
import { Box } from "../assets/icons/Box";
import { Star } from "../assets/icons/Star";
import { BellRing } from "../assets/icons/BellRing";
import { ChevronLeft } from "../assets/icons/ChevronLeft";
import { ChevronRight } from "../assets/icons/ChevronRight";
import { User } from "../assets/icons/User";
import { LogOut } from "../assets/icons/LogOut";

const CustomerLayout = () => {
  const { location, updateLocation, isLoading, user, logout } = useUser();
  const [searchSearchParams] = useSearchParams();
  const locationPath = useLocation();
  const qParam = searchSearchParams.get("q");

  const [searchQuery, setSearchQuery] = useState(qParam || ""); // Initialize with URL param
  const [searchProducts, setSearchProducts] = useState([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationItems, setNotificationItems] = useState([]);
  const [showDesktopSuggestions, setShowDesktopSuggestions] = useState(false);
  const [siteConfig, setSiteConfig] = useState(null);
  const navigate = useNavigate();
  const desktopSearchRef = useRef(null);

  // Update search query when URL param changes
  useEffect(() => {
    setSearchQuery(qParam || "");
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/products")
      .then((items) => {
        if (!cancelled) setSearchProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setSearchProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/content/site-config")
      .then((config) => {
        if (!cancelled) setSiteConfig(config || null);
      })
      .catch(() => {
        if (!cancelled) setSiteConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const pullNotifications = async () => {
      if (!user) {
        setUnreadNotifications(0);
        setNotificationItems([]);
        return;
      }
      try {
        const list = await apiClient.get("/content/notifications/my");
        if (cancelled) return;
        const items = Array.isArray(list) ? list : [];
        setUnreadNotifications(items.filter((n) => !n.read).length);
        setNotificationItems(items.slice(0, 6));
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
          setNotificationItems([]);
        }
      }
    };

    pullNotifications();
    intervalId = window.setInterval(pullNotifications, 12000);
    const onVisible = () => {
      if (document.visibilityState === "visible") pullNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);

  // Scroll direction logic
  const [scrollDir, setScrollDir] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDir("down");
      } else {
        setScrollDir("up");
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
    setShowDesktopSuggestions(false);
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

  const brandName = String(siteConfig?.brandName || "ZOOP");
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
  const subNavCategories =
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
  const customerSidebarCategories =
    Array.isArray(siteConfig?.customerSidebarCategories) &&
    siteConfig.customerSidebarCategories.length > 0
      ? siteConfig.customerSidebarCategories
      : subNavCategories;
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

  if (siteConfig?.maintenanceMode && !["admin", "seller"].includes(String(user?.role || ""))) {
    return (
      <div className="min-h-screen bg-zoop-obsidian text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zoop-moss">
            Maintenance Mode
          </p>
          <h1 className="text-4xl font-black">Zoop is temporarily unavailable</h1>
          <p className="text-white/70">
            {siteConfig?.maintenanceMessage ||
              "We are applying website updates. Please check back shortly."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zoop-canvas relative font-sans">
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={updateLocation}
      />

      {/* --- TOP NOTIFICATION BAR (Not Sticky) --- */}
      <div className="bg-gradient-to-r from-zoop-moss to-green-500 text-zoop-obsidian font-black text-center py-2.5 text-xs md:text-sm z-50 shadow-lg animate-pulse flex items-center justify-center gap-2">
        <Zap width={16} height={16} fill="black" />
        {announcementBanner}
        <Zap width={16} height={16} fill="black" />
      </div>

      {/* --- HEADER (Sticky) --- */}
      <header
        className={`bg-zoop-obsidian text-white sticky top-0 z-50 transition-transform duration-300 ${
          scrollDir === "down" ? "-translate-y-full" : "translate-y-0"
        } shadow-xl`}
      >
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* LOGO */}
            <Link
              to="/"
              className="text-3xl tracking-tighter whitespace-nowrap flex items-center gap-2"
            >
              {brandLogoUrl ? (
                <img
                  src={brandLogoUrl}
                  alt={brandName}
                  className="h-8 w-8 rounded object-cover bg-white"
                />
              ) : null}
              <span style={brandStyle}>{brandName}</span>
              <span className="text-white text-xs align-top ml-1 font-normal italic">
                .in
              </span>
            </Link>

            {/* DESKTOP SEARCH BAR - SMART CAPSULE */}
            <form
              ref={desktopSearchRef}
              onSubmit={handleSearch}
              className={`hidden md:flex flex-1 items-center bg-white rounded-full shadow-lg max-w-3xl mx-8 relative transition-all duration-300 ring-2 ${
                searchQuery
                  ? "ring-zoop-moss/50 shadow-zoop-moss/20 shadow-2xl"
                  : "ring-transparent"
              } focus-within:ring-zoop-moss focus-within:shadow-[0_0_20px_rgba(163,230,53,0.3)]`}
            >
              {/* Location Dropdown */}
              <div
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center pl-6 pr-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-l-full group"
              >
                <div className="relative mr-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-zoop-moss opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zoop-moss"></span>
                </div>
                <span className="mr-2 text-xs font-black uppercase text-zoop-obsidian whitespace-nowrap">
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

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-gray-200"></div>

              {/* Search Input */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDesktopSuggestions(true);
                  }}
                  onFocus={() => setShowDesktopSuggestions(true)}
                  placeholder="Search products, brands, categories"
                  className="w-full pl-4 pr-12 py-3 text-zoop-obsidian bg-transparent focus:outline-none text-sm font-medium placeholder:text-gray-400"
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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-zoop-moss text-zoop-obsidian p-2 rounded-full font-black hover:bg-zoop-moss/80 hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center"
                >
                  <SearchIcon width={18} height={18} />
                </button>
              </div>

              {showDesktopSuggestions && searchQuery.trim() !== "" && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[70vh] overflow-y-auto p-3 z-[70]">
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
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zoop-obsidian truncate">
                              {product.title || product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.brand || "Zoop"} • ₹
                              {(product.price || 0).toLocaleString()}
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
            <div className="flex items-center gap-3 md:gap-4 text-sm font-bold">
              {user && (
                <div className="hidden md:block relative group">
                  <button
                    type="button"
                    onClick={() => navigate("/profile?tab=notifications")}
                    className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <BellRing width={20} height={20} stroke="white" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-zoop-moss text-zoop-obsidian text-[10px] font-black flex items-center justify-center">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-black text-zoop-obsidian">
                        Notifications
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/profile?tab=notifications")}
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
                            onClick={() =>
                              navigate("/profile?tab=notifications")
                            }
                            className={`w-full text-left p-2 rounded-lg mb-1 ${
                              n.read
                                ? "hover:bg-gray-50"
                                : "bg-zoop-moss/10 hover:bg-zoop-moss/20"
                            }`}
                          >
                            <p className="text-sm font-bold text-zoop-obsidian line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
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
                  onClick={() => navigate("/profile?tab=notifications")}
                  className="md:hidden relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Notifications"
                >
                  <BellRing width={20} height={20} stroke="white" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-zoop-moss text-zoop-obsidian text-[10px] font-black flex items-center justify-center">
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
              {user && user.role === "admin" && (
                <Link
                  to="/admin"
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-black hover:bg-red-600 transition-all"
                >
                  <Shield width={14} height={14} />
                  Admin Panel
                </Link>
              )}
              {user && user.role === "seller" && (
                <Link
                  to={
                    user.verificationStatus === "approved"
                      ? "/seller/dashboard"
                      : user.verificationStatus === "pending" ||
                          user.verificationStatus === "rejected"
                        ? "/seller/waiting"
                        : "/seller/onboarding"
                  }
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-zoop-moss text-zoop-obsidian rounded-lg text-xs font-black hover:bg-zoop-moss/80 transition-all"
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
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                          Hello
                        </p>
                        <p className="text-xs font-bold text-zoop-moss leading-none flex items-center gap-1">
                          {user.displayName || user.email?.split("@")[0]}
                          <ChevronDown
                            width={12}
                            height={12}
                            className="text-white group-hover:rotate-180 transition-transform"
                          />
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                        <User width={16} height={16} stroke="white" />
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-black text-zoop-obsidian">
                          {user.displayName || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.role && user.role !== "customer" && (
                          <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest bg-zoop-moss/20 text-zoop-obsidian px-2 py-0.5 rounded-full">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 py-2 px-2 w-full  items-left">
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
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
                            className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-bold text-zoop-moss"
                          >
                            <Box width={18} height={18} />
                            {user.verificationStatus === "approved"
                              ? "Seller Panel"
                              : "Seller Status"}
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          className="flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
                        >
                          <User width={18} height={18} />
                          My Profile
                        </Link>
                        <Link
                          to="/history"
                          className="flex items-center h-8 gap-2 py-1 px-0 rounded-md hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
                        >
                          <Box width={18} height={18} />
                          My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center h-8 gap-2 py-1 px-0 rounded-md hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
                        >
                          <Star width={18} height={18} />
                          My Wishlist
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 px-2 py-2">
                        <button
                          onClick={logout}
                          className="w-full flex items-center h-8 gap-2 py-1 px-2 rounded-md hover:bg-red-50 transition-colors text-sm font-bold text-red-600"
                        >
                          <LogOut width={18} height={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/seller/signup"
                    className="hidden lg:block hover:text-zoop-moss transition-colors"
                  >
                    Become a Seller
                  </Link>
                  <Link
                    to="/login"
                    className="hidden sm:block bg-zoop-moss text-zoop-obsidian px-4 py-2 rounded-sm font-black hover:bg-white hover:scale-105 transition-all shadow-lg text-xs md:text-sm"
                  >
                    Sign In
                  </Link>
                </>
              )}

              <div className="hidden md:block">
                <AnimatedCartIcon />
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden md:block"
              >
                <div className="relative group">
                  <div className="h-10 w-10 bg-zoop-moss hover:bg-zoop-canvas rounded-xl flex items-center justify-center cursor-pointer transition-all group">
                    <Menu width={24} height={24} stroke="#000" />
                  </div>
                  <span className="absolute -top-1 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoop-moss opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-zoop-moss border-2 border-white"></span>
                  </span>
                </div>
              </button>
              <MobileSidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                categories={customerSidebarCategories}
                quickLinks={customerSidebarQuickLinks}
              />
            </div>
          </div>
        </div>

        {/* MOBILE FULL SCREEN SEARCH */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 bg-white z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
            <form
              onSubmit={handleSearch}
              className="p-4 flex items-center gap-3 bg-white border-b border-gray-100 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-gray-500 p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft width={24} height={24} />
              </button>
              <div className="flex-1 flex bg-gray-100 rounded-xl overflow-hidden items-center group focus-within:ring-2 ring-zoop-moss/20 transition-all">
                <div className="pl-3 text-gray-400">
                  <SearchIcon width={18} height={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  className="w-full px-3 py-3 bg-transparent text-zoop-obsidian text-base font-medium focus:outline-none placeholder:text-gray-400"
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

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
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
                        className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.thumbnailUrl || product.image}
                            alt={product.title || product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zoop-obsidian text-sm line-clamp-1">
                            {product.title || product.name}
                          </p>
                          <p className="text-gray-500 text-xs mb-1">
                            {product.brand}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-zoop-obsidian font-black text-sm">
                              ₹{(product.price || 0).toLocaleString()}
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
                      <div className="bg-white inline-block p-4 rounded-full mb-3 shadow-sm">
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
                        className="w-full py-3 bg-white border border-gray-200 text-zoop-moss font-bold rounded-xl mt-4"
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
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600"
                    >
                      Shoes
                    </button>
                    <button
                      onClick={() => setSearchQuery("Watch")}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600"
                    >
                      Watch
                    </button>
                    <button
                      onClick={() => setSearchQuery("Local")}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600"
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
      {/* --- SUB NAV --- */}
      <nav className="bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex gap-4 md:gap-8 items-center overflow-x-auto whitespace-nowrap no-scrollbar text-sm">
            <NavLink
              to="/products?type=Local"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2  md:text-sm shadow-md rounded-full font-black text-xs transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-zoop-obsidian text-white"
                    : "bg-zoop-moss text-zoop-obsidian hover:bg-zoop-moss/60"
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
                    ? "text-zoop-copper border-b-2 border-zoop-copper pb-1"
                    : "text-gray-500 hover:text-zoop-obsidian"
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
                      : "text-gray-500 hover:text-zoop-obsidian"
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
      <main className="pb-20">
        <Outlet context={{ scrollDir }} />
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
                <Star width={32} height={32} stroke="#b7e84b" />
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
                    className="h-7 w-7 rounded object-cover bg-white"
                  />
                ) : null}
                <span style={brandStyle}>{brandName}</span>
                <span className="text-white text-xs italic">.in</span>
              </Link>
              <p className="text-white/40 text-xs mt-4">
                The bridge between local craftsmanship and global standards.
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                Demo storefront only. Prices, offers, stock, payments, and deliveries shown here are for demonstration and testing.
              </p>
            </div>

            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-zoop-moss mb-6">
                Shop Zoop
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
                    About ZOOP
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
                Powered by Zoop Logistics
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
