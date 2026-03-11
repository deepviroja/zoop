import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Heart } from "../../assets/icons/Heart";
import { Star } from "../../assets/icons/Star";
import { Zap } from "../../assets/icons/Zap";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import StarRating from "./StarRating";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import { getDeliveryEstimate } from "../../utils/delivery";
import { formatInrWithSymbol } from "../../utils/currency";

const ProductCard = ({ product, view = "grid" }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Normalize product data
  const isInStock = product.stock > 0 || product.inStock === true;
  const displayImage =
    product.thumbnailUrl ||
    product.image ||
    (product.images && product.images[0]) ||
    (product.imageUrls && product.imageUrls[0]) ||
    "/brand-mark.svg";
  const displayImages = product.imageUrls || product.images || [displayImage];
  const optimizedDisplayImage = optimizeCloudinaryUrl(displayImage, {
    width: 800,
  });
  const optimizedDisplayImages = (displayImages || []).map((u) =>
    optimizeCloudinaryUrl(u, { width: 800 }),
  );
  const productTitle = product.title || product.name || "Product image";

  const [imageIndex, setImageIndex] = useState(0);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  const isLiked = isInWishlist(product.id);

  // Mock sizes for demo
  const sizes = ["S", "M", "L", "XL"];
  const hasSizes = ["Clothing", "Footwear"].includes(product.category);

  const handleAddToCart = (e, size = null) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (isInCart(product.id)) {
      navigate("/cart");
      return;
    }

    if (hasSizes && !size && !selectedSize) {
      if (window.innerWidth < 768) {
        setQuickAddOpen(true);
      } else {
        // Desktop hover likely won't trigger this path easily if sizes are required,
        // but for now desktop users go to detail page for sizes usually
        // or we allow default add.
        addToCart({ ...product, image: displayImage }, 1);
      }
      return;
    }

    addToCart(
      { ...product, image: displayImage, selectedSize: size || selectedSize },
      1,
    );
    setQuickAddOpen(false);
  };

  const handleMobileAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasSizes) {
      setQuickAddOpen(true);
    } else {
      handleAddToCart(e);
    }
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleWishlist(product.id);
      if (isLiked) {
        showToast("Removed from wishlist", "info");
      } else {
        showToast("Added to wishlist ❤️", "success");
      }
    } else {
      showToast("Please login to add to wishlist", "info", {
        label: "Login",
        onClick: () => navigate("/login"),
      });
    }
  };

  const discount =
    product.discountPercent > 0
      ? product.discountPercent
      : (product.mrp || product.originalPrice) &&
          (product.mrp || product.originalPrice) > product.price
        ? Math.round(
            (((product.mrp || product.originalPrice) - product.price) /
              (product.mrp || product.originalPrice)) *
              100,
          )
        : 0;
  const deliveryEstimate = getDeliveryEstimate(
    product,
    user?.city || user?.defaultLocation,
  );

  if (view === "list") {
    return (
      <Link
        to={`/product/${product.id}`}
        className="block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-2xl transition-all group"
      >
        <div className="flex gap-6 p-6">
          {/* Image */}
          <div className="w-48 h-48 bg-zoop-canvas rounded-lg overflow-hidden shrink-0 relative">
            <img
              src={optimizedDisplayImage}
              alt={productTitle}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                e.target.src = "/brand-mark.svg";
              }}
            />
            {product.type === "Local" && (
              <div className="absolute top-2 left-2 bg-zoop-moss text-zoop-obsidian text-[10px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Zap width={10} height={10} fill="black" /> SAME-DAY
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">
                {discount}% OFF
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {product.brand}
                  </p>
                  <h3 className="text-xl font-bold text-zoop-obsidian mt-1 line-clamp-2 group-hover:text-zoop-moss transition-colors">
                    {product.title || product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <button
                  onClick={handleLike}
                  aria-label={
                    isLiked ? "Remove from wishlist" : "Add to wishlist"
                  }
                  className="p-2 hover:bg-gray-50 rounded-full transition-all"
                >
                  <Heart
                    width={20}
                    height={20}
                    className={
                      isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
                    }
                  />
                </button>
              </div>

              {/* Rating */}
              <div className="mt-3">
                <StarRating
                  rating={product.rating}
                  totalReviews={product.ratingCount || product.reviews}
                  size={14}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Ordered {Number(product.orderedCount || 0).toLocaleString()}{" "}
                  times
                </p>
              </div>
            </div>

            {/* Price & Actions */}
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-zoop-obsidian">
                    {formatInrWithSymbol(product.price || 0, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {(product.mrp || product.originalPrice) &&
                    (product.mrp || product.originalPrice) > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatInrWithSymbol(
                          product.mrp || product.originalPrice,
                          {
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    )}
                </div>
                {(product.deliveryTime || product.type === "Local") && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {deliveryEstimate.label}
                  </p>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                aria-label={
                  isInCart(product.id)
                    ? `View ${productTitle} in cart`
                    : isInStock
                      ? `Add ${productTitle} to cart`
                      : `${productTitle} is out of stock`
                }
                className={`px-6 py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isInStock
                    ? "bg-zoop-obsidian text-white hover:bg-zoop-moss hover:text-zoop-obsidian hover:scale-105"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isInCart(product.id) ? (
                  <>
                    <ShoppingCart width={18} height={18} />
                    View in Cart
                  </>
                ) : isInStock ? (
                  <>
                    <ShoppingCart width={18} height={18} />
                    Add to Cart
                  </>
                ) : (
                  "Out of Stock"
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid View (Default)
  return (
    <>
      <Link
        to={`/product/${product.id}`}
        className="block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all group"
        onMouseEnter={() => displayImages.length > 1 && setImageIndex(1)}
        onMouseLeave={() => setImageIndex(0)}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-zoop-canvas overflow-hidden">
          <img
            src={optimizedDisplayImages[imageIndex] || optimizedDisplayImage}
            alt={productTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              e.target.src = "/brand-mark.svg";
            }}
          />

          {/* Badges - Limited to 2 most important */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <div className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                {discount}% OFF
              </div>
            )}
            {product.type === "Local" && (
              <div className="bg-zoop-moss text-zoop-obsidian text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Zap width={10} height={10} fill="black" /> SAME-DAY
              </div>
            )}
            {/* Show tag only if no discount and not local delivery */}
            {!discount && product.type !== "Local" && product.tag && (
              <div className="bg-white/90 backdrop-blur text-zoop-obsidian text-[10px] font-black px-3 py-1 rounded-full">
                {product.tag}
              </div>
            )}
          </div>

          {/* Wishlist Heart - Always Visible */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleLike}
              className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
              aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                width={20}
                height={20}
                className={
                  isLiked
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400 hover:text-red-400"
                }
                fill={isLiked ? "currentColor" : "none"}
              />
            </button>
          </div>

          {/* Quick Add to Cart (Desktop Hover) */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              aria-label={
                isInCart(product.id)
                  ? `View ${productTitle} in cart`
                  : isInStock
                    ? `Quick add ${productTitle} to cart`
                    : `${productTitle} is out of stock`
              }
              className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isInStock
                  ? "bg-zoop-obsidian/95 backdrop-blur text-white hover:bg-zoop-moss hover:text-zoop-obsidian"
                  : "bg-gray-400/90 text-white cursor-not-allowed"
              }`}
            >
              <ShoppingCart width={18} height={18} />
              {isInCart(product.id)
                ? "View in Cart"
                : isInStock
                  ? "Quick Add"
                  : "Out of Stock"}
            </button>
          </div>

          {/* Stock Indicator */}
          {!isInStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="bg-gray-900 text-white px-6 py-2 rounded-full font-black text-sm uppercase">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category & Brand */}
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            <span>{product.gender || product.category}</span>
            <span className="text-zoop-copper">{product.brand}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-base font-bold text-zoop-obsidian line-clamp-2 min-h-[3rem] group-hover:text-zoop-moss transition-colors">
            {product.title || product.name}
          </h3>

          {/* Rating */}
          <div className="mt-2">
            <StarRating
              rating={product.rating}
              totalReviews={product.ratingCount || product.reviews}
              size={12}
            />
            <p className="text-[10px] text-gray-500 mt-1">
              {Number(product.orderedCount || 0).toLocaleString()} ordered
            </p>
          </div>

          {/* Price & Mobile Add */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-zoop-obsidian">
                {formatInrWithSymbol(product.price || 0, {
                  maximumFractionDigits: 0,
                })}
              </span>
              {(product.mrp || product.originalPrice) &&
                (product.mrp || product.originalPrice) > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatInrWithSymbol(product.mrp || product.originalPrice, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                )}
            </div>

            {/* Mobile Add Button */}
            <button
              onClick={handleMobileAdd}
              aria-label={
                hasSizes
                  ? `Choose size for ${productTitle}`
                  : `Add ${productTitle} to cart`
              }
              className="md:hidden bg-zoop-obsidian text-white p-2.5 rounded-xl hover:bg-zoop-moss hover:text-zoop-obsidian transition-colors shadow-lg active:scale-95"
            >
              <ShoppingCart width={18} height={18} />
            </button>
          </div>

          {/* Delivery Info */}
          {(product.deliveryTime || product.type === "Local") && (
            <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
              {deliveryEstimate.isSameDay ? (
                <>
                  <Zap width={10} height={10} fill="currentColor" />
                  {deliveryEstimate.label}
                </>
              ) : (
                deliveryEstimate.label
              )}
            </p>
          )}
        </div>
      </Link>

      {/* Mobile Quick Add Sheet */}
      {isQuickAddOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={(e) => {
            e.preventDefault();
            setQuickAddOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="w-full bg-white rounded-t-[2rem] p-6 relative z-10 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={optimizedDisplayImage}
                  alt={productTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-zoop-obsidian text-lg line-clamp-1">
                  {product.title || product.name}
                </h3>
                <p className="text-zoop-obsidian font-black text-xl mt-1">
                  {formatInrWithSymbol(product.price || 0, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Select Size
            </p>
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  aria-label={`Select size ${size}`}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${
                    selectedSize === size
                      ? "bg-zoop-obsidian text-white shadow-lg scale-110"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={(e) => handleAddToCart(e)}
              disabled={!selectedSize}
              aria-label={`Add ${productTitle} to cart${selectedSize ? ` in size ${selectedSize}` : ""}`}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${
                selectedSize
                  ? "bg-zoop-moss text-zoop-obsidian shadow-lg shadow-zoop-moss/20"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              <ShoppingCart width={18} height={18} />
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
