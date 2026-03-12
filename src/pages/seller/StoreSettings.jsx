import React, { useEffect, useState } from "react";
import { authApi } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { Moon } from "../../assets/icons/Moon";
import { Sun } from "../../assets/icons/Sun";

const defaultSettings = {
  orderNotifications: true,
  lowStockAlerts: true,
  customerMessages: true,
  weeklyReports: true,
  vacationMode: false,
  autoRestock: false,
  payoutPreference: "bank_transfer",
  upiId: "",
  showPhoneOnProduct: false,
  showEmailOnProduct: false,
  sameDayCutoffHour: 18,
  sameDayDeliveryWindowHours: 4,
};

const StoreSettings = () => {
  const { showToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultSettings);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await authApi.getProfile();
        if (cancelled) return;
        const notificationPreferences = profile?.notificationPreferences || {};
        const storeSettings = profile?.storeSettings || {};
        setForm({
          orderNotifications:
            notificationPreferences.orderNotifications ??
            profile?.orderNotifications ??
            defaultSettings.orderNotifications,
          lowStockAlerts:
            notificationPreferences.lowStockAlerts ??
            profile?.lowStockAlerts ??
            defaultSettings.lowStockAlerts,
          customerMessages:
            notificationPreferences.customerMessages ??
            profile?.customerMessages ??
            defaultSettings.customerMessages,
          weeklyReports:
            notificationPreferences.weeklyReports ??
            profile?.weeklyReports ??
            defaultSettings.weeklyReports,
          vacationMode:
            storeSettings.vacationMode ??
            profile?.vacationMode ??
            defaultSettings.vacationMode,
          autoRestock:
            storeSettings.autoRestock ??
            profile?.autoRestock ??
            defaultSettings.autoRestock,
          payoutPreference:
            storeSettings.payoutPreference ||
            profile?.payoutPreference ||
            defaultSettings.payoutPreference,
          upiId: storeSettings.upiId || profile?.upiId || "",
          showPhoneOnProduct:
            storeSettings.showPhoneOnProduct ??
            profile?.showPhoneOnProduct ??
            defaultSettings.showPhoneOnProduct,
          showEmailOnProduct:
            storeSettings.showEmailOnProduct ??
            profile?.showEmailOnProduct ??
            defaultSettings.showEmailOnProduct,
          sameDayCutoffHour:
            Number(
              storeSettings.sameDayCutoffHour ??
                profile?.sameDayCutoffHour ??
                defaultSettings.sameDayCutoffHour,
            ) || defaultSettings.sameDayCutoffHour,
          sameDayDeliveryWindowHours:
            Number(
              storeSettings.sameDayDeliveryWindowHours ??
                profile?.sameDayDeliveryWindowHours ??
                defaultSettings.sameDayDeliveryWindowHours,
            ) || defaultSettings.sameDayDeliveryWindowHours,
        });
      } catch (e) {
        showToast(e?.message || "Failed to load store settings", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleToggle = (key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (form.payoutPreference === "upi" && form.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(form.upiId)) {
      showToast("Please enter a valid UPI ID", "warning");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        notificationPreferences: {
          orderNotifications: form.orderNotifications,
          lowStockAlerts: form.lowStockAlerts,
          customerMessages: form.customerMessages,
          weeklyReports: form.weeklyReports,
        },
        storeSettings: {
          vacationMode: form.vacationMode,
          autoRestock: form.autoRestock,
          payoutPreference: form.payoutPreference,
          upiId: form.payoutPreference === "upi" ? form.upiId : "",
          showPhoneOnProduct: form.showPhoneOnProduct,
          showEmailOnProduct: form.showEmailOnProduct,
          sameDayCutoffHour: Number(form.sameDayCutoffHour || 18),
          sameDayDeliveryWindowHours: Number(form.sameDayDeliveryWindowHours || 4),
        },
        orderNotifications: form.orderNotifications,
        lowStockAlerts: form.lowStockAlerts,
        customerMessages: form.customerMessages,
        weeklyReports: form.weeklyReports,
        vacationMode: form.vacationMode,
        autoRestock: form.autoRestock,
        payoutPreference: form.payoutPreference,
        upiId: form.payoutPreference === "upi" ? form.upiId : "",
        showPhoneOnProduct: form.showPhoneOnProduct,
        showEmailOnProduct: form.showEmailOnProduct,
        sameDayCutoffHour: Number(form.sameDayCutoffHour || 18),
        sameDayDeliveryWindowHours: Number(form.sameDayDeliveryWindowHours || 4),
      });
      showToast("Store settings updated", "success");
    } catch (e) {
      showToast(e?.message || "Could not save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center">
        <p className="text-sm font-bold text-gray-500">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
              Store_Settings
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
              Configure operations, notifications, and payout preferences
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/10 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:scale-105 transition-all"
          >
            {isDarkMode ? (
              <>
                <Sun width={18} height={18} className="text-zoop-moss" />
                <span className="text-xs font-black uppercase text-zoop-moss">Switch to Light</span>
              </>
            ) : (
              <>
                <Moon width={18} height={18} className="text-zoop-obsidian" />
                <span className="text-xs font-black uppercase text-zoop-obsidian">Switch to Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:glass-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-6">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Notifications</h2>
          {[
            { key: "orderNotifications", label: "Order Notifications", desc: "Get alerts for new and updated orders" },
            { key: "lowStockAlerts", label: "Low Stock Alerts", desc: "Get notified when inventory is running low" },
            { key: "customerMessages", label: "Customer Messages", desc: "Receive buyer message notifications" },
            { key: "weeklyReports", label: "Weekly Reports", desc: "Receive weekly business reports via email" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-zoop-obsidian dark:text-white">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form[item.key])}
                  onChange={() => handleToggle(item.key)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 dark:bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-zoop-moss" />
              </label>
            </div>
          ))}
        </div>

        <div className="bg-white dark:glass-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-6">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Operations</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <div>
              <p className="font-bold text-zoop-obsidian dark:text-white">Vacation Mode</p>
              <p className="text-sm text-gray-500">
                Temporarily pause store operations for new orders
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.vacationMode}
                onChange={() => handleToggle("vacationMode")}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 dark:bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-zoop-moss" />
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
            <div>
              <p className="font-bold text-zoop-obsidian dark:text-white">Auto Restock Suggestions</p>
              <p className="text-sm text-gray-500">
                Suggest restock actions based on order trends
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoRestock}
                onChange={() => handleToggle("autoRestock")}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 dark:bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-zoop-moss" />
            </label>
          </div>
        </div>

        <div className="bg-white dark:glass-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-6">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Payout Preference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, payoutPreference: "bank_transfer" }))}
              className={`p-4 border rounded-xl text-left ${
                form.payoutPreference === "bank_transfer"
                  ? "border-zoop-moss bg-zoop-moss/10"
                  : "border-gray-200 dark:border-white/10 bg-white dark:glass-card"
              }`}
            >
              <p className="font-black text-zoop-obsidian dark:text-white">Bank Transfer</p>
              <p className="text-sm text-gray-500 mt-1">
                Default method, uses bank details from seller profile
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, payoutPreference: "upi" }))}
              className={`p-4 border rounded-xl text-left ${
                form.payoutPreference === "upi"
                  ? "border-zoop-moss bg-zoop-moss/10"
                  : "border-gray-200 dark:border-white/10 bg-white dark:glass-card"
              }`}
            >
              <p className="font-black text-zoop-obsidian dark:text-white">UPI</p>
              <p className="text-sm text-gray-500 mt-1">Use UPI ID for payout reference records</p>
            </button>
          </div>
          {form.payoutPreference === "upi" && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => setForm((prev) => ({ ...prev, upiId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
                placeholder="example@upi"
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:glass-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-6">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Customer Contact Visibility</h2>
          {[
            { key: "showPhoneOnProduct", label: "Show Phone on Product Page", desc: "Buyers can see your phone number in seller information when enabled" },
            { key: "showEmailOnProduct", label: "Show Email on Product Page", desc: "Buyers can see your support email in seller information when enabled" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-zoop-obsidian dark:text-white">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form[item.key])}
                  onChange={() => handleToggle(item.key)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 dark:bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-zoop-moss" />
              </label>
            </div>
          ))}
        </div>

        <div className="bg-white dark:glass-card rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-6">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Same-Day Delivery Timing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Order Cutoff Hour
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={form.sameDayCutoffHour}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sameDayCutoffHour: Number(e.target.value || 18),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Delivery Window Hours
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={form.sameDayDeliveryWindowHours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sameDayDeliveryWindowHours: Number(e.target.value || 4),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-zoop-moss"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Local products in the buyer&apos;s city will show same-day delivery before the cutoff, then next-day after it.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-zoop-obsidian text-white font-black text-xs uppercase tracking-widest hover:bg-zoop-moss hover:text-zoop-obsidian transition-all disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Store Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;
