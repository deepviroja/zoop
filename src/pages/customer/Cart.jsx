import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import { Delete } from "../../assets/icons/Delete";
import { Heart } from "../../assets/icons/Heart";
import { contentApi, ordersApi } from "../../services/api";
import { productsApi } from "../../services/api";
import ProductCard from "../../components/product/ProductCard";

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [proceeding, setProceeding] = useState(false);
  const [blockedItems, setBlockedItems] = useState([]);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getAll()
      .then((items) => {
        if (!cancelled) setAllProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setAllProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const relatedSuggestions = useMemo(() => {
    const cartProductIds = new Set(cartItems.map((i) => i.id));
    const cartCategories = new Set(
      cartItems.map((i) => String(i.categoryId || i.category || "").toLowerCase()).filter(Boolean),
    );
    return allProducts
      .filter((p) => !cartProductIds.has(p.id))
      .filter((p) => cartCategories.has(String(p.categoryId || p.category || "").toLowerCase()))
      .slice(0, 10);
  }, [allProducts, cartItems]);

  const handleApplyCoupon = () => {
    // Simple coupon logic - can be enhanced
    if (couponCode.toUpperCase() === "ZOOP10") {
      setDiscount(getCartTotal() * 0.1);
    } else if (couponCode.toUpperCase() === "FIRST50") {
      setDiscount(50);
    } else {
      alert("Invalid coupon code");
    }
  };

  const handleWishlistClick = (item) => {
    if (!user) {
      showToast("Please login to add to wishlist", "error");
      return;
    }
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
      showToast("Removed from wishlist", "info");
    } else {
      addToWishlist(item);
      showToast("Added to wishlist", "success");
    }
  };

  const handleProceedToCheckout = async () => {
    if (!user) {
      showToast("Please login to proceed to checkout", "error", {
        label: "Login",
        onClick: () => navigate("/login"),
      });
      return;
    }

    setProceeding(true);
    try {
      const normalizedItems = cartItems.map((item) => ({
        productId: item.id,
        quantity: Number(item.quantity) || 1,
      }));
      await ordersApi.reserveCheckout(normalizedItems, 15);
      showToast("Items reserved for 15 minutes. Complete payment to confirm.", "success");
      navigate("/checkout");
    } catch (e) {
      const maybeBlocked = e?.data?.blockedItems || e?.blockedItems;
      if (Array.isArray(maybeBlocked) && maybeBlocked.length) {
        setBlockedItems(maybeBlocked);
        setShowBlockedPopup(true);
      } else if (Array.isArray(e?.missingFields) || Array.isArray(e?.data?.missingFields)) {
        const missing = e?.missingFields || e?.data?.missingFields;
        showToast(
          `Please complete profile before checkout: ${missing.join(", ")}`,
          "warning",
        );
        navigate("/profile");
      } else {
        showToast(e?.message || "Could not proceed to checkout right now", "error");
      }
    } finally {
      setProceeding(false);
    }
  };

  // Calculate totals
  const subtotal = getCartTotal();
  const shipping = cartItems.some((item) => item.type === "National") ? 150 : 0;
  const localDelivery = cartItems.some((item) => item.type === "Local") ? 0 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + shipping + localDelivery + tax - discount;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-zoop-canvas py-12 px-6 flex items-center justify-center">
        <div className="bg-white rounded-[3rem] py-32 px-12 text-center border-2 border-dashed border-zoop-clay/30 max-w-2xl">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-3xl font-black text-zoop-obsidian">
            Your Cart is Empty
          </h2>
          <p className="text-gray-400 mt-4 text-lg">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 bg-zoop-obsidian text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all shadow-lg hover:shadow-xl"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zoop-canvas py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* LEFT: ITEM LIST */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zoop-clay/20 pb-4 gap-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-900 tracking-tighter text-zoop-obsidian italic">
                Shopping Cart
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                in your cart
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Delete width={14} height={14} />
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-4 md:space-y-6">
            {cartItems.map((item) => (
              <div
                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col gap-4 md:gap-6 hover:shadow-2xl transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Image */}
                <Link
                  to={`/product/${item.id}`}
                  className="w-full md:w-32 lg:w-40 h-32 md:h-32 lg:h-40 bg-zoop-canvas rounded-xl md:rounded-2xl overflow-hidden shrink-0 relative"
                >
                  <img
                    src={
                      item.image ||
                      item.thumbnailUrl ||
                      "/brand-mark.svg"
                    }
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = "/brand-mark.svg";
                    }}
                  />
                  {item.type === "Local" && (
                    <div className="absolute top-2 left-2 bg-zoop-moss text-zoop-obsidian px-2 py-1 rounded-md text-[8px] font-black uppercase">
                      ⚡ Same-Day
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-bold text-lg md:text-xl text-zoop-obsidian hover:text-zoop-moss transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-2">
                            {item.brand} •{" "}
                            <span className="text-zoop-obsidian/30 select-all">
                              {item.id}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${item.type === "Local" ? "bg-zoop-moss text-zoop-obsidian" : "bg-blue-100 text-blue-700"}`}
                            >
                              {item.type || "Standard"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              ₹{(item.price || 0).toLocaleString()} / unit
                            </span>
                          </div>
                        </div>
                        {(item.selectedSize || item.selectedColor) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {item.selectedSize && (
                              <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase">
                                Color: {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-900 text-xl md:text-2xl text-zoop-obsidian">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                            Total for {item.quantity} units
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock Status */}
                    {item.stock && item.stock < 10 && (
                      <p className="text-xs text-orange-600 font-bold mt-2">
                        Only {item.stock} left in stock
                      </p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center bg-zoop-canvas rounded-xl p-1 border border-gray-100">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1,
                            item.selectedSize,
                            item.selectedColor,
                          )
                        }
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-zoop-obsidian hover:bg-white rounded-lg transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        –
                      </button>
                      <span className="w-8 md:w-10 text-center font-900 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.selectedSize,
                            item.selectedColor,
                          )
                        }
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-zoop-obsidian hover:bg-white rounded-lg transition-colors"
                        disabled={item.stock && item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-3 md:gap-4">
                      <button
                        onClick={() => handleWishlistClick(item)}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <Heart
                          width={18}
                          height={18}
                          className={`transition-colors ${isInWishlist(item.id) ? "text-red-500 fill-current" : "text-gray-400 group-hover:text-red-500"}`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id,
                            item.selectedSize,
                            item.selectedColor,
                          )
                        }
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <Delete
                          width={18}
                          height={18}
                          className="text-gray-400 group-hover:text-red-500 transition-colors"
                        />
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-lg border border-gray-100 lg:sticky lg:top-24">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-900 uppercase tracking-tight text-zoop-obsidian">
                Order Summary
              </h2>
              <div className="h-1 w-16 bg-zoop-moss mt-2"></div>
            </div>

            {/* Coupon Code */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Have a Coupon?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-zoop-obsidian text-white rounded-lg text-xs font-black uppercase hover:bg-zoop-moss hover:text-zoop-obsidian transition-colors"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <p className="text-xs text-green-600 font-bold mt-2">
                  ✓ Coupon applied! You saved ₹{discount}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  Subtotal ({cartItems.length} items)
                </span>
                <span className="font-black text-lg">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>

              {shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">
                    Shipping (National)
                  </span>
                  <span className="font-bold">₹{shipping}</span>
                </div>
              )}

              {localDelivery === 0 &&
                cartItems.some((item) => item.type === "Local") && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">
                      Local Delivery
                    </span>
                    <span className="text-zoop-moss font-black">FREE</span>
                  </div>
                )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Tax (5%)</span>
                <span className="font-bold">₹{tax}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Discount</span>
                  <span className="text-green-600 font-black">
                    -₹{discount}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Total Amount
                </span>
                <span className="text-3xl md:text-4xl font-900 text-zoop-obsidian">
                  ₹{total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                disabled={proceeding}
                className="w-full bg-zoop-moss text-zoop-obsidian py-4 md:py-5 rounded-xl font-black text-sm uppercase tracking-wider hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
              >
                {proceeding ? "Reserving items..." : "Proceed to Checkout"}
              </button>

              <Link
                to="/"
                className="block w-full text-center mt-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-600 hover:border-zoop-moss hover:text-zoop-obsidian transition-all"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Secure checkout</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Easy returns within 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showBlockedPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlockedPopup(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-lg font-900 text-zoop-obsidian mb-3">Checkout Unavailable</h4>
            <p className="text-sm text-gray-600">
              One or more items are reserved by another buyer for a short time.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Try again in a few minutes, or tap Notify Me to get availability updates.
            </p>
            {blockedItems.length > 0 && (
              <ul className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
                {blockedItems.map((b) => (
                  <li key={b.productId}>
                    Product {cartItems.find((c) => c.id === b.productId)?.title || b.productId} available qty: {b.availableQty}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowBlockedPopup(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg font-bold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={notifySubmitting}
                onClick={async () => {
                  setNotifySubmitting(true);
                  try {
                    await Promise.all(
                      blockedItems.map((item) => contentApi.subscribeStockAlert(item.productId)),
                    );
                    showToast("You will be notified when these items become available.", "success");
                    setShowBlockedPopup(false);
                    setBlockedItems([]);
                  } catch (e) {
                    showToast(e?.message || "Could not set availability alerts", "error");
                  } finally {
                    setNotifySubmitting(false);
                  }
                }}
                className="flex-1 py-2.5 bg-zoop-moss text-zoop-obsidian rounded-lg font-bold disabled:opacity-60"
              >
                {notifySubmitting ? "Please wait..." : "Notify Me"}
              </button>
            </div>
          </div>
        </div>
      )}

      {relatedSuggestions.length > 0 && (
        <div className="max-w-[1200px] mx-auto mt-10 rounded-[2rem] border border-[#e9dfcf] bg-white p-5 md:p-7 shadow-[0_18px_44px_rgba(42,32,15,0.08)]">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8b5e3c]">
                Frequently Bought Together
              </p>
              <h3 className="text-2xl font-900 text-zoop-obsidian">
                Complete your cart before checkout
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Matching picks from the same categories in your cart.
            </p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-gap">
            {relatedSuggestions.map((product) => (
              <div key={product.id} className="min-w-[260px] max-w-[260px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

