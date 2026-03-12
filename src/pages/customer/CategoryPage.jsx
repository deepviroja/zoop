import React, { useMemo, useEffect, useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { categoryConfig } from "../../data/mockData";
import { apiClient } from "../../api/client";
import ProductCard from "../../components/product/ProductCard";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import ProductFilterSidebar from "../../components/products/ProductFilterSidebar";
import ProductListHeader from "../../components/products/ProductListHeader";
import { useProductFiltering } from "../../hooks/useProductFiltering";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { X } from "../../assets/icons/X";
import AdBanner from "../../components/shared/AdBanner";
import Pagination from "../../components/shared/Pagination";
import Seo from "../../components/shared/Seo";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const { scrollDir } = useOutletContext() || { scrollDir: "up" };
  const categoryKey = categoryName?.toLowerCase();

  // Get category configuration
  const category = useMemo(
    () =>
      categoryConfig[categoryKey] || {
        name: categoryName,
        icon: "📦",
        subcategories: [],
      },
    [categoryKey, categoryName],
  );

  const [apiProducts, setApiProducts] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Fetch from backend API for this category
  useEffect(() => {
    if (!apiLoading) setApiLoading(true);
    const categoryQuery = encodeURIComponent(categoryKey || categoryName || "");
    apiClient
      .get(`/products?category=${categoryQuery}`)
      .then((data) => setApiProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load category products:", err);
        setApiProducts([]);
      })
      .finally(() => setApiLoading(false));
  }, [categoryName, categoryKey, apiLoading]);

  // Initialize hook with API products and this category as the default filter
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
  } = useProductFiltering(apiProducts, categoryKey || categoryName);

  const availableSubcategories = useMemo(() => {
    const subcatSet = new Set();
    apiProducts.forEach((p) => {
      const matchCategory = String(p.categoryId || p.category || "").toLowerCase() === (categoryKey || "").toLowerCase();
      const subcat = (p.subcategory || "").trim();
      if (matchCategory && subcat) subcatSet.add(subcat);
    });
    return Array.from(subcatSet);
  }, [apiProducts, categoryKey]);

  // Update filters when URL category changes
  useEffect(() => {
    if (categoryKey && filters.category !== categoryKey) {
      handleFilterChange({ ...filters, category: categoryKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5">
      <Seo
        title={`${category.name} | Zoop Category`}
        description={`Browse ${category.name} products on Zoop with curated listings, filters, and fast delivery options.`}
        keywords={`${category.name}, Zoop ${category.name}, buy ${category.name} online`}
        canonicalPath={`/category/${categoryName}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name} on Zoop`,
          description: `Browse ${category.name} products on Zoop.`,
        }}
      />
      {/* Hero Banner */}
      <div className="relative h-[350px] md:h-[450px] bg-zoop-obsidian w-full overflow-hidden flex items-center justify-center">
        {/* Abstract Typographic Background */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none opacity-5">
          <span className="text-[20vw] font-black text-white leading-none whitespace-nowrap uppercase tracking-tighter select-none">
            {category.name}
          </span>
        </div>

        {/* Decor Balls/Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zoop-moss/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl px-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight width={10} height={10} />
            <span className="text-white">{category.name}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight uppercase leading-none">
            {category.name}
            <span className="text-zoop-moss">.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Curated collection of{" "}
            <span className="text-white font-bold">
              {filteredProducts.length}+
            </span>{" "}
            premium {categoryKey} items.
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Subcategory Navigation from Mock Data (only if active category matches param) */}
        {availableSubcategories.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-white dark:glass-card overflow-x-auto">
              {/* Removed sticky to avoid conflict with ProductListHeader */}
              <h2 className="text-lg font-black text-zoop-obsidian dark:text-white mb-4 uppercase tracking-wider">
                Shop by Category
              </h2>
              <div className="flex gap-4 min-w-max">
                {availableSubcategories.map((subcat) => (
                  <button
                    key={subcat}
                    // Clicking a subcategory sets the search text or we could add a subcategory filter to the hook (simple approach: quick filter)
                    // For now, let's just make it do nothing or maybe just scroll - or ideally we should update the hook to handle arbitrary text search or subcategory field.
                    // Since the hook uses "category" filter loosely (cat/gender/subcat), we can set category filter to the subcat name!
                    onClick={() =>
                      handleFilterChange({ ...filters, category: subcat })
                    }
                    className="px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-zoop-moss/10 hover:border-zoop-moss border-2 border-transparent rounded-xl font-bold text-sm transition-all text-left whitespace-nowrap"
                  >
                    {subcat}
                  </button>
                ))}
              </div>
            </div>
          )}

        <ProductListHeader
          productCount={filteredProducts.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          setView={setView}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFiltersCount={activeFiltersCount}
          headerVisible={scrollDir === "up"}
        />

        <div className="mb-8">
          <AdBanner />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
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
            headerVisible={scrollDir === "up"}
          />

          <main className="flex-1">
            {/* Active Filters Pills */}
            {activeFiltersCount > 0 && (
              <div className="bg-white dark:glass-card rounded-xl p-4 mb-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                    Active Filters:
                  </span>
                  {filters.category !== "all" && (
                    <span className="px-3 py-1 bg-zoop-moss/20 text-zoop-obsidian dark:text-white rounded-full text-xs font-bold flex items-center gap-1">
                      {filters.category}
                      <button
                        onClick={() =>
                          handleFilterChange({ ...filters, category: "all" })
                        }
                      >
                        <X width={12} height={12} />
                      </button>
                    </span>
                  )}
                  {filters.brands.map((brand) => (
                    <span
                      key={brand}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"
                    >
                      {brand}
                      <button onClick={() => handleBrandToggle(brand)}>
                        <X width={12} height={12} />
                      </button>
                    </span>
                  ))}
                  {filters.type !== "all" && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1">
                      {filters.type}
                      <button
                        onClick={() =>
                          handleFilterChange({ ...filters, type: "all" })
                        }
                      >
                        <X width={12} height={12} />
                      </button>
                    </span>
                  )}
                  {filters.rating > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1">
                      {filters.rating}★ & Above
                      <button
                        onClick={() =>
                          handleFilterChange({ ...filters, rating: 0 })
                        }
                      >
                        <X width={12} height={12} />
                      </button>
                    </span>
                  )}
                  {filters.inStock && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                      In Stock
                      <button
                        onClick={() =>
                          handleFilterChange({ ...filters, inStock: false })
                        }
                      >
                        <X width={12} height={12} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="ml-auto text-xs text-red-500 hover:text-red-700 font-bold uppercase"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
            {/* Search Results */}
            {apiLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:glass-card rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-4 animate-pulse"
                  >
                    <div className="aspect-4-5 bg-gray-200 dark:bg-white/20 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div
                  className={`
                  ${
                    view === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6"
                      : "space-y-4 "
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
                  We couldn't find any products in this category matching your
                  filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-zoop-obsidian text-white px-6 py-3 rounded-xl font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
