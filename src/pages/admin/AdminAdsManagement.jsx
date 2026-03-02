import React, { useEffect, useState } from "react";
import { adminApi } from "../../services/api";

const AdminAdsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ slots: [], ads: [] });
  const [activeSlotFilter, setActiveSlotFilter] = useState("all");
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian uppercase">
          Ads Management
        </h1>
        <p className="text-gray-500 mt-1">Define slots, approve/publish ads, and control placement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h2 className="text-xl font-black text-zoop-obsidian">Ad Slots</h2>
          <input
            value={slotForm.id}
            onChange={(e) => setSlotForm((p) => ({ ...p, id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="slot id"
          />
          <input
            value={slotForm.name}
            onChange={(e) => setSlotForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="slot name"
          />
          <select
            value={slotForm.placement}
            onChange={(e) => setSlotForm((p) => ({ ...p, placement: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
          >
            {placementOptions.map((placement) => (
              <option key={placement} value={placement}>
                {placement}
              </option>
            ))}
          </select>
          <input
            value={slotForm.price}
            onChange={(e) => setSlotForm((p) => ({ ...p, price: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="Base slot price"
            type="number"
            min="0"
          />
          <input
            value={slotForm.description}
            onChange={(e) => setSlotForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="Slot description"
          />
          <button
            onClick={async () => {
              await adminApi.saveAdSlot(slotForm.id, {
                ...slotForm,
                price: Number(slotForm.price || 0),
              });
              await load();
            }}
            className="px-4 py-2 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase"
          >
            Save Slot
          </button>
          <div className="space-y-2 pt-2">
            {(data.slots || []).map((slot) => (
              <div key={slot.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <p className="font-bold text-zoop-obsidian">{slot.name}</p>
                <p className="text-xs text-gray-500">{slot.id} • {slot.placement}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Price: ₹{Number(slot.price || 0).toLocaleString("en-IN")} {slot.active ? "• Active" : "• Inactive"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h2 className="text-xl font-black text-zoop-obsidian">Publish Ad</h2>
          <input
            value={adForm.title}
            onChange={(e) => setAdForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="title"
          />
          <input
            value={adForm.mediaUrl}
            onChange={(e) => setAdForm((p) => ({ ...p, mediaUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="media URL"
          />
          <input
            value={adForm.targetUrl}
            onChange={(e) => setAdForm((p) => ({ ...p, targetUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            placeholder="target URL"
          />
          <select
            value={adForm.slotId}
            onChange={(e) => setAdForm((p) => ({ ...p, slotId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
          >
            {(data.slots || placementOptions.map((k) => ({ id: k, name: k }))).map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name}
              </option>
            ))}
          </select>
          <select
            value={adForm.status}
            onChange={(e) => setAdForm((p) => ({ ...p, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
          >
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
            onClick={async () => {
              await adminApi.createAd(adForm);
              await load();
            }}
            className="px-4 py-2 bg-zoop-moss text-zoop-obsidian rounded-xl font-black text-xs uppercase"
          >
            Publish Ad
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-black text-zoop-obsidian">All Ads</h2>
          <select
            value={activeSlotFilter}
            onChange={(e) => setActiveSlotFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl"
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
          <div className="space-y-2">
            {(data.ads || [])
              .filter((ad) => activeSlotFilter === "all" || ad.slotId === activeSlotFilter)
              .map((ad) => (
              <div key={ad.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="font-bold">{ad.title}</p>
                <p className="text-xs text-gray-500">{ad.slotId} • {ad.status} • {ad.active ? "active" : "inactive"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Paid: ₹{Number(ad.paidAmount || 0).toLocaleString("en-IN")} / Required: ₹
                  {Number(ad.requiredAmount || 0).toLocaleString("en-IN")}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <select
                    value={ad.slotId || "home_top"}
                    onChange={async (e) => {
                      await adminApi.updateAd(ad.id, { ...ad, slotId: e.target.value });
                      await load();
                    }}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    {(data.slots || []).map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      await adminApi.updateAd(ad.id, {
                        ...ad,
                        status: "PUBLISHED",
                        active: true,
                      });
                      await load();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-black uppercase"
                  >
                    Approve & Publish
                  </button>
                  <button
                    onClick={async () => {
                      await adminApi.updateAd(ad.id, {
                        ...ad,
                        status: "REJECTED",
                        active: false,
                      });
                      await load();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-black uppercase"
                  >
                    Reject
                  </button>
                  <button
                    onClick={async () => {
                      await adminApi.updateAd(ad.id, {
                        ...ad,
                        active: !ad.active,
                      });
                      await load();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-black uppercase"
                  >
                    {ad.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdsManagement;
