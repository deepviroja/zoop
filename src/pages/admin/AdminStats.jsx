import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "../../assets/icons/TrendingUp";
import { Users } from "../../assets/icons/Users";
import { Package } from "../../assets/icons/Package";
import { Activity } from "../../assets/icons/Activity";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { adminApi } from "../../services/api";

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
  <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

const AdminStats = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAnalytics({ range: timeRange });
        setAnalytics(data);
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
  const maxSales = Math.max(...(salesData.map((d) => d.value).length ? salesData.map((d) => d.value) : [1]));

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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow">
          <p className="text-red-500 font-bold text-lg mb-4">
            Failed to load analytics
          </p>
          <p className="text-gray-500 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-zoop-obsidian">
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
                    ? "bg-zoop-moss text-zoop-obsidian"
                    : "bg-white text-gray-600 hover:bg-gray-100"
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
                : `₹${((analytics?.totalRevenue || 0) / 1000).toFixed(1)}k`,
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
              className={`bg-gradient-to-br ${card.bg} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
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
                <h3 className="text-3xl font-black">{card.value}</h3>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian">
                Sales Overview
              </h2>
              <span className="text-sm text-gray-500">
                This {timeRange}
              </span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[640px] items-end justify-between gap-3 h-72">
                {(salesData.length > 0
                  ? salesData
                  : [{ label: "-", value: 0 }]).map((data, i) => (
                  <div
                    key={i}
                    className="flex min-w-[56px] flex-1 flex-col items-center gap-3"
                  >
                    <p className="text-[11px] font-black text-zoop-obsidian whitespace-nowrap">
                      ₹{Math.round(data.value).toLocaleString("en-IN")}
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
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-zoop-obsidian mb-6">
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
                      <span className="text-sm font-bold text-gray-700">
                        {cat.name}
                      </span>
                      <span className="text-sm font-black text-zoop-obsidian">
                        {cat.value}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian">
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-zoop-obsidian text-sm truncate">
                        {order.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items} item(s)
                      </p>
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
                      <p className="font-black text-zoop-obsidian">
                        ₹{(order.totalAmount || 0).toLocaleString()}
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
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-zoop-obsidian">
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${statusColor(status)}`}
                      >
                        {status}
                      </span>
                      <span className="font-black text-zoop-obsidian text-lg">
                        {count}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Total Sellers</span>
                  <span className="font-black text-zoop-obsidian">
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
      </div>
    </div>
  );
};

export default AdminStats;
