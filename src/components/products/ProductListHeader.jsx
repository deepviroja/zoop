import React from "react";
import { Grid } from "../../assets/icons/Grid";
import { List } from "../../assets/icons/List";
import { Filter } from "../../assets/icons/Filter";

const ProductListHeader = ({
  productCount,
  heading = "",
  sortBy,
  setSortBy,
  view,
  setView,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  headerVisible = true,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl p-4 md:p-6 mb-6 shadow-sm sticky z-20 backdrop-blur-md bg-white/90 transition-[top] duration-300 ${
        headerVisible ? "top-[4.5rem]" : "top-4"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-zoop-obsidian">
            {heading || `${productCount} Products`}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort Dropdown */}
          <div className="relative flex-1 md:flex-none">
            <label htmlFor="product-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="product-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="w-full md:w-48 appearance-none px-4 py-2 pr-8 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zoop-moss bg-white cursor-pointer hover:border-zoop-moss transition-colors"
            >
              <option value="popularity">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="#1A1A1A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView("grid")}
              aria-label="Show products in grid view"
              className={`p-2 rounded-md transition-all ${
                view === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
              title="Grid View"
            >
              <Grid
                width={18}
                height={18}
                className={
                  view === "grid" ? "text-zoop-obsidian" : "text-gray-400"
                }
              />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="Show products in list view"
              className={`hidden md:block p-2 rounded-md transition-all ${
                view === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
              title="List View"
            >
              <List
                width={18}
                height={18}
                className={
                  view === "list" ? "text-zoop-obsidian" : "text-gray-400"
                }
              />
            </button>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-zoop-obsidian text-white rounded-lg font-bold text-sm hover:bg-zoop-moss hover:text-zoop-obsidian transition-colors"
          >
            <Filter width={16} height={16} />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListHeader;
