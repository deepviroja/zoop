import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { sellerApi } from "../../services/api";
import { Clock } from "../../assets/icons/Clock";
import { CheckCircle } from "../../assets/icons/CheckCircle";
import { Activity } from "../../assets/icons/Activity";
import { Truck } from "../../assets/icons/Truck";
import { Package } from "../../assets/icons/Package";
import { X } from "../../assets/icons/X";
import { ClipboardList } from "../../assets/icons/ClipboardList";
import { ChevronDown } from "../../assets/icons/ChevronDown";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Activity,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Package,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: X,
  },
};

const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const SellerOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return;
      try {
        const data = await sellerApi.getOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load seller orders:", error);
        // If orders API not available, show demo data
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await sellerApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      showToast(`Order status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Failed to update order status:", err);
      showToast("Failed to update order status. Please try again.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReturnStatus = async (orderId, productId, status) => {
    try {
      await sellerApi.updateReturnStatus(orderId, productId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id !== orderId
            ? o
            : {
                ...o,
                items: (o.items || []).map((it) =>
                  it.productId === productId
                    ? {
                        ...it,
                        returnRequest: {
                          ...(it.returnRequest || {}),
                          status,
                          updatedAt: new Date().toISOString(),
                        },
                      }
                    : it,
                ),
              },
        ),
      );
      showToast(`Return ${status}`, "success");
    } catch (err) {
      showToast(err?.message || "Could not update return status", "error");
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) =>
      ["confirmed", "processing"].includes(o.status),
    ).length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-bold">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] text-white font-bold text-sm flex items-center gap-3 transition-all ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.type === "error" ? (
            <X width={18} height={18} />
          ) : (
            <CheckCircle width={18} height={18} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white tracking-tighter">
            Order Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and update your customer orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300",
              icon: ClipboardList,
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "bg-yellow-50 text-yellow-700",
              icon: Clock,
            },
            {
              label: "Processing",
              value: stats.processing,
              color: "bg-blue-50 text-blue-700",
              icon: Activity,
            },
            {
              label: "Shipped",
              value: stats.shipped,
              color: "bg-purple-50 text-purple-700",
              icon: Truck,
            },
            {
              label: "Delivered",
              value: stats.delivered,
              color: "bg-green-50 text-green-700",
              icon: CheckCircle,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 ${stat.color} border border-white/50`}
            >
              <stat.icon width={24} height={24} className="mb-2" />
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            "all",
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                filterStatus === s
                  ? "bg-zoop-obsidian text-white shadow"
                  : "bg-white dark:glass-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-zoop-moss"
              }`}
            >
              {s === "all" ? "All Orders" : s}
              {s !== "all" &&
                orders.filter((o) => o.status === s).length > 0 && (
                  <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                    {orders.filter((o) => o.status === s).length}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:glass-card rounded-3xl p-16 text-center shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
              <Package width={34} height={34} className="text-gray-500" />
            </div>
            <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-2">
              {filterStatus === "all"
                ? "No Orders Yet"
                : `No ${filterStatus} orders`}
            </h2>
            <p className="text-gray-400">
              {filterStatus === "all"
                ? "Orders from your customers will appear here."
                : "Try selecting a different filter above."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const nextStatus = NEXT_STATUS[order.status];
              const isExpanded = expandedOrder === order.id;
              const isUpdating = updatingId === order.id;
              const NextStatusIcon =
                nextStatus && statusConfig[nextStatus]
                  ? statusConfig[nextStatus].icon
                  : null;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  {/* Order Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-50/10 transition-colors"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zoop-ossidian/5 rounded-xl flex items-center justify-center text-lg">
                          <cfg.icon width={18} height={18} />
                        </div>
                        <div>
                          <p className="font-black text-zoop-obsidian dark:text-white text-sm">
                            {order.displayOrderId || `#${order.id?.slice(-8).toUpperCase() || "N/A"}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.customer?.name || order.customer?.email || "Customer"}
                            {order.customer?.phone ? ` • ${order.customer.phone}` : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Date not available"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase border ${cfg.color}`}
                        >
                          <cfg.icon width={14} height={14} stroke="currentColor" /> {cfg.label}
                        </span>
                        <p className="font-black text-xl text-zoop-obsidian dark:text-white">
                          Rs. {(order.totalAmount || 0).toLocaleString()}
                        </p>
                        <span
                          className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        >
                          <ChevronDown width={18} height={18} stroke="currentColor" />
                        </span>
                      </div>
                    </div>

                    {/* Quick item preview */}
                    {order.items && order.items.length > 0 && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-2 ml-13">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}: &nbsp;
                        {order.items
                          .slice(0, 2)
                          .map((i) => i.title || "Product")
                          .join(", ")}
                        {order.items.length > 2 &&
                          ` +${order.items.length - 2} more`}
                      </p>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-50">
                      {/* Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Order Items
                          </p>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl overflow-hidden shrink-0 mt-1">
                                {item.thumbnailUrl ? (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">
                                    <Package width={20} height={20} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-zoop-obsidian dark:text-white truncate">
                                  {item.title || "Product"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(item.product?.sku || item.productId)
                                    ? `ID: ${item.product?.sku || item.productId} • `
                                    : ""}
                                  Qty: {item.quantity} × Rs. {item.price}
                                </p>
                                {(item.seller?.displayName || item.seller?.businessName) && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Seller: {item.seller?.businessName || item.seller?.displayName}
                                  </p>
                                )}
                                {item.returnEligibleUntil && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Return window: {new Date(item.returnEligibleUntil).toLocaleDateString()}
                                  </p>
                                )}
                                {item.returnRequest?.status && (
                                  <div className="mt-2">
                                    <span
                                      className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                        item.returnRequest.status === "requested"
                                          ? "bg-amber-100 text-amber-700"
                                          : item.returnRequest.status === "approved"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      Return {item.returnRequest.status}
                                    </span>
                                    {item.returnRequest.reason && (
                                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                                        Reason: {item.returnRequest.reason}
                                      </p>
                                    )}
                                    {item.returnRequest.status === "requested" && (
                                      <div className="mt-2 flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleReturnStatus(order.id, item.productId, "approved")
                                          }
                                          className="px-3 py-1 text-[10px] font-black uppercase rounded-lg bg-green-600 text-white"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleReturnStatus(order.id, item.productId, "rejected")
                                          }
                                          className="px-3 py-1 text-[10px] font-black uppercase rounded-lg bg-red-600 text-white"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className="font-black text-zoop-obsidian dark:text-white">
                                Rs. {(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Shipping Info */}
                      {order.shippingAddress && (
                        <div className="mt-4 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                            Ship To
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {order.shippingAddress.street},{" "}
                            {order.shippingAddress.city},{" "}
                            {order.shippingAddress.state} —{" "}
                            {order.shippingAddress.zipCode}
                          </p>
                          {order.shippingAddress.phone && (
                            <p className="text-xs text-gray-500 mt-1">
                              Phone: {order.shippingAddress.phone}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Status Progress */}
                      <div className="mt-4">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                          Order Progress
                        </p>
                        <div className="flex items-center gap-1">
                          {STATUS_FLOW.map((s, idx) => {
                            const currentIdx = STATUS_FLOW.indexOf(
                              order.status,
                            );
                            const isDone = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div
                                  className={`flex-1 h-2 rounded-full transition-all ${
                                    isDone ? "bg-zoop-moss" : "bg-gray-200 dark:bg-white/20"
                                  } ${isCurrent ? "ring-2 ring-zoop-moss ring-offset-1" : ""}`}
                                  title={s}
                                />
                                {idx < STATUS_FLOW.length - 1 && (
                                  <div
                                    className={`w-2 h-2 rounded-full mx-0.5 ${
                                      idx < currentIdx
                                        ? "bg-zoop-moss"
                                        : "bg-gray-200 dark:bg-white/20"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                          {STATUS_FLOW.map((s) => (
                            <span
                              key={s}
                              className={`capitalize font-bold ${
                                s === order.status ? "text-zoop-obsidian dark:text-white" : ""
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex gap-3 flex-wrap">
                        {nextStatus && order.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, nextStatus)
                            }
                            disabled={isUpdating}
                            className="flex-1 py-3 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zoop-moss hover:text-zoop-obsidian transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isUpdating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                {NextStatusIcon ? (
                                  <NextStatusIcon width={14} height={14} />
                                ) : null}{" "}
                                Mark as{" "}
                                {nextStatus}
                              </>
                            )}
                          </button>
                        )}

                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "cancelled")
                            }
                            disabled={isUpdating}
                            className="px-4 py-3 border-2 border-red-200 text-red-500 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}

                        {order.status === "delivered" && (
                          <div className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl font-black text-xs uppercase tracking-wider text-center border border-green-200">
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle width={14} height={14} />
                              Order Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
