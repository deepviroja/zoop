import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import ProductCard from "../../components/product/ProductCard";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { useProductFiltering } from "../../hooks/useProductFiltering";
import ProductListHeader from "../../components/products/ProductListHeader";
import ProductFilterSidebar from "../../components/products/ProductFilterSidebar";
import Pagination from "../../components/shared/Pagination";

const SearchItems = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q") || "";
  const [allApiProducts, setAllApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/products")
      .then((data) => setAllApiProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Search fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // 1. Initial Fuzzy Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allApiProducts;

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/);

    return allApiProducts.filter((p) => {
      const searchableText = [
        p.name || p.title || "",
        p.brand || "",
        p.category || "",
        p.subcategory || "",
        p.city || "",
        p.description || "",
      ]
        .join(" ")
        .toLowerCase();

      // Exact match gets highest priority
      if (searchableText.includes(query)) return true;

      // Smart word matching (handles plurals contextually)
      return queryWords.every((queryWord) => {
        const singularQuery = queryWord.replace(/s$/, "");
        return (
          searchableText.includes(queryWord) ||
          searchableText.includes(singularQuery)
        );
      });
    });
  }, [searchQuery, allApiProducts]);

  // 2. Use Filtering Hook for the rest (Category, Sort, Price, etc.)
  const {
    view,
    setView,
    showFilters,
    setShowFilters,
    currentPage,
    setCurrentPage,
    expandedSections,
    toggleSection,
    filters,
    handleFilterChange,
    handleBrandToggle,
    clearAllFilters,
    sortBy,
    setSortBy,
    brands,
    categories,
    maxPrice,
    filteredProducts,
    paginatedProducts,
    totalPages,
    activeFiltersCount,
  } = useProductFiltering(searchResults);

  // Handle clearing purely the search
  const handleClearSearch = () => {
    navigate("/products");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zoop-moss"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Header */}
        <ProductListHeader
          productCount={filteredProducts.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          setView={setView}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFiltersCount={activeFiltersCount}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <ProductFilterSidebar
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleBrandToggle={handleBrandToggle}
            clearAllFilters={clearAllFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            categories={categories}
            brands={brands}
            maxPrice={maxPrice}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Products Grid */}
          <main className="flex-1">
            {paginatedProducts.length > 0 ? (
              <>
                {/* Active Search Query Display - only when there's an actual query */}
                {searchQuery.trim() && (
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zoop-obsidian dark:text-white">
                      Results for "
                      <span className="text-zoop-moss">{searchQuery}</span>"
                    </h2>
                    <button
                      onClick={handleClearSearch}
                      className="text-sm text-gray-500 hover:text-red-500 underline"
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                <div
                  className={`
                  ${
                    view === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }
                `}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      view={view}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="bg-white dark:glass-card rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4 p-4 border border-gray-200 dark:border-white/10 rounded-full inline-block">
                  <SearchIcon />
                </div>
                <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-2">
                  No Products Found
                </h2>
                <p className="text-gray-500 mb-6">
                  {searchQuery.trim()
                    ? `No results found for "${searchQuery}". Try different keywords or adjust your filters.`
                    : "Try adjusting your filters or search criteria"}
                </p>
                <button
                  onClick={handleClearSearch}
                  className="bg-zoop-obsidian text-white px-6 py-3 rounded-xl font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
                >
                  Clear Search
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchItems;
