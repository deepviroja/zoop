import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "../../assets/icons/TrendingUp";
import { Users } from "../../assets/icons/Users";
import { Package } from "../../assets/icons/Package";
import { Activity } from "../../assets/icons/Activity";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { adminApi } from "../../services/api";
import { formatInrWithSymbol } from "../../utils/currency";

const statusColor = (s) =>
  s === "delivered" || s === "completed"
    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
    : s === "processing"
      ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
      : s === "shipped"
        ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        : s === "cancelled"
          ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";

const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 dark:bg-white/10 animate-pulse rounded-xl ${className}`} />
);

const statValueClass =
  "break-words text-[clamp(1.9rem,2vw,2.45rem)] font-black leading-none tracking-tight tabular-nums";

const buildProductInsights = (products, orders) => {
  const metricsByProduct = {};
  (orders || []).forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!item?.productId) return;
      if (!metricsByProduct[item.productId]) {
        metricsByProduct[item.productId] = { quantitySold: 0, revenue: 0, orderCount: 0 };
      }
      metricsByProduct[item.productId].quantitySold += Number(item.quantity || 0);
      metricsByProduct[item.productId].revenue += Number(item.price || 0) * Number(item.quantity || 0);
      metricsByProduct[item.productId].orderCount += 1;
    });
  });

  const rankedProducts = (products || []).map((product) => {
    const metrics = metricsByProduct[product.id] || { quantitySold: 0, revenue: 0, orderCount: 0 };
    return {
      ...product,
      quantitySold: metrics.quantitySold,
      revenue: metrics.revenue,
      orderCount: metrics.orderCount,
      trendScore: metrics.quantitySold * 5 + Number(product.ratingCount || 0) * 3 + Number(product.rating || 0),
    };
  });

  // const nonZeroSales = rankedProducts.filter((p) => p.quantitySold > 0);

  return [
    { id: "trending", label: "Trending Now", type: "trend", items: [...rankedProducts].sort((a, b) => b.trendScore - a.trendScore).slice(0, 4) },
    { id: "top-selling", label: "Top Sellers", type: "sales", items: [...rankedProducts].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 4) },
    { id: "rising-stars", label: "Rising Stars", type: "stars", items: [...rankedProducts].filter(p => p.quantitySold > 0 && p.quantitySold < 10).sort((a,b) => b.trendScore - a.trendScore).slice(0, 4) },
    { id: "customer-favorites", label: "Customer Favs", type: "rating", items: [...rankedProducts].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 4) }
  ];
};

const AdminStats = () => {
  const [analytics, setAnalytics] = useState(null);
  const [productInsights, setProductInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, ordersResponse, productsResponse] = await Promise.all([
          adminApi.getAnalytics({ range: timeRange }),
          adminApi.getAllOrders({ limit: "500" }),
          adminApi.getProductsForCuration(),
        ]);
        setAnalytics(data);
        setProductInsights(buildProductInsights(productsResponse || [], ordersResponse?.orders || []));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  const salesData = (analytics?.salesSeries || []).map(item => ({ label: item.label || item.key, value: Number(item.value || 0) }));
  const maxSales = Math.max(...(salesData.map(d => d.value).length ? salesData.map(d => d.value) : [1]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] p-6 lg:p-10 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto space-y-10">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-zoop-obsidian dark:text-white tracking-tight">Main Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Monitoring live commerce activity</p>
          </div>
          <div className="flex gap-1 bg-white/50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/10 backdrop-blur-xl">
            {["week", "month", "year"].map((range) => (
              <button key={range} onClick={() => setTimeRange(range)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${timeRange === range ? "bg-zoop-obsidian text-white dark:bg-zoop-moss dark:text-zoop-obsidian shadow-lg" : "text-gray-500 hover:text-zoop-obsidian dark:hover:text-white"}`}>
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Revenue", value: loading ? null : formatInrWithSymbol(analytics?.totalRevenue || 0, { compact: true }), color: "from-emerald-500 to-emerald-600", icon: <Activity /> },
            { label: "Orders", value: loading ? null : (analytics?.totalOrders || 0).toLocaleString(), color: "from-blue-500 to-blue-600", icon: <ShoppingCart /> },
            { label: "Customers", value: loading ? null : (analytics?.totalUsers || 0).toLocaleString(), color: "from-indigo-500 to-indigo-600", icon: <Users /> },
            { label: "Catalog", value: loading ? null : analytics?.totalProducts || 0, color: "from-amber-500 to-amber-600", icon: <Package /> }
          ].map((card, i) => (
            <div key={i} className={`relative group bg-gradient-to-br ${card.color} rounded-[2rem] p-7 text-white shadow-2xl overflow-hidden`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl">{card.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Active</div>
              </div>
              <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">{card.label}</p>
              {loading ? <Skeleton className="h-10 w-32 bg-white/20" /> : <h3 className={statValueClass}>{card.value}</h3>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden relative group/chart">
            <div className="absolute top-0 right-0 w-96 h-96 bg-zoop-moss/5 rounded-full blur-[100px] pointer-events-none group-hover/chart:bg-zoop-moss/10 transition-colors duration-1000" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 relative z-10 gap-4">
              <div>
                <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white tracking-tight">Sales Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">Daily revenue distribution across the platform</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zoop-moss/10 border border-zoop-moss/20">
                  <div className="w-2 h-2 rounded-full bg-zoop-moss animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-zoop-moss">Live Tracking</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-80 flex items-end justify-between gap-4 md:gap-6 px-2 custom-scrollbar overflow-x-auto pb-4 pt-10">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-14 pt-10">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full h-px bg-gray-100 dark:bg-white/5 relative">
                    {i === 0 && <span className="absolute -top-3 left-0 text-[8px] font-black text-gray-400 uppercase tracking-widest">Growth Zone</span>}
                    <span className="absolute -top-2 left-0 text-[9px] font-black text-gray-400 tabular-nums">
                      {formatInrWithSymbol(Math.round((maxSales * (4 - i)) / 4), { compact: true, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>

              {salesData.map((data, i) => (
                <div key={i} className="flex-1 min-w-[56px] sm:min-w-[64px] flex flex-col items-center gap-4 group relative z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:-translate-y-4 pointer-events-none">
                    <div className="bg-zoop-obsidian text-white text-[10px] font-black px-3 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col items-center gap-0.5">
                      <span className="text-zoop-moss">{formatInrWithSymbol(data.value)}</span>
                      <span className="text-[8px] opacity-60 uppercase">{data.label}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full relative flex items-end justify-center h-56">
                    <div className="w-full max-w-[24px] bg-gradient-to-t from-zoop-moss/20 via-zoop-moss/60 to-zoop-moss rounded-full group-hover:scale-x-110 group-hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] transition-all duration-700 ease-out relative group/bar"
                      style={{ height: `${Math.max(8, (data.value / (maxSales || 1)) * 100)}%` }}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 blur-sm rounded-t-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Label */}
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-zoop-obsidian dark:group-hover:text-white transition-colors whitespace-nowrap">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/10 shadow-xl">
            <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-8">Recent Activity</h2>
            <div className="space-y-6">
              {(analytics?.recentOrders || []).slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zoop-obsidian dark:text-white truncate">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      {order.items} items · {formatInrWithSymbol(order.totalAmount, { compact: true })}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${statusColor(order.status)} hover:scale-105 transition-transform`}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Signals Redesign */}
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            <h2 className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Inventory & Market IQ</h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {productInsights.map((group) => (
              <div key={group.id} className="bg-white dark:bg-white/5 rounded-[2.5rem] p-6 xl:p-5 border border-gray-100 dark:border-white/10 shadow-2xl group/card relative overflow-hidden transition-all hover:bg-white/60 dark:hover:bg-white/10">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-zoop-moss/5 rounded-full blur-[60px] group-hover/card:bg-zoop-moss/20 transition-all duration-700" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-zoop-moss/10 rounded-2xl">
                        <TrendingUp width={18} height={18} className="text-zoop-moss" />
                      </div>
                      <h3 className="text-xl font-black text-zoop-obsidian dark:text-white uppercase tracking-tight">{group.label}</h3>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {group.items.length === 0 ? (
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center py-10 opacity-50">Discovery phase...</p>
                    ) : (
                      group.items.map((item, idx) => (
                        <div key={item.id} className="group/item flex items-center gap-4 cursor-pointer">
                          <div className="relative shrink-0">
                            <img src={item.thumbnailUrl || item.image} alt="" className="w-14 h-14 rounded-[1.25rem] object-cover shadow-xl group-hover/item:scale-105 group-hover/item:-rotate-2 transition-all duration-500" />
                            <div className="absolute -top-2 -left-2 w-7 h-7 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian text-[10px] font-black flex items-center justify-center rounded-xl border-2 border-white dark:border-zoop-obsidian shadow-lg">
                              #{idx + 1}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-zoop-obsidian dark:text-white truncate group-hover/item:text-zoop-moss transition-colors uppercase tracking-tight">
                              {item.name || item.title}
                            </p>
                            <div className="flex items-center justify-between gap-3 mt-1.5">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">
                                {item.category || "General"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-zoop-obsidian dark:text-white bg-gray-50 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-white/10 whitespace-nowrap">
                                  {group.type === "trend"
                                    ? `Trend: ${idx * 4 + 70}%`
                                    : group.type === "sales"
                                      ? `Sold: ${Number(item.quantitySold || 0)}`
                                      : group.type === "rating"
                                        ? `Ratings: ${Number(item.ratingCount || 0)}`
                                        : `Sold: ${Number(item.quantitySold || 0)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-dashed border-gray-100 dark:border-white/10">
                    <button className="w-full py-3 rounded-2xl bg-gray-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-zoop-moss hover:bg-zoop-moss/10 transition-all">
                      View full report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
