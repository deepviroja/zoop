import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "../../assets/icons/Heart";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { useCart } from "../../hooks/useCart";
import StarRating from "../../components/product/StarRating";
import { useWishlist } from "../../context/WishlistContext";
import { useToast } from "../../context/ToastContext";
import { apiClient } from "../../api/client";

const Wishlist = () => {
  const { addToCart, isInCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [allApiProducts, setAllApiProducts] = useState([]);

  useEffect(() => {
    // Fetch products to verify ID existence and get details
    apiClient
      .get("/products")
      .then(setAllApiProducts)
      .catch((err) =>
        console.error("Failed to fetch products for wishlist", err),
      );
  }, []);

  // Get actual wishlist products based on user's wishlist IDs
  const wishlistItems = allApiProducts.filter((product) =>
    wishlist.includes(product.id),
  );

  const handleAddToCart = (product) => {
    if (isInCart(product.id)) {
      navigate("/cart");
      return;
    }
    addToCart(product, 1);
    showToast("Added to cart 🛒", "success");
  };

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId);
    showToast("Removed from wishlist", "info");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-zoop-obsidian mb-2">
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlistItems.length}{" "}
            {wishlistItems.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart width={48} height={48} className="text-gray-300" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">
                Your Wishlist is Empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start adding products you love to your wishlist!
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zoop-moss hover:bg-zoop-moss/90 text-zoop-obsidian rounded-xl font-black transition-colors shadow-lg"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Product Image */}
                <div className="relative h-72 bg-gray-100 overflow-hidden">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={
                        product.thumbnailUrl ||
                        (product.imageUrls && product.imageUrls[0]) ||
                        product.image ||
                        "/brand-mark.svg"
                      }
                      alt={product.title || product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/brand-mark.svg";
                      }}
                    />
                  </Link>

                  {/* Remove Button - Filled Heart */}
                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-red-50 rounded-full flex items-center justify-center transition-all shadow-lg group/btn hover:scale-110"
                    aria-label="Remove from wishlist"
                  >
                    <Heart
                      width={20}
                      height={20}
                      className="fill-red-500 text-red-500 group-hover/btn:scale-110 transition-transform"
                      fill="currentColor"
                    />
                  </button>

                  {/* Discount Badge */}
                  {(product.discountPercent || product.discount) > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
                      {product.discountPercent || product.discount}% OFF
                    </div>
                  )}

                  {/* Stock Status */}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-black text-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-black text-zoop-obsidian mb-2 line-clamp-2 hover:text-zoop-moss transition-colors">
                      {product.title || product.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 mb-3">{product.brand}</p>

                  {/* Rating */}
                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating
                      rating={product.rating}
                      totalReviews={product.reviews || product.ratingCount}
                      size={16}
                    />
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-black text-zoop-obsidian">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </span>
                    {(product.mrp || product.originalPrice) && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹
                        {(product.mrp || product.originalPrice)?.toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    )}
                  </div>

                  {/* Same Day Delivery Badge */}
                  {product.sameDayDelivery && (
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold border border-green-200">
                        ⚡ Same Day Delivery
                      </span>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
                      product.stock === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isInCart(product.id)
                          ? "bg-zoop-obsidian text-white shadow-lg"
                          : "bg-zoop-moss hover:bg-zoop-moss/90 text-zoop-obsidian shadow-lg hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    <ShoppingCart width={18} height={18} />
                    {product.stock === 0
                      ? "Out of Stock"
                      : isInCart(product.id)
                        ? "In Cart"
                        : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {wishlistItems.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl font-bold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
