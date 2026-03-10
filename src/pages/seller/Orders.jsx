import React, { useState, useEffect } from "react";
import { sellerApi } from "../../services/api";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const Orders = () => {
  const [filter, setFilter] = useState("active");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sellerApi.getOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes((o.status || "").toLowerCase()),
  );
  const completedOrders = orders.filter(
    (o) => (o.status || "").toLowerCase() === "delivered",
  );
  const returnOrders = orders.filter(
    (o) => (o.status || "").toLowerCase() === "cancelled",
  );

  const displayed =
    filter === "active"
      ? activeOrders
      : filter === "completed"
        ? completedOrders
        : returnOrders;

  return (
    <div className="space-y-10 px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian uppercase">
            Orders
          </h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
            Track and manage your customer orders
          </p>
        </div>

        <div className="flex bg-zoop-canvas p-1 rounded-2xl border border-gray-100">
          {[
            { key: "active", label: `Active (${activeOrders.length})` },
            {
              key: "completed",
              label: `Delivered (${completedOrders.length})`,
            },
            { key: "returns", label: `Cancelled (${returnOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === tab.key
                  ? "bg-white shadow-sm text-zoop-obsidian"
                  : "text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-8 px-6 bg-red-50 border border-red-100 rounded-2xl text-center">
          <p className="text-red-600 font-bold">{error}</p>
        </div>
      )}

      {/* --- ORDER LIST --- */}
      {!loading && !error && (
        <div className="space-y-6">
          {displayed.length > 0 ? (
            displayed.map((order) => {
              const statusLower = (order.status || "pending").toLowerCase();
              const badgeClass =
                statusColors[statusLower] || "bg-gray-100 text-gray-600";

              return (
                <div
                  key={order.id || order._id}
                  className="group p-8 rounded-[2rem] border-2 bg-white border-gray-100 shadow-sm hover:border-zoop-moss/30 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Left: Order Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-900 text-xl text-zoop-obsidian tracking-tighter italic">
                          Order #{order.id || order._id}
                        </h3>
                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${badgeClass}`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {(order.items || []).map((item, i) => (
                          <p
                            key={i}
                            className="text-sm font-bold text-zoop-obsidian"
                          >
                            {item.name || item.productName} × {item.quantity}
                          </p>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <p className="text-sm text-gray-400 italic">
                            No item details
                          </p>
                        )}
                      </div>

                      {order.customer && (
                        <p className="text-xs font-medium text-gray-400">
                          Customer:{" "}
                          <span className="text-zoop-obsidian font-bold">
                            {order.customer?.name || order.customerName || "—"}
                          </span>
                          {order.createdAt && (
                            <>
                              {" "}
                              •{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-IN",
                              )}
                            </>
                          )}
                        </p>
                      )}

                      {/* Delivery address */}
                      {order.deliveryAddress && (
                        <p className="text-xs text-gray-400">
                          📍{" "}
                          {[
                            order.deliveryAddress.line1,
                            order.deliveryAddress.city,
                            order.deliveryAddress.state,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Right: Amount */}
                    <div className="flex flex-col justify-between items-end gap-4 min-w-[160px]">
                      <div className="text-right">
                        <p className="text-2xl font-900 text-zoop-obsidian">
                          Rs. {(order.totalAmount || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                          Order Total
                        </p>
                      </div>

                      {order.deliveryType && (
                        <span className="text-[10px] font-black text-zoop-copper bg-zoop-clay/10 px-3 py-1 rounded-full uppercase tracking-widest">
                          {order.deliveryType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center bg-zoop-canvas rounded-[3rem] border-2 border-dashed border-gray-200">
              <span className="text-5xl">📦</span>
              <h3 className="mt-4 font-black text-zoop-obsidian uppercase tracking-widest">
                No {filter} orders
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {filter === "active"
                  ? "No orders to fulfill right now."
                  : `No ${filter} orders yet.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
