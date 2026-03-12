import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { apiClient } from "../../api/client";

import { Box } from "../../assets/icons/Box";
import { SearchIcon } from "../../assets/icons/SearchIcon";
import { X } from "../../assets/icons/X";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/ui/Loader";
import ScrollToTop from "../../components/shared/ScrollToTop";

const Notifications = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'unread'

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const list = await apiClient.get("/content/notifications/my");
      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/content/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put("/content/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/content/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {}
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black mb-2 text-zoop-obsidian dark:text-white">
          Not logged in
        </h2>
        <button
          onClick={() => navigate("/login")}
          className="bg-zoop-moss text-zoop-obsidian dark:text-white px-6 py-2 rounded-lg font-bold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.read,
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 relative min-h-[60vh]">
      <ScrollToTop />
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X width={24} height={24} className="text-gray-500" />
        </button>
        <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white">
          Notifications
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === "all"
                ? "bg-white dark:glass-card text-zoop-obsidian dark:text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === "unread"
                ? "bg-white dark:glass-card text-zoop-obsidian dark:text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Unread
          </button>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-sm font-bold text-zoop-moss hover:opacity-80 transition-opacity w-full sm:w-auto text-right"
        >
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <Loader />
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
          <div className="w-16 h-16 bg-white dark:glass-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <Box width={32} height={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            No notifications
          </h3>
          <p className="text-gray-500 text-sm">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all ${
                n.read
                  ? "bg-white dark:glass-card border-gray-100 dark:border-white/10 opacity-70"
                  : "bg-zoop-moss/5 border-zoop-moss/20 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-zoop-obsidian dark:text-white text-lg">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-zoop-moss flex-shrink-0 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{n.message}</p>
                  <p className="text-xs text-gray-400 font-medium">
                    {new Date(n.createdAt || n.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-2 bg-white dark:glass-card rounded-full shadow hover:bg-zoop-moss hover:text-zoop-obsidian transition-colors text-gray-500"
                      title="Mark as read"
                    >
                      <X width={16} height={16} />{" "}
                      {/* Using X as check temporary, will fix icons if available */}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-2 bg-white dark:glass-card rounded-full shadow hover:bg-red-500 hover:text-white transition-colors text-red-500"
                    title="Delete"
                  >
                    <Box width={16} height={16} />{" "}
                    {/* Using box as trash, fix later */}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
