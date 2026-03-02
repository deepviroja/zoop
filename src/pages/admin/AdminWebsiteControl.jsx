import React, { useEffect, useState } from "react";
import { adminApi, authApi } from "../../services/api";

const AdminWebsiteControl = () => {
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [config, setConfig] = useState({
    brandName: "ZOOP",
    brandLogoUrl: "",
    brandTextColor: "#b7e84b",
    brandFontFamily: "inherit",
    brandFontWeight: "900",
    announcementBanner: "",
    subNavCategories: "",
    maintenanceMode: false,
    homeSameDayCutoffText: "Order before 6 PM for same-day delivery",
    homeHeroHeadline: "Discover Local Gems",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.getSiteConfig(), authApi.getProfile()])
      .then(([cfg, profile]) => {
        if (cancelled) return;
        setConfig((prev) => ({
          ...prev,
          ...cfg,
          subNavCategories: Array.isArray(cfg?.subNavCategories)
            ? cfg.subNavCategories.join(", ")
            : prev.subNavCategories,
        }));
        setIsSuperAdmin(String(profile?.email || "").toLowerCase() === "admin@zoop.com");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSiteConfig({
        ...config,
        brandName: config.brandName || "ZOOP",
        brandLogoUrl: config.brandLogoUrl || "",
        brandTextColor: config.brandTextColor || "#b7e84b",
        brandFontFamily: config.brandFontFamily || "inherit",
        brandFontWeight: String(config.brandFontWeight || "900"),
        subNavCategories: String(config.subNavCategories || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        maintenanceMode: !!config.maintenanceMode,
      });
      alert("Website controls published.");
    } catch (e) {
      alert(e?.message || "Failed to publish website controls.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian uppercase">
            Website_Control
          </h1>
          <p className="text-gray-500 mt-2">
            Update live website settings and publish after final review.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Header Brand Name
              </label>
              <input
                value={config.brandName}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="ZOOP"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Brand Logo URL
              </label>
              <input
                value={config.brandLogoUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandLogoUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Announcement Banner
              </label>
              <input
                value={config.announcementBanner}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, announcementBanner: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="Order before 6 PM for same-day delivery"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Brand Text Color
              </label>
              <input
                value={config.brandTextColor}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandTextColor: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="#b7e84b"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Brand Font Family
              </label>
              <input
                value={config.brandFontFamily}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandFontFamily: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="inherit"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Brand Font Weight
              </label>
              <input
                value={config.brandFontWeight}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandFontWeight: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Home Hero Headline
              </label>
              <input
                value={config.homeHeroHeadline}
                onChange={(e) => setConfig((prev) => ({ ...prev, homeHeroHeadline: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
                placeholder="Discover curated local-first products"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Same-Day Cutoff Line
              </label>
              <input
                value={config.homeSameDayCutoffText}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, homeSameDayCutoffText: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
              Sub Navbar Categories (comma separated)
            </label>
            <input
              value={config.subNavCategories}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, subNavCategories: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss outline-none"
              placeholder="Electronics, Fashion, Handmade, Home"
            />
          </div>

          <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!config.maintenanceMode}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                }
                className="w-4 h-4 accent-zoop-obsidian"
              />
              <span className="text-sm font-bold text-gray-800">Maintenance Mode</span>
            </label>
            <p className="text-xs text-gray-600 mt-2">
              Maintenance Mode temporarily blocks regular users from shopping while admins update
              the website safely.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-zoop-obsidian text-white rounded-xl font-black text-sm hover:bg-zoop-moss hover:text-zoop-obsidian transition-all disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish Final Changes"}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 space-y-4">
          <h2 className="text-xl font-black text-red-700">Super Admin Actions</h2>
          {isSuperAdmin ? (
            <>
              <p className="text-sm text-gray-600">
                Only <span className="font-black">admin@zoop.com</span> can run these reset and delete operations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete ALL products?")) return;
                await adminApi.deleteAllProducts();
                alert("All products deleted.");
              }}
              className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest"
            >
              Delete All Products
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete all customer records?")) return;
                await adminApi.deleteUsersByRole("customer");
                alert("Customer records marked deleted.");
              }}
              className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest"
            >
              Delete Users
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete all seller records?")) return;
                await adminApi.deleteUsersByRole("seller");
                alert("Seller records marked deleted.");
              }}
              className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest"
            >
              Delete Sellers
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Delete all admin records except super admin?")) return;
                await adminApi.deleteUsersByRole("admin");
                alert("Admin records marked deleted.");
              }}
              className="px-5 py-3 rounded-xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest"
            >
              Delete Admins
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Reset website data (orders, ads, tickets, notifications)?")) return;
                await adminApi.resetWebData();
                alert("Website data reset complete.");
              }}
              className="md:col-span-2 px-5 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest"
            >
              Reset Web
            </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Restricted. Login with <span className="font-black">admin@zoop.com</span> to access destructive controls.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWebsiteControl;
