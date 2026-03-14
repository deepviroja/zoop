import React, { useEffect, useState } from "react";
import { adminApi } from "../../services/api";
import { ImageUpload } from "../../components/common/ImageUpload";

const AdCard = ({ ad, load, setError, handleDeleteAd }) => {
  const [duration, setDuration] = useState(7);
  const isExpired = ad.expiresAt && new Date().getTime() > ad.expiresAt;

  useEffect(() => {
    if (isExpired && ad.status === "PUBLISHED") {
      adminApi
        .deleteAd(ad.id)
        .then(load)
        .catch(() => {});
    }
  }, [isExpired, ad.id, ad.status, load]);

  if (isExpired && ad.status === "PUBLISHED") return null;

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:glass-card border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden hover:shadow-xl transition-shadow">
      {ad.mediaUrl ? (
        <div className="h-40 w-full bg-gray-100 dark:bg-white/10 relative">
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${ad.active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}
            >
              {ad.active ? "Active" : "Inactive"}
            </span>
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${ad.status === "PUBLISHED" ? "bg-blue-500 text-white" : ad.status === "REJECTED" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}`}
            >
              {ad.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-40 w-full bg-zoop-obsidian flex items-center justify-center relative">
          <span className="text-white/50 font-black tracking-widest uppercase">
            No Media
          </span>
          <div className="absolute top-2 right-2 flex gap-2">
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${ad.active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}
            >
              {ad.active ? "Active" : "Inactive"}
            </span>
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${ad.status === "PUBLISHED" ? "bg-blue-500 text-white" : ad.status === "REJECTED" ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}`}
            >
              {ad.status}
            </span>
          </div>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-900 text-lg text-zoop-obsidian dark:text-white leading-tight mb-1 line-clamp-1">
          {ad.title}
        </h3>
        <p className="text-xs text-gray-400 font-bold mb-3">{ad.slotId}</p>

        {ad.status === "PUBLISHED" && ad.expiresAt && (
          <p className="text-xs text-gray-500 font-medium mb-3 bg-blue-50/50 p-2 rounded-lg">
            Expires: {new Date(ad.expiresAt).toLocaleDateString()}
          </p>
        )}

        <div className="mt-auto space-y-3">
          {ad.status !== "PUBLISHED" && (
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                Approval Duration (Days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:glass-card focus:outline-none focus:border-zoop-moss"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={async () => {
                    try {
                      const expiresAt =
                        new Date().getTime() + duration * 24 * 60 * 60 * 1000;
                      await adminApi.updateAd(ad.id, {
                        ...ad,
                        status: "PUBLISHED",
                        active: true,
                        expiresAt,
                      });
                      await load();
                    } catch (err) {
                      setError(err?.message || "Failed to approve ad");
                    }
                  }}
                  className="flex-1 px-3 py-2 border-2 border-green-500 text-green-600 rounded-lg font-black text-xs uppercase hover:bg-green-50 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={async () => {
                    try {
                      await adminApi.updateAd(ad.id, {
                        ...ad,
                        status: "REJECTED",
                        active: false,
                      });
                      await load();
                    } catch (err) {
                      setError(err?.message || "Failed to reject ad");
                    }
                  }}
                  className="flex-1 px-3 py-2 border-2 border-red-500 text-red-600 rounded-lg font-black text-xs uppercase hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
            {ad.status === "PUBLISHED" && (
              <button
                onClick={async () => {
                  try {
                    await adminApi.updateAd(ad.id, {
                      ...ad,
                      active: !ad.active,
                    });
                    await load();
                  } catch (err) {
                    setError(err?.message || "Failed to toggle ad");
                  }
                }}
                className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-colors ${ad.active ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
              >
                {ad.active ? "Pause" : "Resume"}
              </button>
            )}
            <button
              onClick={() => handleDeleteAd(ad.id)}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-red-600 text-[10px] font-black uppercase hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAdsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ slots: [], ads: [] });
  const [activeSlotFilter, setActiveSlotFilter] = useState("all");
  const [error, setError] = useState("");
  const [slotForm, setSlotForm] = useState({
    id: "home_top",
    name: "Home Top",
    placement: "home_top",
    price: 2500,
    description: "",
    active: true,
  });
  const [adForm, setAdForm] = useState({
    title: "",
    mediaUrl: "",
    mediaType: "image",
    targetUrl: "",
    slotId: "home_top",
    active: true,
    status: "PUBLISHED",
  });
  const placementOptions = [
    "home_top",
    "home_mid",
    "home_bottom",
    "search_sidebar",
    "product_detail",
  ];

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAds();
      setData(res || { slots: [], ads: [] });
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load ads data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm(`Remove ad slot "${slotId}"? This cannot be undone.`))
      return;
    try {
      await adminApi.deleteAdSlot(slotId);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to remove slot");
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Remove this ad?")) return;
    try {
      await adminApi.deleteAd(adId);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to remove ad");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
          Ads Management
        </h1>
        <p className="text-gray-500 mt-1">
          Define slots, approve/publish ads, and control placement.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-bold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-700 font-black text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- AD SLOTS FORM --- */}
        <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Ad Slots</h2>
          <input
            value={slotForm.id}
            onChange={(e) => setSlotForm((p) => ({ ...p, id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="slot id"
          />
          <input
            value={slotForm.name}
            onChange={(e) =>
              setSlotForm((p) => ({ ...p, name: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="slot name"
          />
          <select
            value={slotForm.placement}
            onChange={(e) =>
              setSlotForm((p) => ({ ...p, placement: e.target.value }))
            }
            aria-label="Select ad slot placement"
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            {placementOptions.map((placement) => (
              <option key={placement} value={placement}>
                {placement}
              </option>
            ))}
          </select>
          <input
            value={slotForm.price}
            onChange={(e) =>
              setSlotForm((p) => ({ ...p, price: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Base slot price"
            type="number"
            min="0"
          />
          <input
            value={slotForm.description}
            onChange={(e) =>
              setSlotForm((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Slot description"
          />
          <button
            onClick={async () => {
              try {
                await adminApi.saveAdSlot(slotForm.id, {
                  ...slotForm,
                  price: Number(slotForm.price || 0),
                });
                await load();
              } catch (e) {
                setError(e?.message || "Failed to save slot");
              }
            }}
            className="px-4 py-2 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase"
          >
            Save Slot
          </button>

          {/* --- EXISTING SLOTS LIST --- */}
          <div className="space-y-2 pt-2">
            {(data.slots || []).length === 0 && !loading && (
              <p className="text-sm text-gray-400 italic">
                No slots defined yet.
              </p>
            )}
            {(data.slots || []).map((slot) => (
              <div
                key={slot.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zoop-obsidian dark:text-white">{slot.name}</p>
                  <p className="text-xs text-gray-500">
                    {slot.id} • {slot.placement}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Price: Rs. {Number(slot.price || 0).toLocaleString("en-IN")}{" "}
                    {slot.active ? "• Active" : "• Inactive"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-black uppercase hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* --- PUBLISH AD FORM --- */}
        <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Publish Ad</h2>
          <input
            value={adForm.title}
            onChange={(e) =>
              setAdForm((p) => ({ ...p, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="title"
          />
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              Ad Media (image/video)
            </p>
            <ImageUpload
              maxFiles={1}
              initialUrls={adForm.mediaUrl ? [adForm.mediaUrl] : []}
              onUpload={(urls) =>
                setAdForm((p) => ({ ...p, mediaUrl: urls?.[0] || "" }))
              }
            />
          </div>
          <input
            value={adForm.targetUrl}
            onChange={(e) =>
              setAdForm((p) => ({ ...p, targetUrl: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="target URL"
          />
          <select
            value={adForm.slotId}
            onChange={(e) =>
              setAdForm((p) => ({ ...p, slotId: e.target.value }))
            }
            aria-label="Select ad slot"
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            {(
              data.slots || placementOptions.map((k) => ({ id: k, name: k }))
            ).map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name}
              </option>
            ))}
          </select>
          <select
            value={adForm.status}
            onChange={(e) =>
              setAdForm((p) => ({ ...p, status: e.target.value }))
            }
            aria-label="Select ad status"
            className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
            onClick={async () => {
              try {
                await adminApi.createAd(adForm);
                await load();
              } catch (e) {
                setError(e?.message || "Failed to publish ad");
              }
            }}
            className="px-4 py-2 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black text-xs uppercase"
          >
            Publish Ad
          </button>
        </div>
      </div>

      {/* --- ALL ADS --- */}
      <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">All Ads</h2>
          <select
            value={activeSlotFilter}
            onChange={(e) => setActiveSlotFilter(e.target.value)}
            aria-label="Filter ads by slot"
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <option value="all">All Slots</option>
            {(data.slots || []).map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(data.ads || [])
              .filter(
                (ad) =>
                  activeSlotFilter === "all" || ad.slotId === activeSlotFilter,
              )
              .map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  load={load}
                  setError={setError}
                  handleDeleteAd={handleDeleteAd}
                />
              ))}
            {(data.ads || []).filter(
              (ad) =>
                activeSlotFilter === "all" || ad.slotId === activeSlotFilter,
            ).length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 border-dashed">
                <p className="text-gray-400 font-bold">No ads found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdsManagement;
