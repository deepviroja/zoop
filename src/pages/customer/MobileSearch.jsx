import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { X } from "../../assets/icons/X";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import { apiClient } from "../../api/client";

const RECENT_SEARCHES_KEY = "zoop_recent_searches";

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveRecentSearch = (term) => {
  try {
    const searches = getRecentSearches();
    const updated = [term, ...searches.filter((s) => s !== term)].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
};

const MobileSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const [allApiProducts, setAllApiProducts] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const inputRef = useRef(null);

  // Fetch products from API on mount
  useEffect(() => {
    apiClient
      .get("/products")
      .then((data) => setAllApiProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("MobileSearch fetch error:", err))
      .finally(() => setApiLoading(false));
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (term) => {
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  // Live results for valid queries using API products
  const liveResults = useMemo(() => {
    if (!query.trim() || apiLoading) return [];
    const q = query.toLowerCase().trim();
    return allApiProducts
      .filter(
        (p) =>
          (p.title || p.name || "").toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, allApiProducts, apiLoading]);

  const trendingTerms = [
    "Summer Collection",
    "Smart Watches",
    "Organic Spices",
    "Leather Bags",
    "Handmade Crafts",
    "Electronics",
  ];

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col font-sans">
      {/* Header / Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <ChevronLeft width={24} height={24} />
        </button>

        <div className="flex-1 relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width={18}
            height={18}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands..."
            className="w-full bg-gray-100 text-zoop-obsidian placeholder:text-gray-400 pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zoop-moss/20 font-medium text-base h-12"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 pointer-events-auto"
              aria-label="Clear search"
            >
              <X width={16} height={16} />
            </button>
          )}
        </div>

        {query.trim() && (
          <button
            type="submit"
            className="px-4 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-xs"
          >
            Search
          </button>
        )}
      </form>

      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {query.trim() === "" ? (
          <div className="p-4 space-y-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Recent Searches
                  </h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem(RECENT_SEARCHES_KEY);
                      setRecentSearches([]);
                    }}
                    className="text-xs text-red-400 font-bold"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(term)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:border-zoop-moss hover:bg-zoop-moss/5 transition-colors flex items-center gap-2"
                    >
                      <span className="text-gray-300">🕐</span>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Trending Now
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTerms.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex items-center gap-2 hover:border-zoop-moss hover:bg-zoop-moss/5 transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center bg-red-100 text-red-500 text-[10px] rounded font-black">
                      ↗
                    </span>
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Category shortcuts */}
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Browse Categories
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Electronics", emoji: "📱" },
                  { name: "Fashion", emoji: "👗" },
                  { name: "Home", emoji: "🏠" },
                  { name: "Food", emoji: "🍜" },
                  { name: "Artisans", emoji: "🎨" },
                  { name: "Sports", emoji: "⚽" },
                ].map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/category/${cat.name.toLowerCase()}`}
                    className="flex flex-col items-center py-4 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-zoop-moss hover:bg-zoop-moss/5 transition-colors"
                  >
                    <span className="text-2xl mb-1">{cat.emoji}</span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Live Results */}
            {apiLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-zoop-moss border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  {liveResults.length > 0
                    ? `Top Results for "${query}"`
                    : `No results for "${query}"`}
                </h3>

                <div className="space-y-3">
                  {liveResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={
                            product.thumbnailUrl ||
                            product.image ||
                            "/brand-mark.svg"
                          }
                          alt={product.title || product.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/brand-mark.svg";
                          }}
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
                            Rs. {(product.price || 0).toLocaleString()}
                          </span>
                          {product.stock > 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-300">
                        <ChevronRight width={20} height={20} />
                      </div>
                    </Link>
                  ))}

                  {liveResults.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-white inline-block p-4 rounded-full mb-3 shadow-sm">
                        <SearchIcon
                          width={32}
                          height={32}
                          className="text-gray-300"
                        />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No matches found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try checking your spelling or use different keywords
                      </p>
                    </div>
                  )}

                  {liveResults.length > 0 && (
                    <button
                      onClick={handleSearch}
                      className="w-full py-4 bg-zoop-obsidian text-white font-bold rounded-xl mt-2 shadow-lg active:scale-95 transition-transform"
                    >
                      View All Results for "{query}"
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;
