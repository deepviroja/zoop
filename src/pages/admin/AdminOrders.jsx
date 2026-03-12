import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/api";
import { formatInrWithSymbol } from "../../utils/currency";

const statusOptions = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const statusTone = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "processing":
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "shipped":
      return "bg-indigo-100 text-indigo-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingOrderId, setSavingOrderId] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.getAllOrders();
      const nextOrders = Array.isArray(response?.orders) ? response.orders : [];
      setOrders(nextOrders);
      setSelectedOrder((current) =>
        current ? nextOrders.find((order) => order.id === current.id) || null : null,
      );
    } catch (e) {
      setError(e?.message || "Failed to load order records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || String(order.status || "").toLowerCase() === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      const haystack = [
        order.id,
        order.displayOrderId,
        order.customer?.name,
        order.customer?.email,
        ...(order.items || []).map((item) => item.title || item.productId),
        ...(order.sellerSummaries || []).map(
          (seller) => seller.businessName || seller.displayName || seller.id,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(q);
    });
  }, [orders, searchQuery, statusFilter]);

  const orderStats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    }),
    [orders],
  );

  const handleStatusChange = async (orderId, nextStatus) => {
    setSavingOrderId(orderId);
    setError("");
    try {
      await adminApi.updateOrderStatus(orderId, nextStatus);
      await loadOrders();
    } catch (e) {
      setError(e?.message || "Could not update order status");
    } finally {
      setSavingOrderId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white">Orders</h1>
            <p className="mt-1 text-gray-500">
              Full order details across customers, sellers, discounts, and item lines.
            </p>
          </div>
          <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white dark:glass-card p-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total</p>
              <p className="mt-2 text-2xl font-black text-zoop-obsidian dark:text-white">{orderStats.total}</p>
            </div>
            <div className="rounded-2xl bg-white dark:glass-card p-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pending</p>
              <p className="mt-2 text-2xl font-black text-amber-600">{orderStats.pending}</p>
            </div>
            <div className="rounded-2xl bg-white dark:glass-card p-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Shipped</p>
              <p className="mt-2 text-2xl font-black text-indigo-600">{orderStats.shipped}</p>
            </div>
            <div className="rounded-2xl bg-white dark:glass-card p-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Delivered</p>
              <p className="mt-2 text-2xl font-black text-green-600">{orderStats.delivered}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:glass-card p-5 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 lg:max-w-md"
              placeholder="Search by order, customer, seller, or product"
            />
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                    statusFilter === status
                      ? "bg-zoop-obsidian text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:glass-card shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {loading ? (
              <p className="p-6 text-sm font-bold text-gray-500">Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="p-6 text-sm font-bold text-gray-500">No orders found.</p>
            ) : (
              <div className="overflow-x-auto scrollbar-gap">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                      {[
                        "Order",
                        "Customer",
                        "Seller",
                        "Items",
                        "Discount",
                        "Total",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-4">
                          <p className="font-black text-zoop-obsidian dark:text-white">
                            {order.displayOrderId || order.id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <p className="font-bold text-zoop-obsidian dark:text-white">
                            {order.customer?.name || "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.customer?.email || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {(order.sellerSummaries || []).length > 0 ? (
                            order.sellerSummaries.slice(0, 2).map((seller) => (
                              <p key={seller.id} className="font-bold text-zoop-obsidian dark:text-white">
                                {seller.businessName || seller.displayName || seller.id}
                              </p>
                            ))
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <p className="font-bold text-zoop-obsidian dark:text-white">
                            {order.itemCount || order.items?.length || 0} line items
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.primaryProduct?.title || "No primary item"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <p className="font-bold text-zoop-obsidian dark:text-white">
                            {formatInrWithSymbol(
                              order.appliedOffer?.discountAmount || 0,
                              { maximumFractionDigits: 0 },
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.appliedOffer?.code || "No offer"}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-black text-zoop-obsidian dark:text-white">
                          {formatInrWithSymbol(order.totalAmount || 0, {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusTone(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:glass-card p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {!selectedOrder ? (
              <p className="text-sm font-bold text-gray-500">
                Select an order to view full customer, item, and seller details.
              </p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Order Detail
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-zoop-obsidian dark:text-white">
                      {selectedOrder.displayOrderId || selectedOrder.id}
                    </h2>
                  </div>
                  <select
                    value={selectedOrder.status || "pending"}
                    onChange={(event) =>
                      void handleStatusChange(selectedOrder.id, event.target.value)
                    }
                    disabled={savingOrderId === selectedOrder.id}
                    className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-sm font-bold"
                  >
                    {statusOptions
                      .filter((status) => status !== "all")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Customer
                    </p>
                    <p className="mt-2 font-black text-zoop-obsidian dark:text-white">
                      {selectedOrder.customer?.name || "-"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedOrder.customer?.email || "-"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedOrder.customer?.phone || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Shipping
                    </p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {selectedOrder.shippingAddress?.street || "-"}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {[
                        selectedOrder.shippingAddress?.city,
                        selectedOrder.shippingAddress?.state,
                        selectedOrder.shippingAddress?.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedOrder.shippingAddress?.country || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-white/10">
                  <div className="border-b border-gray-100 dark:border-white/10 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Order Items
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="space-y-2 px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black text-zoop-obsidian dark:text-white">
                              {item.title || item.productId}
                            </p>
                            <p className="text-xs text-gray-500">
                              Seller:{" "}
                              {item.seller?.businessName ||
                                item.seller?.displayName ||
                                item.sellerId ||
                                "-"}
                            </p>
                          </div>
                          <p className="font-black text-zoop-obsidian dark:text-white">
                            {formatInrWithSymbol(
                              Number(item.price || 0) * Number(item.quantity || 0),
                              { maximumFractionDigits: 0 },
                            )}
                          </p>
                        </div>
                        <div className="grid gap-2 text-xs text-gray-600 dark:text-gray-400 md:grid-cols-4">
                          <p>Qty: {item.quantity || 0}</p>
                          <p>
                            Unit:{" "}
                            {formatInrWithSymbol(item.price || 0, {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <p>Discount: {item.discountPercent || 0}%</p>
                          <p>Status: {item.status || selectedOrder.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-zoop-obsidian p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-zoop-moss">
                        Total Charged
                      </p>
                      <p className="mt-2 text-3xl font-black">
                        {formatInrWithSymbol(selectedOrder.totalAmount || 0, {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <p>
                        Offer:{" "}
                        {selectedOrder.appliedOffer?.code ||
                          selectedOrder.appliedOffer?.title ||
                          "No offer"}
                      </p>
                      <p>
                        Discount:{" "}
                        {formatInrWithSymbol(
                          selectedOrder.appliedOffer?.discountAmount || 0,
                          { maximumFractionDigits: 0 },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
