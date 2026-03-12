import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/api";
import { Search } from "../../assets/icons/Search";
import { Mail } from "../../assets/icons/Mail";
import { Phone } from "../../assets/icons/Phone";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { Eye } from "../../assets/icons/Eye";
import { Check } from "../../assets/icons/Check";
import { X } from "../../assets/icons/X";

const fmtInr = (value) =>
  Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDateTime = (value) => (value ? new Date(value).toLocaleString() : "-");
const getAccountState = (user) => {
  if (
    user?.isDeleted ||
    user?.status === "deleted" ||
    user?.accountState === "deleted"
  ) {
    return "deleted";
  }
  if (
    user?.disabled ||
    user?.status === "banned" ||
    user?.accountState === "banned"
  ) {
    return "banned";
  }
  if (
    user?.status === "pending" ||
    user?.accountState === "pending" ||
    user?.isProfileComplete === false
  ) {
    return "pending";
  }
  return "active";
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({ role: "customer", limit: "100" });
      setUsers(response.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        String(user.displayName || user.name || "").toLowerCase().includes(q) ||
        String(user.email || "").toLowerCase().includes(q);
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && getAccountState(user) === "active") ||
          (filterStatus === "pending" && getAccountState(user) === "pending") ||
          (filterStatus === "suspended" && getAccountState(user) === "banned") ||
          (filterStatus === "deleted" && getAccountState(user) === "deleted");
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => getAccountState(u) === "active").length,
    pending: users.filter((u) => getAccountState(u) === "pending").length,
    suspended: users.filter((u) => getAccountState(u) === "banned").length,
    deleted: users.filter((u) => getAccountState(u) === "deleted").length,
  };

  const handleToggleBan = async (user) => {
    const accountState = getAccountState(user);
    if (accountState === "deleted") {
      alert("Deleted accounts cannot be unbanned.");
      return;
    }
    const action = accountState === "banned" ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} ${user.displayName || user.email}?`)) {
      return;
    }
    try {
      const shouldDisable = accountState !== "banned";
      await adminApi.banUser(user.id, shouldDisable);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                disabled: shouldDisable,
                status: shouldDisable ? "banned" : "active",
                accountState: shouldDisable ? "banned" : "active",
              }
            : u,
        ),
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({
          ...prev,
          disabled: shouldDisable,
          status: shouldDisable ? "banned" : "active",
          accountState: shouldDisable ? "banned" : "active",
        }));
      }
    } catch (err) {
      alert(`Failed to ${action} user`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
            Customer_Management
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
            Customer accounts, activity, and lifecycle signals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="text-3xl font-black text-zoop-obsidian dark:text-white">{stats.totalUsers}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
              Total Customers
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
            <div className="text-3xl font-black text-green-700">{stats.activeUsers}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-green-600 mt-1">
              Active
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-5 border border-sky-200">
            <div className="text-3xl font-black text-sky-700">{stats.pending}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-sky-600 mt-1">
              Pending
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200">
            <div className="text-3xl font-black text-orange-700">{stats.suspended}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1">
              Suspended
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-5 border border-gray-300">
            <div className="text-3xl font-black text-gray-700 dark:text-gray-300">{stats.deleted}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mt-1">
              Deleted
            </div>
          </div>
        </div>

        <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                width={18}
                height={18}
              />
              <input
                type="text"
                placeholder="Search by customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none font-bold"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none font-bold"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:glass-card rounded-3xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="overflow-x-auto scrollbar-gap">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500 font-bold" colSpan={5}>
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-500 font-bold" colSpan={5}>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zoop-obsidian dark:text-white">
                          {user.displayName || user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined: {fmtDateTime(user.joinedAt || user.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail width={14} height={14} />
                            {user.email || "-"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone width={14} height={14} />
                            {user.phone || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <ShoppingCart width={14} height={14} className="text-gray-400" />
                          <span className="font-bold text-zoop-obsidian dark:text-white">{user.totalOrders || 0}</span>
                          <span className="text-gray-500">orders</span>
                        </div>
                        <p className="text-xs text-zoop-moss font-black mt-1">
                          Rs. {fmtInr(user.totalSpent)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <p>{fmtDateTime(user.lastLoginAt)}</p>
                        {user.isActiveNow && (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700">
                            Online
                          </span>
                        )}
                        <span
                          className={`inline-flex mt-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            getAccountState(user) === "deleted"
                              ? "bg-gray-200 dark:bg-white/20 text-gray-700 dark:text-gray-300"
                              : getAccountState(user) === "pending"
                                ? "bg-sky-100 text-sky-700"
                              : getAccountState(user) === "banned"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {getAccountState(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="View Details"
                          >
                            <Eye width={18} height={18} />
                          </button>
                          {getAccountState(user) !== "deleted" && (
                            <button
                              onClick={() => handleToggleBan(user)}
                              className={`p-2 rounded-lg transition-all ${
                                getAccountState(user) === "banned"
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                              title={getAccountState(user) === "banned" ? "Activate User" : "Suspend User"}
                            >
                              {getAccountState(user) === "banned" ? (
                                <Check width={18} height={18} />
                              ) : (
                                <X width={18} height={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:glass-card rounded-3xl p-8 max-w-2xl w-full shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white">Customer Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X width={22} height={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Name</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">
                    {selectedUser.displayName || selectedUser.name || "-"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">{selectedUser.email || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Joined</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">
                    {fmtDateTime(selectedUser.joinedAt || selectedUser.createdAt)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Last Login</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">{fmtDateTime(selectedUser.lastLoginAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Last Order</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">{fmtDateTime(selectedUser.lastOrderAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase">Order Count</p>
                  <p className="font-black text-zoop-obsidian dark:text-white mt-1">{selectedUser.totalOrders || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">Total Spent</p>
                  <p className="font-black text-zoop-moss text-xl mt-1">Rs. {fmtInr(selectedUser.totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
