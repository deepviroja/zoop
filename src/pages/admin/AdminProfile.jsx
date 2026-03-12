import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../../assets/icons/User';
import { Mail } from '../../assets/icons/Mail';
import { Shield } from '../../assets/icons/Shield';
import { BellRing } from '../../assets/icons/BellRing';
import { authApi, contentApi, adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProfile = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ displayName: "", email: "", password: "" });
  
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@zoop.com',
    role: 'Super Admin',
    avatar: '👨‍💼',
    bio: 'Platform administrator',
  });

  const [stats, setStats] = useState({
    totalActions: 0,
    usersManaged: 0,
    sellersVerified: 0,
    issuesResolved: 0,
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "notifications") {
      setActiveTab("notifications");
      setTimeout(() => {
        document.getElementById("admin-notifications")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profile, notificationList] = await Promise.all([
          authApi.getProfile(),
          contentApi.getMyNotifications(),
        ]);
        if (cancelled) return;
        setProfileData((prev) => ({
          ...prev,
          name: profile?.displayName || profile?.name || prev.name,
          email: profile?.email || prev.email,
        }));
        setNotifications(Array.isArray(notificationList) ? notificationList : []);
        const adminUsers = await adminApi.getUsers({ role: "admin", limit: "100" });
        setAdmins(adminUsers?.users || []);
        const analytics = await adminApi.getAnalytics();
        setStats({
          totalActions: Number(analytics?.totalOrders || 0) + Number(analytics?.totalProducts || 0),
          usersManaged: Number(analytics?.totalUsers || 0),
          sellersVerified: Number(analytics?.totalSellers || 0),
          issuesResolved: Number((analytics?.recentOrders || []).length || 0),
        });
      } catch (e) {
        if (!cancelled) {
          setNotifications([]);
          showToast(e?.message || 'Failed to load admin data', 'error');
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser({
        displayName: newAdmin.displayName,
        email: newAdmin.email,
        password: newAdmin.password,
        role: "admin",
      });
      showToast("New admin added", "success");
      setNewAdmin({ displayName: "", email: "", password: "" });
      const adminUsers = await adminApi.getUsers({ role: "admin", limit: "100" });
      setAdmins(adminUsers?.users || []);
    } catch (error) {
      showToast(error?.message || "Failed to add admin", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
              Admin_Profile
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-zoop-obsidian via-gray-900 to-zoop-obsidian text-white rounded-3xl p-10 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-32 h-32 bg-zoop-moss rounded-full flex items-center justify-center text-6xl">
                {profileData.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black">{profileData.name}</h2>
                  <span className="px-3 py-1 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-full text-xs font-black">
                    {profileData.role}
                  </span>
                </div>
                <p className="text-white/80 mb-4">{profileData.bio}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail width={16} height={16} className="text-zoop-moss" />
                    {profileData.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-zoop-moss opacity-10 blur-[100px] rounded-full"></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="text-3xl font-black text-zoop-obsidian dark:text-white">{stats.totalActions}</div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
              Total Actions
            </div>
          </div>
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="text-3xl font-black text-blue-600">{stats.usersManaged}</div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
              Users Managed
            </div>
          </div>
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="text-3xl font-black text-purple-600">{stats.sellersVerified}</div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
              Sellers Verified
            </div>
          </div>
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="text-3xl font-black text-green-600">{stats.issuesResolved}</div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
              Issues Resolved
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:glass-card rounded-2xl p-2 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex gap-2">
            {[
              { key: 'profile', label: 'Profile Info', icon: User },
              { key: 'activity', label: 'Activity', icon: Shield },
              { key: 'notifications', label: 'Notifications', icon: BellRing },
              { key: 'admins', label: 'Admins', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-zoop-moss text-zoop-obsidian dark:text-white shadow'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Icon width={18} height={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:glass-card rounded-3xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-6">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                    Name
                  </label>
                  <p className="w-full px-4 py-3 border-2 rounded-xl font-bold border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                    {profileData.name}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                    Email Address
                  </label>
                  <p className="w-full px-4 py-3 border-2 rounded-xl font-bold border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                    {profileData.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-6">Recent Activity</h3>
                {String(profileData.email || "").toLowerCase() === "admin@zoop.com" && (
                  <button
                    onClick={async () => {
                      try {
                        await adminApi.clearAdminActivities();
                        setNotifications([]);
                        showToast("Admin recent activity cleared", "success");
                      } catch (e) {
                        showToast(e?.message || "Could not clear activity", "error");
                      }
                    }}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-red-50 text-red-600"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {notifications.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zoop-moss/20 text-zoop-obsidian dark:text-white">
                      <Shield width={18} height={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zoop-obsidian dark:text-white">{activity.title || "Admin event"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.message || "-"}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "-"}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-sm text-gray-500">No recent activity found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div id="admin-notifications" className="space-y-6">
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-6">Admin Notifications</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border ${
                        n.read ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10' : 'bg-zoop-moss/10 border-zoop-moss/30'
                      }`}
                    >
                      <p className="font-bold text-zoop-obsidian dark:text-white">{n.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white">Admin Accounts</h3>
              {String(profileData.email || "").toLowerCase() === "admin@zoop.com" ? (
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <input
                    required
                    value={newAdmin.displayName}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
                  />
                  <input
                    required
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@zoop.com"
                    className="px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
                  />
                  <input
                    required
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Temporary password"
                    className="px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
                  />
                  <button
                    type="submit"
                    className="md:col-span-3 px-5 py-3 bg-zoop-obsidian text-white rounded-xl font-black text-sm hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
                  >
                    Add Admin
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  Only super admin (<span className="font-black">admin@zoop.com</span>) can add or remove admins.
                </p>
              )}

              <div className="space-y-3">
                {admins.length === 0 ? (
                  <p className="text-sm text-gray-500">No admins found.</p>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.id} className="p-4 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:glass-card">
                      <p className="font-black text-zoop-obsidian dark:text-white">{admin.displayName || admin.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : "-"} | Last login:{" "}
                        {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "-"}
                      </p>
                      {String(profileData.email || "").toLowerCase() === "admin@zoop.com" &&
                        String(admin.email || "").toLowerCase() !== "admin@zoop.com" && (
                          <button
                            onClick={async () => {
                              try {
                                await adminApi.removeAdmin(admin.id);
                                showToast("Admin removed", "success");
                                const adminUsers = await adminApi.getUsers({ role: "admin", limit: "100" });
                                setAdmins(adminUsers?.users || []);
                              } catch (e) {
                                showToast(e?.message || "Could not remove admin", "error");
                              }
                            }}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest"
                          >
                            Remove Admin
                          </button>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
