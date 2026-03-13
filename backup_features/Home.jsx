import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import { Zap } from "../../assets/icons/Zap";
import { Shoe } from "../../assets/icons/Shoe";
import { Dress } from "../../assets/icons/Dress";
import { useUser } from "../../context/UserContext";
import ProductCard from "../../components/product/ProductCard";
import AdBanner from "../../components/shared/AdBanner";
import { contentApi, productsApi } from "../../services/api";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import Seo from "../../components/shared/Seo";
import { normalizeCityName } from "../../utils/cityMapping";
import { useSiteConfig } from "../../context/SiteConfigContext";
import { formatInrWithSymbol } from "../../utils/currency";
import men_cat from "../../assets/images/men_cat.png";
import women_cat from "../../assets/images/women_cat.png";
import kids_cat from "../../assets/images/kids_cat.png";
import home_cat from "../../assets/images/home_cat.png";
import artisans_cat from "../../assets/images/artisans_cat.png";

// Category image fallback map
const CAT_IMAGES = {
  men: men_cat,
  women: women_cat,
  kids: kids_cat,
  home: home_cat,
  artisans: artisans_cat,
};

const Skeleton = ({ className = "" }) => (
  <div className={`bg-white/20 animate-pulse rounded-xl ${className}`} />
);

const Home = () => {
  const { location } = useUser();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic content state
  const [heroSlides, setHeroSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);

  const [contentLoading, setContentLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { siteConfig, brandName } = useSiteConfig();

  // Fetch all dynamic content in parallel
  const fetchContent = useCallback(async () => {
    try {
      const [slides, cats, brnds, colls] = await Promise.all([
        contentApi.getHeroSlides().catch(() => []),
        contentApi.getCategories().catch(() => []),
        contentApi.getBrands().catch(() => []),
        contentApi.getCollections().catch(() => []),
      ]);
      setHeroSlides(slides || []);
      setCategories(cats || []);
      setBrands(brnds || []);
      setCollections(colls || []);
    } catch (err) {
      console.error("Content load error:", err);
      setError("Failed to load page content. Please refresh.");
    } finally {
      setContentLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Products load error:", err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchProducts();
  }, [fetchContent, fetchProducts]);

  // Auto-slide
  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === heroSlides.length - 1 ? 0 : prev + 1,
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));

  // Derived product lists
  const localCity = String(location || "Surat");
  const trendingProducts = [...products]
    .sort((a, b) => {
      const scoreA =
        Number(a.orderedCount || a.purchaseCount || 0) * 5 +
        Number(a.ratingCount || 0) * 2 +
        Number(a.rating || 0);
      const scoreB =
        Number(b.orderedCount || b.purchaseCount || 0) * 5 +
        Number(b.ratingCount || 0) * 2 +
        Number(b.rating || 0);
      return scoreB - scoreA;
    })
    .slice(0, 8);
  const citySpecificProducts = products.filter(
    (p) =>
      Boolean(p.isSameDayEligible) &&
      Array.isArray(p.cityAvailability) &&
      p.cityAvailability.some(
        (city) =>
          normalizeCityName(city).toLowerCase() ===
          normalizeCityName(localCity).toLowerCase(),
      ),
  );
  const displayLocalProducts = citySpecificProducts.slice(0, 4);
  const newArrivalProducts = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, 8);

  const categoryImageFromProducts = React.useMemo(() => {
    const map = {};
    const score = (p) =>
      Number(p.ratingCount || 0) * 5 + Number(p.orderedCount || 0);
    products.forEach((p) => {
      const key = (p.categoryId || p.category || "").toLowerCase();
      if (!key) return;
      if (!map[key] || score(p) > score(map[key])) {
        map[key] = p;
      }
    });
    return map;
  }, [products]);
  const getCategoryVisual = useCallback(
    (categoryId, categoryName, fallbackImage = "") => {
      const key = String(categoryId || categoryName || "")
        .toLowerCase()
        .trim();
      const product = categoryImageFromProducts[key];
      return (
        optimizeCloudinaryUrl(product?.thumbnailUrl, { width: 900 }) ||
        optimizeCloudinaryUrl(product?.image, { width: 900 }) ||
        optimizeCloudinaryUrl(product?.images?.[0], { width: 900 }) ||
        optimizeCloudinaryUrl(product?.imageUrls?.[0], { width: 900 }) ||
        fallbackImage ||
        CAT_IMAGES[key] ||
        "/brand-mark.svg"
      );
    },
    [categoryImageFromProducts],
  );

  const liveCategoryIds = React.useMemo(() => {
    const ids = new Set();
    products.forEach((p) => {
      const id = String(p.categoryId || p.category || "")
        .toLowerCase()
        .trim();
      if (id) ids.add(id);
    });
    return ids;
  }, [products]);

  const collectionCategories = React.useMemo(() => {
    const merged = new Map();

    categories.forEach((cat) => {
      const id = String(cat.id || cat.name || "")
        .toLowerCase()
        .trim();
      if (!id || !liveCategoryIds.has(id)) return;
      merged.set(id, {
        ...cat,
        id,
        name: cat.name || id.charAt(0).toUpperCase() + id.slice(1),
        path: cat.path || `/category/${id}`,
        desc: cat.desc || "Curated for local-first shoppers",
      });
    });

    products.forEach((p) => {
      const id = String(p.categoryId || p.category || "")
        .toLowerCase()
        .trim();
      if (!id || merged.has(id)) return;
      merged.set(id, {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        path: `/category/${id}`,
        desc: "Curated for local-first shoppers",
        icon: "🛍️",
      });
    });

    return Array.from(merged.values());
  }, [categories, products, liveCategoryIds]);
  const featuredBrands = React.useMemo(() => {
    const grouped = new Map();
    products.forEach((product) => {
      const brandName = String(product.brand || "").trim();
      if (!brandName) return;
      const key = brandName.toLowerCase();
      const current = grouped.get(key);
      const score =
        Number(product.orderedCount || 0) * 5 +
        Number(product.ratingCount || 0) * 2 +
        Number(product.rating || 0);
      if (!current || score > current.score) {
        grouped.set(key, {
          id: key,
          name: brandName,
          image:
            product.thumbnailUrl ||
            product.image ||
            product.images?.[0] ||
            product.imageUrls?.[0] ||
            "",
          score,
          tier:
            product.isWorldClassBrand ||
            product.brandTier === "world" ||
            String(product.type || "").toLowerCase() === "national"
              ? "World class"
              : "Local favorite",
        });
      }
    });
    return Array.from(grouped.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [products]);

  const activeSlide = heroSlides[currentSlide] || {};
  const sameDayCutoffText =
    siteConfig?.homeSameDayCutoffText ||
    "Order before 6 PM for same-day delivery";
  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-black text-red-500 mb-4">
          Error Loading Marketplace
        </h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-zoop-obsidian text-white px-6 py-3 rounded-xl font-bold hover:opacity-80 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-4 md:p-4 space-y-6 md:space-y-8 overflow-x-hidden">
      <Seo
        title={`${brandName} | Same-Day Local Shopping Across India`}
        description={`Shop local-first products, same-day city delivery, trending collections, and curated categories on ${brandName}.`}
        keywords={`${brandName}, same-day delivery, local shopping, ecommerce India, online marketplace`}
        canonicalPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: brandName,
          url: "https://zoop-88df6.web.app/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://zoop-88df6.web.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* HERO SLIDER */}
      <section className="relative group min-h-[460px] sm:min-h-[560px] md:h-[700px] w-full rounded-[1.75rem] md:rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zoop-obsidian via-zoop-ink to-black">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(183,232,75,0.15) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(183,232,75,0.1) 0%, transparent 50%)`,
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-zoop-moss/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
          <div
            className="absolute w-96 h-96 bg-zoop-copper/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Slides */}
        {contentLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroSlides.map((slide) => (
              <div key={slide.id} className="min-w-full h-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <img
                  src={optimizeCloudinaryUrl(slide.img, { width: 1600 })}
                  className="w-full h-full object-cover opacity-40"
                  alt={slide.title}
                />
              </div>
            ))}
          </div>
        )}

        {/* Overlay Content */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
              <div className="space-y-4 md:space-y-6 text-white max-w-2xl">
                {/* Live badge */}
                <div className="inline-flex max-w-full items-center gap-2 bg-zoop-moss/20 backdrop-blur-xl border border-zoop-moss/30 rounded-full px-3 py-2 sm:px-4">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoop-moss opacity-75" />
                    <span className="relative inline-flex rounded-full h-full w-full bg-zoop-moss" />
                  </div>
                  <span className="text-zoop-moss font-black text-xs uppercase tracking-wider">
                    Live in {localCity}
                  </span>
                </div>

                {contentLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-48 bg-white/10" />
                    <Skeleton className="h-10 w-72 bg-white/10" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[0.95] text-center md:text-left">
                      <span className="block text-white">{brandName}</span>
                      <span className="text-zoop-moss italic">
                        {activeSlide.city || localCity}
                      </span>
                    </h1>
                    <p className="text-sm sm:text-xl md:text-3xl font-bold text-white/90 max-w-xl leading-tight">
                      {activeSlide.title ||
                        siteConfig?.homeHeroHeadline ||
                        "Discover Local Gems"}
                    </p>
                  </div>
                )}

                <p className="text-center text-xs sm:text-sm md:text-lg text-white/70 max-w-md leading-relaxed md:text-left">
                  {activeSlide.desc ||
                    "Curated by local experts and national stylists"}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 justify-center md:justify-start">
                  <button
                    onClick={() =>
                      navigate(`/search?q=${activeSlide.city || localCity}`)
                    }
                    className="group bg-zoop-moss text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Shop Now
                    <ChevronRight
                      width={16}
                      height={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button
                    onClick={() => navigate("/search")}
                    className="hidden sm:flex bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 items-center justify-center"
                  >
                    Explore All
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-x-4 gap-y-3 md:gap-8 pt-4 border-t border-white/10 justify-center md:justify-start text-center md:text-left">
                  <div>
                    <p className="text-xl md:text-3xl font-black text-zoop-moss">
                      4-6hrs
                    </p>
                    <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-wider">
                      Delivery
                    </p>
                  </div>
                  <div>
                    <p className="text-xl md:text-3xl font-black text-zoop-moss">
                      {products.length}+
                    </p>
                    <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-wider">
                      Products
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xl md:text-3xl font-black text-zoop-moss">
                      500+
                    </p>
                    <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-wider">
                      Artisans
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side card */}
              {!contentLoading && activeSlide.img && (
                <div className="hidden md:block relative">
                  <div className="relative w-full aspect-4-5 max-w-md ml-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-zoop-moss/30 to-zoop-copper/30 rounded-3xl blur-2xl animate-pulse" />
                    <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:rotate-2">
                      <div className="aspect-4-5 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden mb-6">
                        <img
                          src={optimizeCloudinaryUrl(activeSlide.img, {
                            width: 900,
                          })}
                          alt={activeSlide.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="px-3 py-1 bg-zoop-moss/20 backdrop-blur border border-zoop-moss/30 rounded-full w-fit">
                          <span className="text-zoop-moss text-xs font-black uppercase">
                            Featured
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-white leading-tight">
                          {activeSlide.title}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {activeSlide.desc}
                        </p>
                      </div>
                    </div>
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-zoop-moss/20 backdrop-blur-xl border border-zoop-moss/30 rounded-2xl flex items-center justify-center rotate-12 animate-bounce">
                      <span className="text-2xl">⚡</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arrow Controls */}
        {heroSlides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 hidden md:flex bg-white/10 backdrop-blur-xl p-3 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all border border-white/20"
            >
              <ChevronLeft stroke="#fff" width={24} height={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 hidden md:flex bg-white/10 backdrop-blur-xl p-3 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all border border-white/20"
            >
              <ChevronRight stroke="#fff" width={24} height={24} />
            </button>
          </>
        )}

        {/* Dots */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`transition-all ${
                  currentSlide === i
                    ? "w-12 h-2 bg-zoop-moss"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                } rounded-full`}
              />
            ))}
          </div>
        )}
      </section>

      {/* SAME-DAY LOCAL SECTION */}
      {productsLoading ? (
        <section className="bg-zoop-moss/10 p-6 rounded-2xl border border-zoop-moss/20">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </section>
      ) : displayLocalProducts.length > 0 ? (
        <section className="bg-zoop-moss/10 p-6 rounded-2xl border border-zoop-moss/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-zoop-moss p-2 rounded-lg">
              <Zap width={24} height={24} fill="black" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Same-Day in {localCity}
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {sameDayCutoffText}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayLocalProducts.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="glass-card p-4 rounded-xl border border-white hover:border-zoop-moss shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-xl transition-all group"
              >
                <div className="aspect-4-5 bg-white/10 rounded-lg mb-4 overflow-hidden relative">
                  <img
                    src={
                      optimizeCloudinaryUrl(product.thumbnailUrl, {
                        width: 700,
                      }) ||
                      (product.imageUrls && product.imageUrls[0]) ||
                      "/brand-mark.svg"
                    }
                    onError={(e) => {
                      e.target.src = "/brand-mark.svg";
                    }}
                    alt={product.title || product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-zoop-moss text-[8px] font-black px-2 py-1 rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-1">
                    <Zap width={8} height={8} fill="black" /> FAST
                  </div>
                  {product.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1">
                  {product.title || product.name}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {product.brand || "Local Seller"}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg">
                      Rs. {Number(product.price || 0).toLocaleString("en-IN")}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatInrWithSymbol(product.mrp, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>
                  <span className="px-3 py-1.5 text-[10px] rounded-full bg-zoop-canvas font-bold hover:bg-zoop-obsidian hover:text-white transition-colors uppercase">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className="space-y-4">
        <AdBanner type="horizontal" slotId="home_top" size="hero" />
      </section>

      {/* TRENDING FOR YOU */}
      <section className="space-y-8">
        <div className="text-center">
          <h3 className="text-4xl font-black text-white italic">
            Trending For You
          </h3>
          <p className="text-gray-500 font-medium">
            Curated by local experts and national stylists
          </p>
        </div>
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {trendingProducts.length > 0 ? (
              trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-4 text-center text-gray-400 py-16">
                No products available yet. Be the first to add one!
              </p>
            )}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <AdBanner type="horizontal" slotId="home_mid" />
      </section>

      {/* NEW ARRIVALS horizontal scroll */}
      {!productsLoading && newArrivalProducts.length > 0 && (
        <section className="glass-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">New Arrivals</h3>
            <Link
              to="/products"
              className="text-white text-sm font-bold hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scrollbar-gap">
            {newArrivalProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-[200px] group border border-transparent hover:border-gray-100 p-2 rounded-xl transition-all"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="h-48 w-full bg-zoop-canvas rounded-lg overflow-hidden">
                    <img
                      src={
                        optimizeCloudinaryUrl(product.thumbnailUrl, {
                          width: 600,
                        }) ||
                        optimizeCloudinaryUrl(product.image, { width: 600 }) ||
                        (product.images &&
                          optimizeCloudinaryUrl(product.images[0], {
                            width: 600,
                          }))
                      }
                      alt={product.name || product.title}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/brand-mark.svg";
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] font-black text-zoop-copper uppercase tracking-widest mb-1">
                      {product.brand || "Generic"}
                    </p>
                    <h4 className="text-sm font-bold text-gray-100 line-clamp-1 group-hover:text-zoop-copper">
                      {product.name || product.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-black text-white">
                        {formatInrWithSymbol(product.price || 0, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      {(product.mrp || product.originalPrice) && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatInrWithSymbol(
                            product.mrp || product.originalPrice || 0,
                            {
                              maximumFractionDigits: 0,
                            },
                          )}
                        </span>
                      )}
                      {product.discountPercent > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded">
                          {product.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="space-y-4">
        <AdBanner type="horizontal" slotId="home_bottom" />
      </section>

      {/* BRAND SHOWCASE */}
      {featuredBrands.length > 0 && (
        <section className="bg-zoop-canvas rounded-[3rem] p-8 md:p-20 text-center overflow-hidden relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-zoop-clay blur-3xl rounded-full opacity-50" />
          <h2 className="text-3xl md:text-5xl font-black text-black italic relative z-10">
            Brands You Can Shop Now.
            <span className="text-zoop-moss"> Ready to deliver.</span>
          </h2>
          <p className="relative z-10 mt-3 text-sm md:text-base text-gray-400">
            Shop the products of latest Brands.
          </p>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 relative z-10">
              {featuredBrands.map((brand, idx) => (
                <Link
                  to={`/search?q=${encodeURIComponent(brand.name)}`}
                  key={brand.id || idx}
                  className="glass-card border border-black/10 rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-all cursor-pointer group shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg"
                >
                  <div className="h-20 w-full rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                    {brand.image ? (
                      <img
                        src={optimizeCloudinaryUrl(brand.image, { width: 500 })}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        alt={brand.name}
                      />
                    ) : (
                      <span className="font-black text-lg text-white">
                        {brand.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 font-black text-white">{brand.name}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {brand.tier}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CATEGORY GRID */}
      {collectionCategories.length > 0 && (
        <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#fcfaf7] via-[#fffefc] to-[#f7f4ee] p-6 md:p-10 shadow-[0_16px_40px_rgba(36,32,24,0.08)] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #8b5e3c 1px, transparent 1px), linear-gradient(-45deg, #8b5e3c 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h3 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                  Explore Our Collections
                </h3>
                <p className="text-base text-gray-300 mt-2 max-w-3xl">
                  Discover curated products across all categories — from local
                  artisans to global brands
                </p>
              </div>
              <Link
                to="/products"
                className="hidden md:inline-flex text-sm font-bold text-gray-400 hover:text-zoop-obsidian underline underline-offset-4"
              >
                View all products
              </Link>
            </div>

            {contentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            ) : (
              <>
                <div className="md:hidden -mx-2 px-2 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-gap">
                  {collectionCategories.map((cat, idx) => (
                    <Link
                      key={cat.id || idx}
                      to={cat.path || `/category/${cat.id}`}
                      className="snap-start min-w-[84%] h-72 rounded-2xl overflow-hidden border border-white/10 glass-card shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform"
                    >
                      <div className="relative h-full">
                        <img
                          src={getCategoryVisual(cat.id, cat.name, cat.image)}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-2xl font-black">{cat.name}</p>
                          <p className="text-base opacity-90 mt-1 line-clamp-1">
                            {cat.desc || "Curated for local-first shoppers"}
                          </p>
                          <p className="mt-3 text-sm font-bold">
                            Explore {cat.name} →
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="hidden md:grid bento-grid mt-4">
                  {collectionCategories.map((cat, idx) => (
                    <Link
                      key={cat.id || idx}
                      to={cat.path || `/category/${cat.id}`}
                      className={`group ${idx === 0 ? "col-span-12 md:col-span-8 md:row-span-2 min-h-[440px]" : idx === 1 || idx === 2 ? "col-span-12 md:col-span-4 min-h-[210px]" : "col-span-12 md:col-span-4 min-h-[280px]"} rounded-[24px] overflow-hidden border border-white/10 glass-card shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-zoop-moss bento-item`}
                    >
                      <div className="relative h-full">
                        <img
                          src={getCategoryVisual(cat.id, cat.name, cat.image)}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-2xl font-black">{cat.name}</p>
                          <p className="text-base opacity-90 mt-1 line-clamp-1">
                            {cat.desc || "Curated for local-first shoppers"}
                          </p>
                          <p className="mt-3 text-sm font-bold">
                            Explore {cat.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="md:hidden mt-5 text-center">
              <Link
                to="/products"
                className="text-sm font-bold text-gray-400 hover:text-zoop-obsidian underline underline-offset-4"
              >
                View all products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FEATURED COLLECTIONS */}
      {contentLoading ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </section>
      ) : collections.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
          {collections.map((col, idx) => (
            <Link
              key={col.id || idx}
              to={col.path || "/products"}
              className={`group relative h-80 md:h-96 ${
                idx === 0
                  ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                  : "bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50"
              } rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)] hover:shadow-2xl transition-all duration-500`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
              <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-10">
                <div
                  className={`inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 mb-4 w-fit ${
                    idx === 0
                      ? "bg-blue-500/20 border border-blue-400/30"
                      : "bg-rose-500/20 border border-rose-400/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      idx === 0 ? "bg-blue-400" : "bg-rose-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${
                      idx === 0 ? "text-blue-300" : "text-rose-900"
                    }`}
                  >
                    {col.badge || col.subtitle}
                  </span>
                </div>
                <h3
                  className={`text-4xl md:text-5xl font-black mb-3 tracking-tight ${
                    idx === 0 ? "text-white" : "text-rose-950"
                  }`}
                >
                  {col.title}
                </h3>
                <p
                  className={`text-base md:text-lg font-medium mb-6 max-w-md ${
                    idx === 0 ? "text-white/80" : "text-rose-950/80"
                  }`}
                >
                  {col.desc}
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider hover:scale-105 transition-all duration-300 w-fit ${
                    idx === 0
                      ? "glass-card text-slate-900 hover:bg-blue-400"
                      : "bg-rose-950 text-white hover:bg-rose-600"
                  }`}
                >
                  <span>Shop Collection</span>
                  <ChevronRight width={18} height={18} />
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        // Fallback static collections
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
          <Link
            to="/category/men"
            className="group relative h-80 md:h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)] hover:shadow-2xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <Shoe width={300} height={300} stroke="#b7e84b" />
            </div>
            <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-10">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                MEN'S <span className="text-blue-400 italic">CRUISE</span>
              </h3>
              <p className="text-white/80 text-base md:text-lg font-medium mb-6">
                Local leathercraft meets modern formal wear.
              </p>
              <div className="inline-flex items-center gap-2 glass-card text-slate-900 px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider w-fit">
                Shop Collection
              </div>
            </div>
          </Link>
          <Link
            to="/category/women"
            className="group relative h-80 md:h-96 bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)] hover:shadow-2xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-rose-900/30 to-transparent z-10" />
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Dress width={300} height={300} stroke="#A0522D" />
            </div>
            <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-10">
              <h3 className="text-4xl md:text-5xl font-black text-rose-950 mb-3 tracking-tight">
                WOMEN'S <span className="text-rose-600 italic">ETHNIC</span>
              </h3>
              <p className="text-rose-950/80 text-base md:text-lg font-medium mb-6">
                Direct from Surat's master weavers.
              </p>
              <div className="inline-flex items-center gap-2 bg-rose-950 text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider w-fit">
                Shop Collection
              </div>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
};

export default Home;
