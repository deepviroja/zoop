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
    ? "bg-green-100 text-green-700"
    : s === "processing"
      ? "bg-blue-100 text-blue-700"
      : s === "shipped"
        ? "bg-indigo-100 text-indigo-700"
        : s === "cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 dark:bg-white/20 animate-pulse rounded-xl ${className}`} />
);
const statValueClass =
  "break-words text-[clamp(1.9rem,2vw,2.45rem)] font-black leading-none tracking-tight tabular-nums";

const buildProductInsights = (products, orders) => {
  const metricsByProduct = {};

  (orders || []).forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!item?.productId) return;
      if (!metricsByProduct[item.productId]) {
        metricsByProduct[item.productId] = {
          quantitySold: 0,
          revenue: 0,
          orderCount: 0,
        };
      }
      metricsByProduct[item.productId].quantitySold += Number(
        item.quantity || 0,
      );
      metricsByProduct[item.productId].revenue +=
        Number(item.price || 0) * Number(item.quantity || 0);
      metricsByProduct[item.productId].orderCount += 1;
    });
  });

  const rankedProducts = (products || []).map((product) => {
    const metrics = metricsByProduct[product.id] || {
      quantitySold: 0,
      revenue: 0,
      orderCount: 0,
    };
    return {
      ...product,
      quantitySold: metrics.quantitySold,
      revenue: metrics.revenue,
      orderCount: metrics.orderCount,
      ratingCount: Number(product.ratingCount || 0),
      rating: Number(product.rating || 0),
      trendScore:
        metrics.quantitySold * 5 +
        Number(product.ratingCount || 0) * 3 +
        Number(product.rating || 0),
    };
  });

  const nonZeroSales =
    rankedProducts.filter((product) => product.quantitySold > 0).length > 0
      ? rankedProducts.filter((product) => product.quantitySold > 0)
      : rankedProducts;

  return [
    {
      id: "trending",
      label: "Trending",
      metricLabel: "Trend score",
      items: [...rankedProducts]
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 4),
      metricValue: (item) => item.trendScore.toLocaleString(),
    },
    {
      id: "most-bought",
      label: "Most Bought",
      metricLabel: "Units sold",
      items: [...rankedProducts]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 4),
      metricValue: (item) => item.quantitySold.toLocaleString(),
    },
    {
      id: "less-bought",
      label: "Less Bought",
      metricLabel: "Units sold",
      items: [...nonZeroSales]
        .sort((a, b) => a.quantitySold - b.quantitySold)
        .slice(0, 4),
      metricValue: (item) => item.quantitySold.toLocaleString(),
    },
    {
      id: "most-reviewed",
      label: "Most Reviews",
      metricLabel: "Reviews",
      items: [...rankedProducts]
        .sort((a, b) => b.ratingCount - a.ratingCount)
        .slice(0, 4),
      metricValue: (item) => item.ratingCount.toLocaleString(),
    },
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
        setProductInsights(
          buildProductInsights(
            Array.isArray(productsResponse) ? productsResponse : [],
            Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [],
          ),
        );
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  const salesData = (analytics?.salesSeries || []).map((item) => ({
    label: item.label || item.key,
    value: Number(item.value || 0),
  }));
  const maxSales = Math.max(
    ...(salesData.map((d) => d.value).length
      ? salesData.map((d) => d.value)
      : [1]),
  );

  const categoryStats = (analytics?.categoryStats || [])
    .slice(0, 5)
    .map((c, i) => ({
      ...c,
      color:
        [
          "bg-blue-500",
          "bg-purple-500",
          "bg-green-500",
          "bg-orange-500",
          "bg-gray-500",
        ][i] || "bg-gray-400",
      value: analytics?.totalProducts
        ? Math.round((c.count / analytics.totalProducts) * 100)
        : 0,
    }));

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center">
        <div className="bg-white dark:glass-card rounded-2xl p-8 text-center shadow">
          <p className="text-red-500 font-bold text-lg mb-4">
            Failed to load analytics
          </p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, Admin · Live data from Firebase
            </p>
          </div>
          <div className="flex gap-2">
            {["week", "month", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  timeRange === range
                    ? "bg-zoop-moss text-zoop-obsidian dark:text-white"
                    : "bg-white dark:glass-card text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Revenue",
              value: loading
                ? null
                : formatInrWithSymbol(analytics?.totalRevenue || 0, {
                    compact: true,
                    maximumFractionDigits: 1,
                  }),
              bg: "from-blue-500 to-blue-600",
              icon: <Activity width={24} height={24} />,
            },
            {
              label: "Total Orders",
              value: loading
                ? null
                : (analytics?.totalOrders || 0).toLocaleString(),
              bg: "from-green-500 to-green-600",
              icon: <ShoppingCart width={24} height={24} />,
            },
            {
              label: "Total Users",
              value: loading
                ? null
                : (analytics?.totalUsers || 0).toLocaleString(),
              bg: "from-purple-500 to-purple-600",
              icon: <Users width={24} height={24} />,
            },
            {
              label: "Total Products",
              value: loading ? null : analytics?.totalProducts || 0,
              bg: "from-orange-500 to-orange-600",
              icon: <Package width={24} height={24} />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${card.bg} rounded-2xl p-6 text-white shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:shadow-xl transition-all`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                  {card.icon}
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  <TrendingUp width={14} height={14} />
                  <span className="text-xs font-bold">Live</span>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">
                {card.label}
              </p>
              {loading ? (
                <Skeleton className="h-10 w-32 bg-white/20" />
              ) : (
                <h3 className={statValueClass}>{card.value}</h3>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">
                Sales Overview
              </h2>
              <span className="text-sm text-gray-500">This {timeRange}</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[640px] items-end justify-between gap-3 h-72">
                {(salesData.length > 0
                  ? salesData
                  : [{ label: "-", value: 0 }]
                ).map((data, i) => (
                  <div
                    key={i}
                    className="flex min-w-[56px] flex-1 flex-col items-center gap-3"
                  >
                    <p className="text-[11px] font-black text-zoop-obsidian dark:text-white whitespace-nowrap">
                      {formatInrWithSymbol(Math.round(data.value))}
                    </p>
                    <div
                      className="w-full relative flex items-end justify-center"
                      style={{ height: "208px" }}
                    >
                      <div
                        className="w-full min-h-[12px] bg-gradient-to-t from-zoop-moss to-green-400 rounded-t-lg group cursor-pointer hover:opacity-80 transition-all"
                        style={{
                          height: `${Math.max(8, (data.value / maxSales) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 text-center leading-tight whitespace-nowrap">
                      {data.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-black text-zoop-obsidian dark:text-white mb-6">
              Categories
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : categoryStats.length > 0 ? (
              <div className="space-y-4">
                {categoryStats.map((cat, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {cat.name}
                      </span>
                      <span className="text-sm font-black text-zoop-obsidian dark:text-white">
                        {cat.value}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full`}
                        style={{ width: `${cat.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center pt-8">
                No category data yet.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="text-sm font-bold text-zoop-moss hover:underline"
              >
                View All
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (analytics?.recentOrders || []).length > 0 ? (
              <div className="space-y-4">
                {analytics.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-zoop-obsidian dark:text-white text-sm truncate">
                        {order.displayOrderId || order.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.customer?.name ||
                          order.customer?.email ||
                          "Customer"}{" "}
                        • {order.items} item(s)
                      </p>
                      {order.primaryProduct?.title && (
                        <p className="text-xs text-gray-500 truncate">
                          {order.primaryProduct.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-zoop-obsidian dark:text-white">
                        <span className="tabular-nums">
                          {formatInrWithSymbol(order.totalAmount || 0, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-[10px] font-black uppercase mt-1 ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No orders yet.</p>
            )}
          </div>

          {/* Order Status Summary */}
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">
                Order Status
              </h2>
              <Link
                to="/admin/sellers"
                className="text-sm font-bold text-zoop-moss hover:underline"
              >
                Sellers
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : analytics?.orderStatusCounts &&
              Object.keys(analytics.orderStatusCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.orderStatusCounts).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                    >
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${statusColor(status)}`}
                      >
                        {status}
                      </span>
                      <span className="font-black text-zoop-obsidian dark:text-white text-lg">
                        {count}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <span className="text-sm text-gray-500">Total Sellers</span>
                  <span className="font-black text-zoop-obsidian dark:text-white">
                    {analytics?.totalSellers || 0}
                  </span>
                </div>
                <p className="text-gray-400 text-sm text-center pt-4">
                  No order status data yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {productInsights.map((group) => (
            <div key={group.id} className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Product Signals
                  </p>
                  <h2 className="text-xl font-black text-zoop-obsidian dark:text-white mt-1">
                    {group.label}
                  </h2>
                </div>
                <Link
                  to="/admin/contentcuration"
                  className="text-xs font-bold text-zoop-moss hover:underline"
                >
                  View Products
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <Skeleton key={idx} className="h-20" />
                  ))}
                </div>
              ) : group.items.length > 0 ? (
                <div className="space-y-4">
                  {group.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative group overflow-hidden rounded-2xl bg-white dark:glass-card border border-gray-100 dark:border-white/10 p-4 transition-all duration-300 hover:shadow-2xl hover:border-zoop-moss/30 hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-zoop-moss/20 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-150" />

                      <div className="flex gap-4">
                        <div className="text-xl font-900 text-gray-200 mt-1 select-none w-6">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-zoop-obsidian dark:text-white line-clamp-2 leading-snug group-hover:text-zoop-moss transition-colors">
                            {item.name || item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-zoop-obsidian px-2 py-0.5 rounded-md">
                              {item.brand || "Brand"}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-zoop-obsidian dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md truncate">
                              {item.category || item.categoryId || "Category"}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black tracking-widest uppercase text-gray-400">
                                {group.metricLabel}
                              </span>
                              <span className="text-sm font-black text-zoop-obsidian dark:text-white">
                                {group.metricValue(item)}
                              </span>
                            </div>
                            <div className="w-px h-8 bg-gray-100 dark:bg-white/10 mx-2" />
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black tracking-widest uppercase text-gray-400">
                                Revenue
                              </span>
                              <span className="text-sm font-black text-green-600">
                                {formatInrWithSymbol(item.revenue || 0, {
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 border-dashed">
                  <p className="text-sm font-bold text-gray-400">
                    No signals found
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
