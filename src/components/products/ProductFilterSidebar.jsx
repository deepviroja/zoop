import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter } from "../../assets/icons/Filter";
import { X } from "../../assets/icons/X";
import { ChevronDown } from "../../assets/icons/ChevronDown";
import AdBanner from "../shared/AdBanner";
import { formatInrWithSymbol } from "../../utils/currency";

const ProductFilterSidebar = ({
  showFilters,
  setShowFilters,
  filters,
  handleFilterChange,
  handleBrandToggle,
  clearAllFilters,
  expandedSections,
  toggleSection,
  categories,
  brands,
  maxPrice,
  activeFiltersCount,
  headerVisible = true,
}) => {
  const navigate = useNavigate();
  // Handle overflow for sticky sidebar
  const sidebarRef = useRef(null);

  // Prevent background scroll when mobile filters are open
  useEffect(() => {
    if (showFilters && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showFilters]);

  return (
    <aside
      className={`
      lg:block lg:w-[19rem] xl:w-[20.5rem] flex-shrink-0
      ${
        showFilters
          ? "fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:relative lg:z-0 lg:bg-transparent lg:backdrop-blur-none"
          : "hidden"
      }
    `}
    >
      <div
        ref={sidebarRef}
        className={`ml-auto flex h-full w-full max-w-[24rem] flex-col overflow-hidden bg-white px-4 pb-0 pt-4 shadow-xl lg:sticky lg:max-w-none lg:rounded-[1.75rem] lg:border lg:border-[#e7dfd4] lg:bg-white/95 lg:px-5 lg:pb-5 lg:pt-5 lg:shadow-[0_18px_42px_rgba(41,32,18,0.08)] lg:backdrop-blur-xl lg:max-h-[calc(100vh-7rem)] custom-scrollbar transition-[top] duration-300 ${
          headerVisible ? "lg:top-24" : "lg:top-6"
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-zoop-obsidian">Filters</h2>
            <p className="text-xs font-medium text-gray-500">
              Refine products without leaving the page
            </p>
          </div>
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Close filters"
            className="rounded-full border border-gray-200 p-2"
          >
            <X width={24} height={24} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-zoop-obsidian uppercase tracking-wider">
            Filters
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              aria-label="Clear all filters"
              className="text-xs text-red-500 hover:text-red-700 font-bold uppercase"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-6 overflow-y-auto pb-6 pr-1 lg:flex-1 lg:pb-0">
          {/* Category Filter - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection("category")}
              aria-label={`${expandedSections.category ? "Collapse" : "Expand"} category filters`}
              className="w-full flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 hover:text-zoop-obsidian transition-colors"
            >
              <span>Category</span>
              <ChevronDown
                width={16}
                height={16}
                className={`transition-transform ${
                  expandedSections.category ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedSections.category && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === "all"}
                    onChange={() => {
                      navigate("/products");
                    }}
                    className="w-4 h-4 accent-zoop-obsidian"
                  />
                  <span
                    className={`text-sm group-hover:text-zoop-moss transition-colors ${filters.category === "all" ? "font-bold" : ""}`}
                  >
                    All Categories
                  </span>
                </label>
                {(categories || []).filter(Boolean).map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={
                        (filters.category || "").toLowerCase() ===
                        cat.toLowerCase()
                      }
                      onChange={() => {
                        const path = `/category/${cat.toLowerCase().replace(/\s+/g, "-")}`;
                        // If we are already on this path, just update filter, else navigate
                        if (window.location.pathname !== path) {
                          navigate(path);
                        } else {
                          handleFilterChange({ ...filters, category: cat });
                        }
                      }}
                      className="w-4 h-4 accent-zoop-obsidian"
                    />
                    <span
                      className={`text-sm group-hover:text-zoop-moss transition-colors ${filters.category === cat ? "font-bold" : ""}`}
                    >
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => toggleSection("price")}
              aria-label={`${expandedSections.price ? "Collapse" : "Expand"} price filters`}
              className="w-full flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 hover:text-zoop-obsidian transition-colors"
            >
              <span>Price Range</span>
              <ChevronDown
                width={16}
                height={16}
                className={`transition-transform ${expandedSections.price ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.price && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        priceRange: [
                          parseInt(e.target.value) || 0,
                          filters.priceRange[1],
                        ],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zoop-moss"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        priceRange: [
                          filters.priceRange[0],
                          parseInt(e.target.value) || maxPrice,
                        ],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-zoop-moss"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      priceRange: [
                        filters.priceRange[0],
                        parseInt(e.target.value),
                      ],
                    })
                  }
                  className="w-full accent-zoop-obsidian"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatInrWithSymbol(0, { maximumFractionDigits: 0 })}</span>
                  <span>
                    {formatInrWithSymbol(maxPrice || 0, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Brand Filter */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => toggleSection("brand")}
              aria-label={`${expandedSections.brand ? "Collapse" : "Expand"} brand filters`}
              className="w-full flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 hover:text-zoop-obsidian transition-colors"
            >
              <span>Brand</span>
              <ChevronDown
                width={16}
                height={16}
                className={`transition-transform ${expandedSections.brand ? "rotate-180" : ""}`}
              />
            </button>

            {(expandedSections.brand || filters.brands.length > 0) && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {(brands || []).filter(Boolean).map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="w-4 h-4 accent-zoop-obsidian"
                    />
                    <span className="text-sm group-hover:text-zoop-moss transition-colors">
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => toggleSection("type")}
              aria-label={`${expandedSections.type ? "Collapse" : "Expand"} delivery type filters`}
              className="w-full flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 hover:text-zoop-obsidian transition-colors"
            >
              <span>Delivery Type</span>
              <ChevronDown
                width={16}
                height={16}
                className={`transition-transform ${expandedSections.type ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.type && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="type"
                    checked={filters.type === "all"}
                    onChange={() =>
                      handleFilterChange({ ...filters, type: "all" })
                    }
                    className="w-4 h-4 accent-zoop-obsidian"
                  />
                  <span className="text-sm group-hover:text-zoop-moss transition-colors">
                    All Products
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="type"
                    checked={filters.type === "Local"}
                    onChange={() =>
                      handleFilterChange({ ...filters, type: "Local" })
                    }
                    className="w-4 h-4 accent-zoop-obsidian"
                  />
                  <span className="text-sm group-hover:text-zoop-moss transition-colors">
                    ⚡ Same-Day Delivery
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="type"
                    checked={filters.type === "National"}
                    onChange={() =>
                      handleFilterChange({ ...filters, type: "National" })
                    }
                    className="w-4 h-4 accent-zoop-obsidian"
                  />
                  <span className="text-sm group-hover:text-zoop-moss transition-colors">
                    National Brands
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => toggleSection("rating")}
              aria-label={`${expandedSections.rating ? "Collapse" : "Expand"} rating filters`}
              className="w-full flex justify-between items-center text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 hover:text-zoop-obsidian transition-colors"
            >
              <span>Customer Rating</span>
              <ChevronDown
                width={16}
                height={16}
                className={`transition-transform ${expandedSections.rating ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.rating && (
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating}
                      onChange={() =>
                        handleFilterChange({ ...filters, rating })
                      }
                      className="w-4 h-4 accent-zoop-obsidian"
                    />
                    <span className="text-sm group-hover:text-zoop-moss transition-colors">
                      {rating}★ & Above
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* In Stock Filter */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    inStock: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-zoop-obsidian"
              />
              <span className="text-sm font-bold group-hover:text-zoop-moss transition-colors">
                In Stock Only
              </span>
            </label>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="lg:hidden sticky bottom-0 left-0 right-0 -mx-4 mt-auto border-t border-gray-100 bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            <span>{activeFiltersCount} active filters</span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                aria-label="Clear all filters"
                className="text-red-500"
              >
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Show filtered results"
            className="w-full rounded-xl bg-zoop-moss py-3 font-black text-zoop-obsidian"
          >
            Show Results
          </button>
        </div>

      </div>
      <div className="mt-5 hidden xl:block">
        <AdBanner type="sidebar" />
      </div>
    </aside>
  );
};

export default ProductFilterSidebar;
