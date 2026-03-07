import { useState, useMemo, useEffect } from "react";

export const useProductFiltering = (allProducts, initialCategory = "all", initialType = "all") => {
  // View & UI State
  const [view, setView] = useState("grid"); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    brand: false,
    type: true,
    rating: false,
    stock: false,
  });

  // Filter State
  const [filters, setFilters] = useState({
    category: initialCategory,
    priceRange: [0, 2500000],
    brands: [],
    rating: 0,
    inStock: false,
    type: initialType,
  });

  // Sync filters with props when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: initialCategory,
      type: initialType
    }));
  }, [initialCategory, initialType]);

  // Sort State
  const [sortBy, setSortBy] = useState("popularity");

  // Filter products first to get category-specific data
  const categoryFilteredProducts = useMemo(() => {
    if (filters.category === "all") return allProducts;
    // Flexible matching: check category, gender, or subcategory
    const catSearch = (filters.category || "").toLowerCase();
    return allProducts.filter(p => 
        (p.categoryId || "").toLowerCase() === catSearch ||
        (p.category || "").toLowerCase() === catSearch ||
        (p.gender || "").toLowerCase() === catSearch ||
        (p.subcategory || "").toLowerCase() === catSearch
    );
  }, [filters.category, allProducts]);

  // Get unique brands for selected category (exclude undefined)
  const brands = useMemo(() => {
    return [...new Set(categoryFilteredProducts.map((p) => p.brand).filter(Boolean))].sort();
  }, [categoryFilteredProducts]);

  // Get all unique categories (exclude undefined/null)
  const categories = useMemo(
    () =>
      [
        ...new Set(
          allProducts
            .map((p) => p.categoryId || p.category)
            .filter(Boolean),
        ),
      ].sort(),
    [allProducts],
  );

  // Calculate dynamic max price for selected category
  const maxPrice = useMemo(() => {
    if (categoryFilteredProducts.length === 0) return 200000;
    const prices = categoryFilteredProducts.map((p) => p.price);
    return Math.ceil(Math.max(...prices) / 1000) * 1000;
  }, [categoryFilteredProducts]);

  // Main Filter Logic
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Category filter
    if (filters.category !== "all") {
        const catSearch = (filters.category || "").toLowerCase();
        filtered = filtered.filter(p => 
            (p.categoryId || "").toLowerCase() === catSearch ||
            (p.category || "").toLowerCase() === catSearch || 
            (p.gender || "").toLowerCase() === catSearch || 
            (p.subcategory || "").toLowerCase() === catSearch
        );
    }

    // Price range filter
    filtered = filtered.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1],
    );

    // Brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter((p) => filters.brands.includes(p.brand));
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter((p) => p.rating >= filters.rating);
    }

    // In stock filter
    if (filters.inStock) {
      filtered = filtered.filter(
        (p) => Boolean(p.inStock) || Number(p.stock || 0) > 0,
      );
    }

    // Type filter (Local/National)
    if (filters.type !== "all") {
      filtered = filtered.filter((p) =>
        filters.type === "Local"
          ? Boolean(p.isSameDayEligible) || p.type === "Local"
          : p.type === filters.type,
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "popularity":
      default:
        filtered.sort(
          (a, b) =>
            Number(b.orderedCount || 0) +
            Number(b.ratingCount || b.reviews || 0) -
            (Number(a.orderedCount || 0) +
              Number(a.ratingCount || a.reviews || 0)),
        );
        break;
    }

    return filtered;
  }, [filters, sortBy, allProducts]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() =>filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  ), [filteredProducts, currentPage, itemsPerPage]);

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleBrandToggle = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    handleFilterChange({ ...filters, brands: newBrands });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    handleFilterChange({
      category: "all",
      priceRange: [0, maxPrice],
      brands: [],
      rating: 0,
      inStock: false,
      type: "all",
    });
  };

  const activeFiltersCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.brands.length > 0 ? filters.brands.length : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0);

  // Track previous maxPrice to detect changes
  const [prevMaxPrice, setPrevMaxPrice] = useState(maxPrice);

  // Render-phase state update (derived state sync)
  // This runs during render, updates state, and restarts render immediately (no dom commit)
  if (maxPrice !== prevMaxPrice) {
    setPrevMaxPrice(maxPrice);
    setFilters((prev) => ({
      ...prev,
      priceRange: [prev.priceRange[0], maxPrice],
    }));
  }

  // Scroll to top only on page change, not on filter change to prevent jumping
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return {
    view, setView,
    showFilters, setShowFilters,
    currentPage, setCurrentPage,
    expandedSections, toggleSection,
    filters, setFilters, handleFilterChange, handleBrandToggle, clearAllFilters,
    sortBy, setSortBy,
    brands, categories, maxPrice,
    filteredProducts, paginatedProducts, totalPages,
    activeFiltersCount
  };
};
