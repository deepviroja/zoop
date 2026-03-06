import React, { useEffect, useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { apiClient } from "../../api/client";
import ProductCard from "../../components/product/ProductCard";
import ScrollToTop from "../../components/shared/ScrollToTop";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { X } from "../../assets/icons/X";
import ProductFilterSidebar from "../../components/products/ProductFilterSidebar";
import ProductListHeader from "../../components/products/ProductListHeader";
import { useProductFiltering } from "../../hooks/useProductFiltering";
import AdBanner from "../../components/shared/AdBanner";
import Pagination from "../../components/shared/Pagination";
import { shuffleProductsForUser } from "../../utils/shuffleProducts";
import { useUser } from "../../context/UserContext";
import Seo from "../../components/shared/Seo";

const Products = () => {
  const { location } = useUser();
  const [searchParams] = useSearchParams();
  const { scrollDir } = useOutletContext() || { scrollDir: "up" };
  const categoryParam = searchParams.get("category");
  const typeParam = searchParams.get("type");
  const seoTitle = categoryParam
    ? `${categoryParam} Products | Zoop Marketplace`
    : typeParam
      ? `${typeParam} Delivery Products in ${location || "India"} | Zoop`
      : "All Products | Zoop Marketplace";
  const seoDescription = typeParam?.toLowerCase() === "local"
    ? `Browse same-day delivery products available in ${location || "your city"} on Zoop.`
    : categoryParam
      ? `Explore ${categoryParam} products on Zoop with fast delivery and smart filters.`
      : "Browse all products on Zoop with filters for price, rating, availability, and category.";

  const [apiProducts, setApiProducts] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    setApiLoading(true);
    const params = {};
    if (categoryParam) params.category = categoryParam.toLowerCase();
    if (typeParam) params.type = typeParam;
    const qs = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";

    apiClient
      .get(`/products${qs}`)
      .then((data) => {
        let products = Array.isArray(data) ? data : [];
        if (String(typeParam || "").toLowerCase() === "local") {
          products = products.filter(
            (product) =>
              Boolean(product.isSameDayEligible) &&
              Array.isArray(product.cityAvailability) &&
              product.cityAvailability.some(
                (city) => String(city).toLowerCase() === String(location || "").toLowerCase(),
              ),
          );
        }
        setApiProducts(shuffleProductsForUser(products));
      })
      .catch((err) => {
        console.error("Failed to load products from API:", err);
        setApiProducts([]);
      })
      .finally(() => setApiLoading(false));
  }, [categoryParam, typeParam, location]);

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
  } = useProductFiltering(
    apiProducts,
    categoryParam || "all",
    typeParam || "all",
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={`Zoop products, ecommerce catalog, online shopping India${categoryParam ? `, ${categoryParam}` : ""}${typeParam ? `, ${typeParam}` : ""}`}
        canonicalPath={`/products${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: seoTitle,
          description: seoDescription,
        }}
      />
      <div className="max-w-[1600px] mx-auto px-4 py-6 z-999">
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

        <div className="flex flex-col lg:flex-row gap-6 z-999">
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

          {/* Products Grid */}
          <main className="flex-1">
            {/* Active Filters Pills */}
            {activeFiltersCount > 0 && (
              <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">
                    Active Filters:
                  </span>
                  {filters.category !== "all" && (
                    <span className="px-3 py-1 bg-zoop-moss/20 text-zoop-obsidian rounded-full text-xs font-bold flex items-center gap-1">
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
                  {filters.brands?.map((brand) => (
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

            {/* Products */}
            {apiLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm p-4 animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div
                  className={`${view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" : "space-y-4"}`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      view={view}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4 p-4 border border-gray-200 rounded-full inline-block">
                  <SearchIcon />
                </div>
                <h2 className="text-2xl font-black text-zoop-obsidian mb-2">
                  No Products Found
                </h2>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
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
      <ScrollToTop />
    </div>
  );
};

export default Products;
