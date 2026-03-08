import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sellerApi, productsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";

const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

const statusColor = (s) =>
  s === "delivered"
    ? "bg-green-100 text-green-700"
    : s === "shipped"
      ? "bg-blue-100 text-blue-700"
      : s === "processing"
        ? "bg-indigo-100 text-indigo-700"
        : s === "cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

const SellerDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesSeries, setSalesSeries] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const d = await sellerApi.getDashboard();
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  useEffect(() => {
    if (user?.uid && orders.length === 0) {
      void loadOrders();
    }
  }, [user]);

  const loadProducts = async () => {
    setTabLoading(true);
    try {
      const p = await productsApi.getAll({ sellerId: user?.uid || "" });
      setProducts(Array.isArray(p) ? p : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setTabLoading(false);
    }
  };

  const buildSalesSeries = (safeOrders, range) => {
    const now = new Date();
    const buckets = [];
    const seriesMap = {};
    if (range === "year") {
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets.push({ key, label: d.toLocaleString("en-US", { month: "short" }) });
        seriesMap[key] = 0;
      }
    } else if (range === "month") {
      for (let i = 29; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        buckets.push({ key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
        seriesMap[key] = 0;
      }
    } else {
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        buckets.push({ key, label: d.toLocaleDateString("en-US", { weekday: "short" }) });
        seriesMap[key] = 0;
      }
    }
    safeOrders.forEach((ord) => {
      const createdAt = ord.createdAt ? new Date(ord.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const key =
        range === "year"
          ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`
          : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;
      if (!(key in seriesMap)) return;
      seriesMap[key] += Number(ord.totalAmount || 0);
    });
    return buckets.map((b) => ({ label: b.label, value: Number(seriesMap[b.key] || 0) }));
  };

  const loadOrders = async () => {
    setTabLoading(true);
    try {
      const o = await sellerApi.getOrders();
      const safeOrders = Array.isArray(o) ? o : [];
      setOrders(safeOrders);
      setSalesSeries(buildSalesSeries(safeOrders, timeRange));
    } catch (e) {
      setError(e.message);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (orders.length > 0) {
      setSalesSeries(buildSalesSeries(orders, timeRange));
    }
  }, [timeRange]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "products" && products.length === 0) loadProducts();
    if (tab === "orders" && orders.length === 0) loadOrders();
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl text-center max-w-md shadow">
          <p className="text-red-500 font-black text-lg mb-4">
            Error loading dashboard
          </p>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zoop-moss text-zoop-obsidian rounded-xl font-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const salesData = (salesSeries || []).map((item) => ({
    label: item.label,
    value: Number(item.value || 0),
  }));
  const maxSales = Math.max(
    ...(salesData.map((item) => item.value).length
      ? salesData.map((item) => item.value)
      : [1]),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-zoop-obsidian to-slate-800 text-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
              Seller Portal
            </p>
            <h1 className="text-3xl md:text-4xl font-black mt-1">
              Welcome,{" "}
              {profile.displayName ||
                profile.businessName ||
                user?.displayName ||
                "Seller"}
            </h1>
            {profile.businessName && (
              <p className="text-zoop-moss mt-1 font-bold">
                {profile.businessName}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to="/seller/add-product"
              className="bg-zoop-moss text-zoop-obsidian px-5 py-3 rounded-xl font-black text-sm hover:scale-105 transition-all"
            >
              + Add Product
            </Link>
            <Link
              to="/seller/products"
              className="bg-white/10 border border-white/20 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
            >
              My Products
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Products",
              value: stats.totalProducts || 0,
              sub: "↑ Listed",
              color: "text-zoop-moss",
            },
            {
              label: "Total Orders",
              value: stats.totalOrders || 0,
              sub: "↑ Lifetime",
              color: "text-blue-500",
            },
            {
              label: "Revenue",
              value: `₹${((stats.totalRevenue || 0) / 1000).toFixed(1)}k`,
              sub: "↑ All time",
              color: "text-green-500",
            },
            {
              label: "Pending",
              value: stats.pendingOrders || 0,
              sub: "↑ Need action",
              color: "text-orange-500",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <p className="text-gray-500 text-sm font-medium">{s.label}</p>
              <h3 className={`text-3xl font-black text-zoop-obsidian mt-1`}>
                {s.value}
              </h3>
              <p className={`text-xs font-bold mt-2 ${s.color}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {["overview", "products", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-3 font-black text-sm uppercase tracking-wide transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-zoop-moss text-zoop-obsidian bg-zoop-moss/5"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-zoop-obsidian">
                  Recent Products
                </h3>
                <button
                  onClick={() => handleTabChange("products")}
                  className="text-xs text-zoop-moss font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              {(data?.products || []).length > 0 ? (
                <div className="space-y-3">
                  {(data?.products || []).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        {p.thumbnailUrl && (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.name || p.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {p.name || p.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{p.price} · {p.category || "Uncategorized"}
                        </p>
                      </div>
                      <Link
                        to={`/seller/products`}
                        className="text-xs font-bold text-blue-500 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No products yet</p>
                  <Link
                    to="/seller/add-product"
                    className="text-sm font-bold text-zoop-moss hover:underline"
                  >
                    Add your first product →
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-zoop-obsidian">Recent Orders</h3>
                <button
                  onClick={() => handleTabChange("orders")}
                  className="text-xs text-zoop-moss font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              {(data?.recentOrders || []).length > 0 ? (
                <div className="space-y-3">
                  {(data?.recentOrders || []).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-xs font-mono truncate max-w-[120px]">
                          {o.id}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">
                          ₹{(o.totalAmount || 0).toLocaleString()}
                        </p>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusColor(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No orders yet.</p>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-zoop-obsidian">
                    Sales Overview
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This {timeRange}
                  </p>
                </div>
                <div className="flex gap-2">
                  {["week", "month", "year"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase ${
                        timeRange === range ? "bg-zoop-moss text-zoop-obsidian" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[640px] items-end justify-between gap-3 h-72">
                  {(salesData.length > 0
                    ? salesData
                    : [{ label: "-", value: 0 }]).map((point) => (
                    <div
                      key={point.label}
                      className="flex min-w-[56px] flex-1 flex-col items-center gap-3"
                    >
                      <p className="text-[11px] font-black text-zoop-obsidian whitespace-nowrap">
                        ₹{Math.round(point.value).toLocaleString("en-IN")}
                      </p>
                      <div
                        className="w-full relative flex items-end justify-center"
                        style={{ height: "208px" }}
                      >
                        <div
                          className="w-full min-h-[12px] bg-gradient-to-t from-zoop-moss to-green-400 rounded-t-lg transition-all"
                          style={{
                            height: `${Math.max(8, (point.value / maxSales) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 text-center leading-tight whitespace-nowrap">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-50">
              <h3 className="font-black text-zoop-obsidian">All Products</h3>
              <Link
                to="/seller/add-product"
                className="bg-zoop-moss text-zoop-obsidian px-4 py-2 rounded-xl font-black text-sm hover:scale-105 transition-all"
              >
                + Add Product
              </Link>
            </div>
            {tabLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                      {p.thumbnailUrl && (
                        <img
                          src={p.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {p.name || p.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.category || "Uncategorized"} · Stock:{" "}
                        {p.stock || p.inventory || "N/A"}
                      </p>
                    </div>
                    <p className="font-black text-lg text-zoop-obsidian whitespace-nowrap">
                      ₹{p.price}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/seller/products`}
                        className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-black hover:bg-blue-50 transition-all"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-black hover:bg-red-50 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-400 font-medium mb-4">
                  You haven't added any products yet.
                </p>
                <Link
                  to="/seller/add-product"
                  className="bg-zoop-moss text-zoop-obsidian px-6 py-3 rounded-xl font-black text-sm"
                >
                  Add Product
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-50">
              <h3 className="font-black text-zoop-obsidian">All Orders</h3>
              <p className="text-sm text-gray-500">{orders.length} total</p>
            </div>
            {tabLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                  >
                    <div>
                      <p className="font-black text-sm font-mono">{o.id}</p>
                      <p className="text-xs text-gray-500">
                        {o.items?.length || 0} item(s) ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-zoop-obsidian">
                        ₹{(o.totalAmount || 0).toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusColor(o.status)}`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-20 text-center text-gray-400">No orders yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;

