import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from '../../assets/icons/Activity';
import { ShoppingCart } from '../../assets/icons/ShoppingCart';
import { Package } from '../../assets/icons/Package';
import { TrendingUp } from '../../assets/icons/TrendingUp';
import { Star } from '../../assets/icons/Star';
import { Plus } from '../../assets/icons/Plus';
import { apiClient } from '../../api/client';

interface DashboardStats {
  products: number;
  orders: number;
  revenue: number;
}

import { useUser } from '../../context/UserContext';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('week');
    const [stats, setStats] = useState<DashboardStats>({
        products: 0,
        orders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
             // ... logic ...
               setStats({
                 products: 12,
                 orders: 45,
                 revenue: 125000
               });
               setLoading(false);
        };
        fetchDashboardData();
    }, []);

    const salesData = [
        { day: 'Mon', sales: 85 },
        { day: 'Tue', sales: 92 },
        { day: 'Wed', sales: 78 },
        { day: 'Thu', sales: 95 },
        { day: 'Fri', sales: 88 },
        { day: 'Sat', sales: 100 },
        { day: 'Sun', sales: 75 },
    ];

    const maxSales = Math.max(...salesData.map(d => d.sales));

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Approval Notice */}
                {/* We assume if they just finished onboarding, they might be pending. 
                    For now, we display this if a specific flag is set or purely ensuring visual feedback.
                    Since we don't have isApproved in context yet, we'll skip the condition or add a static notice for demo if requested. 
                    But strictly, let's just add the Logout functionality first.
                */}
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-900 text-zoop-obsidian">Seller Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {user?.displayName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                        {['week', 'month', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${timeRange === range
                                        ? 'bg-zoop-moss text-zoop-obsidian'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                                <Activity width={24} height={24} />
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                <TrendingUp width={14} height={14} />
                                <span className="text-xs font-bold">+18.5%</span>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Total Sales</p>
                        <h3 className="text-3xl font-black">Rs. {(stats.revenue / 1000).toFixed(1)}k</h3>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                                <ShoppingCart width={24} height={24} />
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                <TrendingUp width={14} height={14} />
                                <span className="text-xs font-bold">+12.3%</span>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Total Orders</p>
                        <h3 className="text-3xl font-black">{stats.orders}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                                <Package width={24} height={24} />
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                <TrendingUp width={14} height={14} />
                                <span className="text-xs font-bold">+5.0%</span>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Active Products</p>
                        <h3 className="text-3xl font-black">{stats.products}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                                <Star width={24} height={24} fill="white" />
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                                <TrendingUp width={14} height={14} />
                                <span className="text-xs font-bold">+4.2%</span>
                            </div>
                        </div>
                        <p className="text-white/80 text-sm font-medium mb-1">Average Rating</p>
                        <h3 className="text-3xl font-black">4.8 ★</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-zoop-obsidian">Sales Overview</h2>
                            <span className="text-sm text-gray-500">This {timeRange}</span>
                        </div>

                        <div className="flex items-end justify-between gap-3 h-64">
                            {salesData.map((data, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full relative flex items-end justify-center" style={{ height: '200px' }}>
                                        <div
                                            className="w-full bg-gradient-to-t from-zoop-moss to-green-400 rounded-t-lg relative group cursor-pointer transition-all hover:opacity-80"
                                            style={{
                                                height: `${(data.sales / maxSales) * 100}%`,
                                                animation: 'growUp 0.6s ease-out',
                                                animationDelay: `${i * 0.1}s`,
                                                animationFillMode: 'backwards'
                                            }}
                                        >
                                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                                Rs. {data.sales}k
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">{data.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-black text-zoop-obsidian mb-6">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                to="/seller/add-product"
                                className="flex items-center gap-3 p-4 bg-zoop-moss hover:bg-zoop-moss/80 rounded-xl transition-all group"
                            >
                                <div className="p-2 bg-zoop-obsidian rounded-lg">
                                    <Plus width={20} height={20} className="text-zoop-moss" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-zoop-obsidian">Add Product</p>
                                    <p className="text-xs text-zoop-obsidian/60">List a new item</p>
                                </div>
                            </Link>

                            <Link
                                to="/seller/orders"
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <ShoppingCart width={20} height={20} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-zoop-obsidian">Manage Orders</p>
                                    <p className="text-xs text-gray-600">{stats.orders} total</p>
                                </div>
                            </Link>

                            <Link
                                to="/seller/products"
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Package width={20} height={20} className="text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-zoop-obsidian">My Products</p>
                                    <p className="text-xs text-gray-600">{stats.products} active</p>
                                </div>
                            </Link>

                            <Link
                                to="/seller/analytics"
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp width={20} height={20} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-zoop-obsidian">Analytics</p>
                                    <p className="text-xs text-gray-600">View insights</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                <style>{`
        @keyframes growUp {
          from { height: 0; }
        }
      `}</style>
            </div>
        );
};

export default SellerDashboard;
