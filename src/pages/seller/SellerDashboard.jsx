import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sellerApi, productsApi } from "../../services/api";
import { useUser } from "../../context/UserContext";
import { formatInrWithSymbol } from "../../utils/currency";
import { Wallet } from "../../assets/icons/Wallet";

const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 dark:bg-white/10 animate-pulse rounded-xl ${className}`} />
);

const statValueClass =
  "break-words text-[clamp(1.8rem,2vw,2.35rem)] font-black leading-none tracking-tight tabular-nums";

const statusColor = (s) =>
  s === "delivered"
    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
    : s === "shipped"
      ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : s === "processing"
        ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        : s === "cancelled"
          ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";

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
  const [activeBarIndex, setActiveBarIndex] = useState(-1);

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

  const buildSalesSeries = useCallback((safeOrders, range) => {
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
      const key = range === "year" ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}` : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;
      if (key in seriesMap) seriesMap[key] += Number(ord.totalAmount || 0);
    });
    return buckets.map((b) => ({ label: b.label, value: Number(seriesMap[b.key] || 0) }));
  }, []);

  const loadOrders = useCallback(async () => {
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
  }, [buildSalesSeries, timeRange]);

  useEffect(() => {
    if (user?.uid && orders.length === 0) void loadOrders();
  }, [user, loadOrders, orders.length]);

  useEffect(() => {
    if (orders.length > 0) setSalesSeries(buildSalesSeries(orders, timeRange));
  }, [timeRange, orders, buildSalesSeries]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "products" && products.length === 0) {
      setTabLoading(true);
      productsApi.getAll({ sellerId: user?.uid || "" }).then(p => { setProducts(p || []); setTabLoading(false); });
    }
    if (tab === "orders" && orders.length === 0) loadOrders();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-16 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
          </div>
          <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const salesData = (salesSeries || []).map(p => ({ label: p.label, value: p.value }));
  const maxSales = Math.max(...(salesData.map(d => d.value).length ? salesData.map(d => d.value) : [1]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] pb-20 transition-colors duration-500">
      {/* Premium Hero Header */}
      <div className="bg-gradient-to-br from-zoop-obsidian via-slate-900 to-black text-white p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zoop-moss/10 rounded-full blur-[120px] -mr-40 -mt-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zoop-moss animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zoop-moss">Verified Seller</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
                {profile.displayName || profile.businessName || "Welcome Back"}
              </h1>
              <p className="text-white/40 font-medium">Managing store: <span className="text-white/60">{profile.businessName || "General Store"}</span></p>
            </div>
            <div className="flex gap-4">
              <Link to="/seller/add-product" className="bg-zoop-moss text-zoop-obsidian px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all">Create Listing</Link>
              <Link to="/seller/products" className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-2xl font-black hover:bg-white/10 transition-all">Manage Catalog</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-12 relative z-20">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Revenue", value: formatInrWithSymbol(stats.totalRevenue || 0, { compact: true }), sub: "Lifetime Earnings", color: "from-emerald-400 to-emerald-600" },
            { label: "Volume", value: stats.totalOrders || 0, sub: "Total Sales", color: "from-blue-400 to-blue-600" },
            { label: "Inventory", value: stats.totalProducts || 0, sub: "Active Listings", color: "from-amber-400 to-amber-600" },
            { label: "Awaiting", value: stats.pendingOrders || 0, sub: "Action Required", color: "from-orange-400 to-orange-600" }
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white dark:border-white/10 shadow-2xl group transition-all hover:-translate-y-2">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-zoop-moss transition-colors">{s.label}</p>
              <h3 className={`${statValueClass} text-zoop-obsidian dark:text-white`}>{s.value}</h3>
              <div className="flex items-center gap-2 mt-4">
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${s.color}`} />
                <p className="text-[10px] font-bold text-gray-500">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-white dark:border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zoop-moss/0 via-zoop-moss/50 to-zoop-moss/0" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div>
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white tracking-tight">Sales Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Growth tracking for this {timeRange}</p>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-black/20 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
              {["week", "month", "year"].map((range) => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 dark:hover:bg-gray-50/10 ${timeRange === range ? "bg-zoop-obsidian text-white dark:bg-zoop-moss dark:text-zoop-obsidian shadow-xl" : "text-gray-400 hover:text-zoop-obsidian dark:hover:text-white"}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative h-80 flex items-end justify-between gap-4 md:gap-6 px-2 custom-scrollbar overflow-x-auto pb-4 pt-10">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-14 pt-10">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-px bg-gray-100 dark:bg-white/5 relative">
                  <span className="absolute -top-2 left-0 text-[9px] font-black text-gray-400 tabular-nums">
                    {formatInrWithSymbol(Math.round((maxSales * (4 - i)) / 4), { compact: true, maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>

            {salesData.map((point, i) => {
              const isActive = activeBarIndex === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setActiveBarIndex((prev) => (prev === i ? -1 : i))
                  }
                  onFocus={() => setActiveBarIndex(i)}
                  onBlur={() => setActiveBarIndex(-1)}
                  className="flex-1 min-w-[56px] sm:min-w-[64px] flex flex-col items-center gap-4 px-4 group relative z-10 outline-none"
                  aria-label={`Sales ${point.label}: ${formatInrWithSymbol(point.value)}`}
                >
                  {/* Tooltip */}
                  <div
                    className={`absolute -top-6 transition-all duration-300 transform pointer-events-none ${
                      isActive
                        ? "opacity-100 -translate-y-4"
                        : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:-translate-y-4"
                    }`}
                  >
                    <div className="bg-zoop-obsidian text-white text-[10px] font-black px-6 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col items-center gap-0.5">
                      <span className="text-zoop-moss">
                        {formatInrWithSymbol(point.value)}
                      </span>
                      <span className="text-[8px] opacity-60 uppercase">
                        {point.label}
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full relative flex items-end justify-center h-56">
                    <div
                      className={`w-full max-w-[24px] px-1 bg-gradient-to-t from-zoop-moss/20 via-zoop-moss/60 to-zoop-moss rounded-full group-hover:scale-x-110 group-hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] transition-all duration-700 ease-out relative group/bar ${
                        isActive
                          ? "ring-2 ring-zoop-moss/60 shadow-[0_0_30px_rgba(163,230,53,0.35)]"
                          : ""
                      }`}
                      style={{
                        height: `${Math.max(
                          8,
                          (point.value / (maxSales || 1)) * 100,
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 blur-sm rounded-t-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-zoop-obsidian dark:text-white"
                        : "text-gray-400 group-hover:text-zoop-obsidian dark:group-hover:text-white"
                    }`}
                  >
                    {point.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="space-y-8">
          <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-white/50 dark:bg-white/10 p-1.5 rounded-[1.5rem] border border-white dark:border-white/10 backdrop-blur-xl w-full sm:w-fit overflow-x-auto custom-scrollbar">
            {["overview", "products", "orders"].map((tab) => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all hover:bg-gray-50 dark:hover:bg-gray-50/10 ${activeTab === tab ? "bg-white dark:bg-zoop-moss text-zoop-obsidian shadow-xl" : "text-gray-400 hover:text-zoop-obsidian dark:hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-white dark:border-white/10 shadow-xl group">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-zoop-obsidian dark:text-white">Recent Inventory</h3>
                  <button onClick={() => handleTabChange("products")} className="text-xs font-black text-zoop-moss uppercase tracking-widest hover:underline">Full View</button>
                </div>
                <div className="space-y-4">
                  {(data?.products || []).slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-all group/item border border-transparent hover:border-zoop-moss/20">
                      <img src={p.thumbnailUrl} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate group-hover/item:text-zoop-moss transition-colors">{p.name || p.title}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider whitespace-nowrap">{p.category} · {formatInrWithSymbol(p.price)}</p>
                      </div>
                      <Link to="/seller/products" className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity">Edit</Link>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-white dark:border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-zoop-obsidian dark:text-white">Live Transactions</h3>
                  <button onClick={() => handleTabChange("orders")} className="text-xs font-black text-zoop-moss uppercase tracking-widest hover:underline">Ledger</button>
                </div>
                <div className="space-y-4">
                  {(data?.recentOrders || []).slice(0, 4).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-all border border-transparent hover:border-zoop-moss/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-zoop-obsidian dark:text-white">
                          <Wallet width={18} height={18} className="stroke-current" />
                        </div>
                        <div>
                          <p className="font-black text-[10px] font-mono tracking-tight uppercase">ORD-{o.id.slice(-6)}</p>
                          <p className="text-[10px] font-bold text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm">{formatInrWithSymbol(o.totalAmount)}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest p-1 rounded-md ${statusColor(o.status)}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-white dark:border-white/10 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-zoop-obsidian dark:text-white">Products</h3>
                <Link to="/seller/products" className="text-xs font-black text-zoop-moss uppercase tracking-widest hover:underline">
                  Manage
                </Link>
              </div>
              {tabLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-[2rem]" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-500">No products found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.slice(0, 12).map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 min-w-0">
                      <img src={p.thumbnailUrl || p.image} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-zoop-obsidian dark:text-white truncate">{p.name || p.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
                          {p.category || "General"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-zoop-moss whitespace-nowrap">
                        {formatInrWithSymbol(Number(p.price || 0), { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-white dark:border-white/10 shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-zoop-obsidian dark:text-white">Orders</h3>
                <Link to="/seller/orders" className="text-xs font-black text-zoop-moss uppercase tracking-widest hover:underline">
                  Ledger
                </Link>
              </div>
              {tabLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-[2rem]" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-gray-500">No orders found.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 12).map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 min-w-0">
                      <div className="min-w-0">
                        <p className="font-black text-[14px] font-mono tracking-tight uppercase text-zoop-obsidian dark:text-white truncate">
                          ORD-{String(o.id || "").slice(-6)}
                        </p>
                        <p className="text-[12px] font-bold text-gray-500">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm whitespace-nowrap">
                          {formatInrWithSymbol(Number(o.totalAmount || 0), { maximumFractionDigits: 0 })}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-xl ${statusColor(o.status)}`}>
                          {o.status || "unknown"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Other tabs follow same premium pattern... */}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
