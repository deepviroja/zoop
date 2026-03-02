import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import { apiClient } from "../../api/client";
import { productsApi } from "../../services/api";
import { Heart } from "../../assets/icons/Heart";
import { Zap } from "../../assets/icons/Zap";
import { Truck } from "../../assets/icons/Truck";
import { Shield } from "../../assets/icons/Shield";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import StarRating from "../../components/product/StarRating";
import ProductCard from "../../components/product/ProductCard";
import { ProductDetailSkeleton } from "../../components/shared/Skeletons";
import { frequentlyBoughtTogether } from "../../utils/recommendations";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { user, location } = useUser();
  const { showToast } = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showFbtPanel, setShowFbtPanel] = useState(false);
  const [reviews, setReviews] = useState([]);

  // UI State
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const isLiked = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/products/${id}`);
        // Normalize backend data to match UI needs
        const normalized = {
          ...data,
          id: data.id || id,
          name: data.title || data.name || "Product Name",
          description: data.description || "No description available",
          price: Number(data.price) || 0,
          originalPrice: Number(data.originalPrice) || 0,
          image:
            data.thumbnailUrl ||
            data.image ||
            "https://via.placeholder.com/300",
          images:
            data.imageUrls && data.imageUrls.length > 0
              ? data.imageUrls
              : [
                  data.thumbnailUrl ||
                    data.image ||
                    "https://via.placeholder.com/300",
                ],
          videos: Array.isArray(data.videoUrls) ? data.videoUrls : [],
          category: data.categoryId || data.category || "Uncategorized",
          brand: data.brand || "Generic",
          rating: Number(data.rating) || 0,
          reviews: Number(data.ratingCount) || 0,
          inStock: data.stock > 0,
          stock: Number(data.stock) || 0,
          features: data.features || [],
          specs: {
            ...(data.specifications || {}),
            ...(data.material ? { material: data.material } : {}),
            ...(data.ram ? { ram: data.ram } : {}),
            ...(data.storage ? { storage: data.storage } : {}),
            ...(data.weightGrams ? { weight: `${data.weightGrams} g` } : {}),
            ...(data.countryOfOrigin
              ? { countryOfOrigin: data.countryOfOrigin }
              : {}),
            ...(data.warrantyInfo ? { warranty: data.warrantyInfo } : {}),
            ...(Array.isArray(data.colorOptions) && data.colorOptions.length > 0
              ? { colors: data.colorOptions.join(", ") }
              : {}),
            ...(Array.isArray(data.sizeOptions) && data.sizeOptions.length > 0
              ? { sizes: data.sizeOptions.join(", ") }
              : {}),
            ...(data.dimensions
              ? {
                  dimensions: [
                    data.dimensions.width ? `W ${data.dimensions.width}` : "",
                    data.dimensions.height ? `H ${data.dimensions.height}` : "",
                    data.dimensions.depth ? `D ${data.dimensions.depth}` : "",
                    data.dimensions.unit || "",
                  ]
                    .filter(Boolean)
                    .join(" x "),
                }
              : {}),
          },
          attributes: Array.isArray(data.attributes) ? data.attributes : [],
          sizes: data.sizeOptions || data.sizes || [],
          colors: data.colorOptions || data.colors || [],
          type: data.type || "Standard",
          deliveryTime: data.deliveryTime || "3-5 Business Days",
          returnPolicy: data.returnPolicy || "7 Days Return",
          aboutItem: data.aboutItem || "",
          seller: data.seller || null,
        };
        setProduct(normalized);
        try {
          const reviewList = await productsApi.getReviews(data.id || id);
          setReviews(Array.isArray(reviewList) ? reviewList : []);
        } catch {
          setReviews([]);
        }

        // Fetch Related Products
        if (normalized.category) {
          try {
            const relatedData = await apiClient.get(
              `/products?category=${normalized.category}`,
            );
            const related = relatedData
              .filter((p) => p.id !== id && p.id !== normalized.id)
              .slice(0, 4)
              .map((p) => ({
                ...p,
                name: p.title || p.name,
                image: p.thumbnailUrl || p.image,
                price: Number(p.price),
                inStock: p.stock > 0,
                rating: Number(p.rating) || 0,
                reviews: Number(p.ratingCount) || 0,
              }));
            setRelatedProducts(related);
            const others = relatedData
              .filter(
                (p) =>
                  p.id !== id &&
                  p.id !== normalized.id &&
                  !related.some((rp) => rp.id === p.id),
              )
              .slice(0, 10)
              .map((p) => ({
                ...p,
                name: p.title || p.name,
                image: p.thumbnailUrl || p.image,
                price: Number(p.price),
                inStock: p.stock > 0,
                rating: Number(p.rating) || 0,
                reviews: Number(p.ratingCount) || 0,
              }));
            setOtherProducts(others);
          } catch (e) {
            console.warn("Failed to load related products", e);
          }
        }
        try {
          const catalog = await productsApi.getAll();
          setAllProducts(Array.isArray(catalog) ? catalog : []);
        } catch {
          setAllProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // Validate size selection for apparel
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast("Please select a size", "warning");
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    setShowFbtPanel(true);
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast("Please login to proceed to checkout", "info", {
        label: "Login",
        onClick: () => navigate("/login"),
      });
      return;
    }

    // Determine size to add (same validation as handleAddToCart)
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast("Please select a size", "warning");
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    // Don't show "Added to cart" toast here, just go to checkout
    navigate("/checkout");
  };

  const discount =
    product?.originalPrice && product?.originalPrice > product?.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const fbtProducts = useMemo(
    () => frequentlyBoughtTogether(product, allProducts, 6),
    [product, allProducts],
  );

  const secondarySuggestions = useMemo(() => {
    if (!product) return [];
    const baseCat = String(product.categoryId || product.category || "").toLowerCase();
    return allProducts
      .filter((p) => p.id !== product.id)
      .filter(
        (p) => String(p.categoryId || p.category || "").toLowerCase() !== baseCat,
      )
      .sort(
        (a, b) =>
          Number(b.orderedCount || 0) + Number(b.ratingCount || 0) -
          (Number(a.orderedCount || 0) + Number(a.ratingCount || 0)),
      )
      .slice(0, 10);
  }, [allProducts, product]);

  const displaySimilar = relatedProducts.length > 0 ? relatedProducts : fbtProducts;

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zoop-obsidian mb-4">
            Product Not Found
          </h2>
          <Link to="/" className="text-zoop-moss font-bold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const images = (product.images || [product.image]).map((src) =>
    optimizeCloudinaryUrl(src, { width: 1200 }),
  );
  const mediaItems = [
    ...images.map((src) => ({ type: "image", src })),
    ...(product.videos || []).map((src) => ({
      type: "video",
      src: optimizeCloudinaryUrl(src),
    })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-zoop-moss">
              Home
            </Link>
            <span>/</span>
            <Link
              to={`/category/${(product.category || "all").toLowerCase()}`}
              className="hover:text-zoop-moss"
            >
              {product.category || "Uncategorized"}
            </Link>
            <span>/</span>
            <span className="text-zoop-obsidian font-bold line-clamp-1">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-zoop-canvas rounded-2xl overflow-hidden group">
              {mediaItems[selectedImage]?.type === "video" ? (
                <video
                  src={mediaItems[selectedImage]?.src}
                  controls
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <img
                  src={mediaItems[selectedImage]?.src || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Navigation Arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === 0 ? mediaItems.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                  >
                    <ChevronLeft width={24} height={24} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === mediaItems.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                  >
                    <ChevronRight width={24} height={24} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.type === "Local" && (
                  <div className="bg-zoop-moss text-zoop-obsidian text-sm font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Zap width={14} height={14} fill="black" /> SAME-DAY
                    DELIVERY
                  </div>
                )}
                {discount > 0 && (
                  <div className="bg-red-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg">
                    {discount}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {mediaItems.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {mediaItems.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-zoop-moss scale-95"
                        : "border-gray-200 hover:border-zoop-moss/50"
                    }`}
                  >
                    {media.type === "video" ? (
                      <div className="w-full h-full bg-black text-white text-xs flex items-center justify-center">
                        Video
                      </div>
                    ) : (
                      <img
                        src={media.src}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              <p className="text-sm font-bold text-zoop-copper uppercase tracking-wider">
                {product.brand}
              </p>
              <h1 className="text-3xl md:text-4xl font-900 text-zoop-obsidian mt-2 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 mt-3 leading-relaxed">
                {product.aboutItem || product.description}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Ordered {(Number(product.orderedCount || 0)).toLocaleString()} times
              </p>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <StarRating rating={product.rating} totalReviews={product.reviews || 0} size={18} />
              <span className="text-sm text-gray-500">
                {(product.reviews || 0).toLocaleString()} reviews
              </span>
              {product.inStock && (
                <span className="text-sm text-green-600 font-bold">
                  In Stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-900 text-zoop-obsidian">
                  ₹{(product.price || 0).toLocaleString()}
                </span>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₹{(product.originalPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-black text-sm">
                        Save ₹
                        {(
                          product.originalPrice - product.price
                        ).toLocaleString()}
                      </span>
                    </>
                  )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Inclusive of all taxes
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-zoop-obsidian uppercase tracking-wider">
                    Select Size
                  </label>
                  <button className="text-xs text-zoop-moss font-bold hover:underline">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition-all ${
                        selectedSize === size
                          ? "border-zoop-moss bg-zoop-moss/10 text-zoop-obsidian"
                          : "border-gray-200 hover:border-zoop-moss/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="pb-6 border-b border-gray-200">
                <label className="text-sm font-bold text-zoop-obsidian uppercase tracking-wider block mb-3">
                  Select Color {selectedColor && `- ${selectedColor}`}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        selectedColor === color
                          ? "border-zoop-moss bg-zoop-moss/10 text-zoop-obsidian"
                          : "border-gray-200 hover:border-zoop-moss/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="pb-6 border-b border-gray-200">
              <label className="text-sm font-bold text-zoop-obsidian uppercase tracking-wider block mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center font-black text-xl hover:bg-white rounded-lg transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-900 text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock || 10, quantity + 1))
                    }
                    className="w-12 h-12 flex items-center justify-center font-black text-xl hover:bg-white rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                {product.stock && product.stock < 10 && (
                  <p className="text-sm text-orange-600 font-bold">
                    Only {product.stock} left in stock!
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (isInCart(product.id)) {
                    navigate("/cart");
                  } else {
                    handleAddToCart();
                  }
                }}
                disabled={!product.inStock}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                  product.inStock
                    ? "bg-zoop-moss text-zoop-obsidian hover:shadow-2xl hover:-translate-y-1"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isInCart(product.id)
                  ? "View in Cart"
                  : product.inStock
                    ? "Add to Cart"
                    : "Out of Stock"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider border-2 transition-all ${
                  product.inStock
                    ? "border-zoop-obsidian text-zoop-obsidian hover:bg-zoop-obsidian hover:text-white"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
              >
                Buy Now
              </button>
              {showFbtPanel && fbtProducts.length > 0 && (
                <div className="bg-zoop-canvas border border-zoop-moss/30 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-black text-zoop-obsidian">
                      Frequently Bought Together
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowFbtPanel(false)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {fbtProducts.map((item) => (
                      <div key={item.id} className="min-w-[180px] max-w-[180px]">
                        <ProductCard product={item} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (user) {
                    toggleWishlist(product.id);
                    showToast(
                      !isLiked ? "Added to wishlist" : "Removed from wishlist",
                      "success",
                    );
                  } else {
                    showToast("Please login to add to wishlist", "info", {
                      label: "Login",
                      onClick: () => navigate("/login"),
                    });
                  }
                }}
                className="w-full py-4 rounded-xl font-bold text-sm transition-all border-2 border-gray-200 hover:border-red-500 flex items-center justify-center gap-2"
              >
                <Heart
                  width={20}
                  height={20}
                  className={
                    isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
                  }
                />
                {isLiked ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="font-black text-zoop-obsidian uppercase tracking-wider text-sm">
                Delivery & Services
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Truck
                    width={20}
                    height={20}
                    className="text-zoop-moss shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-sm text-zoop-obsidian">
                      {product.type === "Local"
                        ? `Same-Day Delivery in ${location}`
                        : "Fast Delivery"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {product.deliveryTime || "2-3 days"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield
                    width={20}
                    height={20}
                    className="text-zoop-moss shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-sm text-zoop-obsidian">
                      {product.returnPolicy || "7 Days"} Return Policy
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Easy returns and refunds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specifications, Reviews */}
        <div className="border-t border-gray-200 pt-12">
          <div className="flex gap-8 border-b border-gray-200 mb-8">
            {["description", "specifications", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 font-black uppercase tracking-wider text-sm transition-all ${
                  activeTab === tab
                    ? "text-zoop-obsidian border-b-2 border-zoop-moss"
                    : "text-gray-400 hover:text-zoop-obsidian"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
              {product.aboutItem && product.aboutItem !== product.description && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-black text-zoop-obsidian mb-1">About This Item</p>
                  <p className="text-gray-700">{product.aboutItem}</p>
                </div>
              )}
              {product.features && (
                <div className="mt-6">
                  <h3 className="font-black text-lg text-zoop-obsidian mb-4">
                    Key Features
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-gray-700"
                      >
                        <span className="text-zoop-moss">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(product.attributes) && product.attributes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-black text-lg text-zoop-obsidian mb-4">
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.attributes.map((attr, idx) => (
                      <div
                        key={`${attr.key}-${idx}`}
                        className="rounded-lg border border-gray-100 bg-white p-3"
                      >
                        <p className="text-xs text-gray-500 uppercase font-bold">{attr.key}</p>
                        <p className="text-sm text-zoop-obsidian font-bold mt-1">
                          {(attr.values || []).join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.seller && (
                <div className="mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                  <h3 className="font-black text-lg text-zoop-obsidian mb-4">
                    Seller Information
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center text-2xl font-black text-zoop-obsidian">
                      {product.seller.photoURL ? (
                        <img
                          src={optimizeCloudinaryUrl(product.seller.photoURL, {
                            width: 220,
                          })}
                          alt={product.seller.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{(product.seller.name || "S")[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zoop-obsidian">
                        {product.seller.businessName || product.seller.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.seller.city && product.seller.state
                          ? `${product.seller.city}, ${product.seller.state}`
                          : product.seller.city || product.seller.state || "India"}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {product.seller.phone && <p>Phone: {product.seller.phone}</p>}
                      {product.seller.email && <p>Email: {product.seller.email}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "specifications" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.specs && Object.keys(product.specs).length > 0 ? (
                Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="font-bold text-zoop-obsidian">
                      {Array.isArray(value) ? value.join(", ") : value}
                    </p>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                  Specifications will appear here once seller adds product details.
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="py-2">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No reviews yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zoop-obsidian">{review.userName || "Customer"}</p>
                        <StarRating rating={Number(review.rating || 0)} size={14} />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {displaySimilar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-900 text-zoop-obsidian mb-4">
              Similar Products
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3">
              {displaySimilar.map((item) => (
                <div key={item.id} className="min-w-[260px] max-w-[260px]">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {(otherProducts.length > 0 || secondarySuggestions.length > 0) && (
          <div className="mt-10">
            <h2 className="text-2xl font-900 text-zoop-obsidian mb-4">
              View Also
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3">
              {(otherProducts.length > 0 ? otherProducts : secondarySuggestions).map((item) => (
                <div key={item.id} className="min-w-[260px] max-w-[260px]">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
