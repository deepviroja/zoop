import React, { useEffect, useState } from "react";
import { adminApi, authApi, contentApi } from "../../services/api";

const AdminWebsiteControl = () => {
  const [saving, setSaving] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [slidesSaving, setSlidesSaving] = useState(false);
  const [config, setConfig] = useState({
    brandName: "ZOOP",
    brandLogoUrl: "",
    brandTextColor: "#b7e84b",
    brandFontFamily: "inherit",
    brandFontWeight: "900",
    announcementBanner: "",
    subNavCategories: "",
    customerSidebarCategories: "",
    customerSidebarQuickLinks: "",
    homeSameDayCutoffText: "Order before 6 PM for same-day delivery",
    homeHeroHeadline: "Discover Local Gems",
    maintenanceMode: false,
    maintenanceMessage: "",
    sellerPanelTitle: "Seller Panel",
    adminPanelTitle: "Admin Control",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.getSiteConfig(),
      authApi.getProfile(),
      contentApi.getHeroSlides(),
    ])
      .then(([cfg, profile, slides]) => {
        if (cancelled) return;
        setConfig((prev) => ({
          ...prev,
          ...cfg,
          subNavCategories: Array.isArray(cfg?.subNavCategories)
            ? cfg.subNavCategories.join(", ")
            : prev.subNavCategories,
          customerSidebarCategories: Array.isArray(cfg?.customerSidebarCategories)
            ? cfg.customerSidebarCategories.join(", ")
            : prev.customerSidebarCategories,
          customerSidebarQuickLinks: Array.isArray(cfg?.customerSidebarQuickLinks)
            ? cfg.customerSidebarQuickLinks
                .map((item) => `${item.label}|${item.path}`)
                .join("\n")
            : prev.customerSidebarQuickLinks,
        }));
        setHeroSlides(Array.isArray(slides) ? slides : []);
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
        customerSidebarCategories: String(config.customerSidebarCategories || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        customerSidebarQuickLinks: String(config.customerSidebarQuickLinks || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [label, path] = line.split("|");
            return {
              label: String(label || "").trim(),
              path: String(path || "").trim() || "/",
            };
          })
          .filter((item) => item.label),
      });
      alert("Website controls published.");
    } catch (e) {
      alert(e?.message || "Failed to publish website controls.");
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceSave = async () => {
    setMaintenanceSaving(true);
    try {
      await adminApi.updateSiteConfig({
        maintenanceMode: Boolean(config.maintenanceMode),
        maintenanceMessage: String(config.maintenanceMessage || "").trim(),
      });
      alert("Maintenance settings updated.");
    } catch (e) {
      alert(e?.message || "Failed to update maintenance settings.");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleSlideChange = (index, key, value) => {
    setHeroSlides((prev) =>
      prev.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [key]: value } : slide,
      ),
    );
  };

  const handleSaveSlides = async () => {
    setSlidesSaving(true);
    try {
      await Promise.all(
        heroSlides.map((slide) =>
          slide.id
            ? adminApi.updateHeroSlide(slide.id, slide)
            : adminApi.createHeroSlide(slide),
        ),
      );
      alert("Hero slides updated.");
    } catch (e) {
      alert(e?.message || "Could not save hero slides.");
    } finally {
      setSlidesSaving(false);
    }
  };

  const addSlide = () => {
    setHeroSlides((prev) => [
      ...prev,
      {
        title: "New Hero Slide",
        desc: "Update this copy from admin.",
        img: "",
        city: "Surat",
        order: prev.length + 1,
        active: true,
      },
    ]);
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

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-zoop-obsidian text-white rounded-xl font-black text-sm hover:bg-zoop-moss hover:text-zoop-obsidian transition-all disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish Final Changes"}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zoop-obsidian">Home Slider Control</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update slide city, text, order, active state, and image URL from here.
              </p>
            </div>
            <button
              type="button"
              onClick={addSlide}
              className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-sm"
            >
              Add Slide
            </button>
          </div>
          <div className="space-y-4">
            {heroSlides.map((slide, index) => (
              <div key={slide.id || `new-${index}`} className="rounded-2xl border border-gray-200 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={slide.title || ""}
                    onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    placeholder="Slide title"
                  />
                  <input
                    value={slide.city || ""}
                    onChange={(e) => handleSlideChange(index, "city", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    placeholder="City"
                  />
                  <input
                    value={slide.img || ""}
                    onChange={(e) => handleSlideChange(index, "img", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl md:col-span-2"
                    placeholder="Image URL"
                  />
                  <textarea
                    value={slide.desc || ""}
                    onChange={(e) => handleSlideChange(index, "desc", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl md:col-span-2"
                    rows={3}
                    placeholder="Slide description"
                  />
                  <input
                    type="number"
                    value={slide.order || index + 1}
                    onChange={(e) => handleSlideChange(index, "order", Number(e.target.value || index + 1))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    placeholder="Order"
                  />
                  <label className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={slide.active !== false}
                      onChange={(e) => handleSlideChange(index, "active", e.target.checked)}
                    />
                    <span className="font-bold text-sm text-gray-700">Active slide</span>
                  </label>
                </div>
                {slide.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      await adminApi.deleteHeroSlide(slide.id);
                      setHeroSlides((prev) => prev.filter((item) => item.id !== slide.id));
                    }}
                    className="text-sm font-bold text-red-600"
                  >
                    Delete Slide
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSaveSlides}
            disabled={slidesSaving}
            className="px-6 py-3 bg-zoop-obsidian text-white rounded-xl font-black text-sm"
          >
            {slidesSaving ? "Saving Slides..." : "Save Slider Changes"}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-xl font-black text-zoop-obsidian">Sidebar Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Customer Sidebar Categories
              </label>
              <input
                value={config.customerSidebarCategories}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, customerSidebarCategories: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="Fashion, Electronics, Home"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Seller Panel Title
              </label>
              <input
                value={config.sellerPanelTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, sellerPanelTitle: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Admin Panel Title
              </label>
              <input
                value={config.adminPanelTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, adminPanelTitle: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Customer Sidebar Quick Links
              </label>
              <textarea
                value={config.customerSidebarQuickLinks}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, customerSidebarQuickLinks: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                rows={4}
                placeholder={"Your Orders|/history\nTrack Order|/track\nWishlist|/wishlist"}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-200 space-y-4">
          <h2 className="text-xl font-black text-zoop-obsidian">Maintenance Mode</h2>
          <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(config.maintenanceMode)}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
              }
            />
            Enable website maintenance for customers
          </label>
          <textarea
            value={config.maintenanceMessage}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            rows={3}
            placeholder="Maintenance message for customers"
          />
          <button
            type="button"
            onClick={handleMaintenanceSave}
            disabled={maintenanceSaving}
            className="px-6 py-3 bg-amber-500 text-black rounded-xl font-black text-sm"
          >
            {maintenanceSaving ? "Updating..." : "Apply Maintenance Settings"}
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
