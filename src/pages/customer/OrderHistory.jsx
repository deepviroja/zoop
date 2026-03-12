import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ordersApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

const statusColor = (s) =>
  s === "delivered"
    ? "bg-green-100 text-green-700 border-green-200"
    : s === "shipped"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : s === "processing"
        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
        : s === "cancelled"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-yellow-100 text-yellow-700 border-yellow-200";

const statusIcon = (s) =>
  s === "delivered"
    ? "✅"
    : s === "shipped"
      ? "🚚"
      : s === "processing"
        ? "⚙️"
        : s === "cancelled"
          ? "❌"
          : "⏳";

const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 dark:bg-white/20 animate-pulse rounded-xl ${className}`} />
);

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z";

const OrderHistory = () => {
  const { user, isLoading: authLoading } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingOrderId, setProcessingOrderId] = useState("");
  const [returnDraft, setReturnDraft] = useState({ orderId: "", productId: "", reason: "" });
  const [reviewDraft, setReviewDraft] = useState({ orderId: "", productId: "", rating: 5, title: "", comment: "" });
  const { showToast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/history");
      return;
    }
    if (!user) return;

    const load = async () => {
      try {
        const data = await ordersApi.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading, navigate]);

  const filtered =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);
  const statuses = ["all", ...Array.from(new Set(orders.map((o) => o.status)))];

  const refreshOrders = async () => {
    try {
      const data = await ordersApi.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCancel = async (orderId) => {
    setProcessingOrderId(orderId);
    try {
      await ordersApi.cancel(orderId);
      showToast("Order cancelled successfully", "success");
      await refreshOrders();
    } catch (e) {
      showToast(e?.message || "Failed to cancel order", "error");
    } finally {
      setProcessingOrderId("");
    }
  };

  const submitReview = async () => {
    if (!reviewDraft.orderId || !reviewDraft.productId) return;
    try {
      await ordersApi.addReview(reviewDraft.orderId, {
        productId: reviewDraft.productId,
        rating: Number(reviewDraft.rating),
        title: reviewDraft.title?.trim() || undefined,
        comment: reviewDraft.comment?.trim() || undefined,
      });
      showToast("Review submitted", "success");
      setReviewDraft({ orderId: "", productId: "", rating: 5, title: "", comment: "" });
    } catch (e) {
      showToast(e?.message || "Could not submit review", "error");
    }
  };

  const submitReturnRequest = async () => {
    if (!returnDraft.orderId || !returnDraft.productId || returnDraft.reason.trim().length < 3) {
      showToast("Please enter a valid return reason", "warning");
      return;
    }
    try {
      await ordersApi.requestReturn(returnDraft.orderId, {
        productId: returnDraft.productId,
        reason: returnDraft.reason.trim(),
      });
      showToast("Return request submitted", "success");
      setReturnDraft({ orderId: "", productId: "", reason: "" });
      await refreshOrders();
    } catch (e) {
      showToast(e?.message || "Could not submit return request", "error");
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-zoop-canvas p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zoop-canvas flex items-center justify-center p-6">
        <div className="bg-white dark:glass-card rounded-2xl p-8 text-center max-w-lg shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white mb-2">
            Couldn't load your orders
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            We had trouble fetching your order history. Please check your
            connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zoop-canvas py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zoop-obsidian dark:text-white italic">
            My Orders
          </h1>
          <p className="text-gray-500 mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* Filter tabs */}
        {orders.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  filterStatus === s
                    ? "bg-zoop-obsidian text-white shadow"
                    : "bg-white dark:glass-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-zoop-moss"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white dark:glass-card rounded-[3rem] py-32 px-12 text-center border-2 border-dashed border-zoop-clay/30">
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-3xl font-black text-zoop-obsidian dark:text-white">
              {filterStatus === "all"
                ? "No Orders Yet"
                : `No ${filterStatus} orders`}
            </h2>
            <p className="text-gray-400 mt-4 text-lg">
              {filterStatus === "all"
                ? "You haven't placed any orders yet."
                : "Try selecting a different status filter."}
            </p>
            {filterStatus === "all" && (
              <Link
                to="/"
                className="inline-block mt-8 bg-zoop-obsidian text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-all p-6"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                      Order ID
                    </p>
                    <p className="font-black text-zoop-obsidian dark:text-white font-mono text-sm">
                      {order.id}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase border ${statusColor(order.status)}`}
                    >
                      {statusIcon(order.status)} {order.status}
                    </span>
                    <p className="mt-2 font-black text-xl text-zoop-obsidian dark:text-white">
                      Rs. {(order.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-zoop-canvas rounded-xl overflow-hidden shrink-0">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-zoop-obsidian dark:text-white truncate">
                            {item.title || "Product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × Rs. {item.price}
                          </p>
                        </div>
                        <p className="font-black text-zoop-obsidian dark:text-white whitespace-nowrap">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 mb-4">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                      Delivered to
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {order.shippingAddress.street},{" "}
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} -{" "}
                      {order.shippingAddress.zipCode}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Link
                    to={`/track?orderId=${order.id}`}
                    className="flex-1 text-center py-2.5 border-2 border-zoop-obsidian text-zoop-obsidian dark:text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zoop-obsidian hover:text-white transition-all"
                  >
                    Track Order
                  </Link>
                  {order.status === "delivered" && (
                    <>
                      <button
                        onClick={() =>
                          setReviewDraft({
                            orderId: order.id,
                            productId: order.items?.[0]?.productId || "",
                            rating: 5,
                            title: "",
                            comment: "",
                          })
                        }
                        className="flex-1 py-2.5 border-2 border-green-500 text-green-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-green-500 hover:text-white transition-all"
                      >
                        Write Review
                      </button>
                      {order.items?.some((item) => item.returnEligibleUntil && new Date(item.returnEligibleUntil).getTime() > Date.now() && item.returnRequest?.status !== "requested") && (
                        <button
                          onClick={() => {
                            const candidate = order.items.find(
                              (item) =>
                                item.returnEligibleUntil &&
                                new Date(item.returnEligibleUntil).getTime() > Date.now() &&
                                item.returnRequest?.status !== "requested",
                            );
                            if (candidate) {
                              setReturnDraft({
                                orderId: order.id,
                                productId: candidate.productId,
                                reason: "",
                              });
                            }
                          }}
                          className="flex-1 py-2.5 border-2 border-orange-400 text-orange-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-all"
                        >
                          Request Return
                        </button>
                      )}
                    </>
                  )}
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1 py-2.5 border-2 border-red-300 text-red-500 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all disabled:opacity-60"
                    >
                      {processingOrderId === order.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {reviewDraft.orderId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewDraft({ orderId: "", productId: "", rating: 5, title: "", comment: "" })} />
          <div className="relative bg-white dark:glass-card rounded-2xl w-full max-w-md p-6 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10">
            <h3 className="text-lg font-black text-zoop-obsidian dark:text-white mb-1">Rate this product</h3>
            <p className="text-sm text-gray-500 mb-4">Your feedback helps local buyers shop confidently.</p>
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">How was it?</label>
            <div className="grid grid-cols-5 gap-2 mt-2 mb-3">
              {[
                { value: 1, label: "Poor" },
                { value: 2, label: "Fair" },
                { value: 3, label: "Good" },
                { value: 4, label: "Great" },
                { value: 5, label: "Excellent" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setReviewDraft((p) => ({ ...p, rating: item.value }))}
                  className={`rounded-xl border px-2 py-2 text-center transition-all ${
                    item.value === reviewDraft.rating
                      ? "border-zoop-obsidian bg-zoop-obsidian text-white shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                  }`}
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} className="mx-auto" aria-hidden="true">
                    <path
                      d={STAR_PATH}
                      fill={item.value <= reviewDraft.rating ? "#facc15" : "#e5e7eb"}
                      stroke={item.value <= reviewDraft.rating ? "#f59e0b" : "#d1d5db"}
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="mt-1 block text-[11px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="text-sm mb-3 font-bold text-zoop-obsidian dark:text-white">{reviewDraft.rating} / 5</p>
            <input
              type="text"
              value={reviewDraft.title}
              onChange={(e) => setReviewDraft((p) => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 mb-3"
              placeholder="Review title (optional)"
              maxLength={100}
            />
            <textarea
              rows={4}
              value={reviewDraft.comment}
              onChange={(e) => setReviewDraft((p) => ({ ...p, comment: e.target.value }))}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3"
              placeholder="Share your experience"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReviewDraft({ orderId: "", productId: "", rating: 5, title: "", comment: "" })}
                className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button onClick={submitReview} className="flex-1 py-2.5 bg-zoop-obsidian text-white rounded-xl font-bold">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {returnDraft.orderId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReturnDraft({ orderId: "", productId: "", reason: "" })}
          />
          <div className="relative bg-white dark:glass-card rounded-2xl w-full max-w-md p-6 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10">
            <h3 className="text-lg font-black text-zoop-obsidian dark:text-white mb-1">Request Return</h3>
            <p className="text-sm text-gray-500 mb-4">Tell seller why you want to return this item.</p>
            <textarea
              rows={4}
              value={returnDraft.reason}
              onChange={(e) => setReturnDraft((p) => ({ ...p, reason: e.target.value }))}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3"
              placeholder="Reason for return"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReturnDraft({ orderId: "", productId: "", reason: "" })}
                className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitReturnRequest}
                className="flex-1 py-2.5 bg-zoop-obsidian text-white rounded-xl font-bold"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
