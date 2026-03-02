import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter } from "../../assets/icons/Filter";
import { X } from "../../assets/icons/X";
import { ChevronDown } from "../../assets/icons/ChevronDown";
import AdBanner from "../shared/AdBanner";

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
  }, [showFilters]);

  return (
    <aside
      className={`
      lg:block lg:w-64 flex-shrink-0
      ${
        showFilters
          ? "fixed inset-0 z-[100] bg-white lg:relative lg:z-0 lg:bg-transparent"
          : "hidden"
      }
    `}
    >
      <div
        ref={sidebarRef}
        className={`lg:sticky bg-white lg:bg-white/80 lg:backdrop-blur-xl rounded-2xl p-6 shadow-sm h-full lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar transition-[top] duration-300 ${
          headerVisible ? "lg:top-40" : "lg:top-24"
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-zoop-obsidian">Filters</h2>
          <button onClick={() => setShowFilters(false)}>
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
              className="text-xs text-red-500 hover:text-red-700 font-bold uppercase"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Category Filter - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection("category")}
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
                  <span>₹0</span>
                  <span>₹{maxPrice?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Brand Filter */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => toggleSection("brand")}
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
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
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
        <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 mt-6">
          <button
            onClick={() => setShowFilters(false)}
            className="w-full bg-zoop-moss text-zoop-obsidian py-3 rounded-xl font-black"
          >
            Show Results
          </button>
        </div>

        {/* Sidebar Ad */}
        <div className="mt-8 hidden lg:block">
          <AdBanner type="sidebar" />
        </div>
      </div>
    </aside>
  );
};

export default ProductFilterSidebar;
