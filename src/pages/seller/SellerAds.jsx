import React, { useEffect, useState } from "react";
import { sellerApi } from "../../services/api";
import { apiClient } from "../../api/client";

const SellerAds = () => {
  const [ads, setAds] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    mediaUrl: "",
    mediaType: "image",
    targetUrl: "",
    slotId: "home_top",
    paidAmount: "",
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, slotList] = await Promise.all([
        sellerApi.getMyAds(),
        sellerApi.getAdSlots().catch(() => []),
      ]);
      setAds(Array.isArray(list) ? list : []);
      const normalizedSlots = Array.isArray(slotList) ? slotList : [];
      setSlots(normalizedSlots);
      if (normalizedSlots.length > 0) {
        setForm((prev) => ({ ...prev, slotId: normalizedSlots[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadMedia = async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const fd = new FormData();
    fd.append(isVideo ? "video" : "image", file);
    setUploading(true);
    try {
      const result = await apiClient.postForm(isVideo ? "/upload/video" : "/upload", fd);
      setForm((p) => ({
        ...p,
        mediaUrl: result?.url || "",
        mediaType: isVideo ? "video" : "image",
      }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
          Seller Ads
        </h1>
        <p className="text-gray-500 mt-1">Submit ad image/video creatives for admin approval.</p>
      </div>

      <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
        <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Create Ad</h2>
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          placeholder="Campaign title"
        />
        <input
          value={form.targetUrl}
          onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          placeholder="Target URL (/product/123 or https://...)"
        />
        <select
          value={form.slotId}
          onChange={(e) => setForm((p) => ({ ...p, slotId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
        >
          {slots.length === 0 && <option value="home_top">Home Top</option>}
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.name} ({slot.placement}) - Rs. {Number(slot.price || 0).toLocaleString("en-IN")}
            </option>
          ))}
        </select>
        <input
          value={form.paidAmount}
          onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          placeholder="Amount paid (as per admin slot price)"
          type="number"
          min="0"
        />

        <label className="block border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 dark:bg-white/5 cursor-pointer">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {uploading ? "Uploading..." : form.mediaUrl ? "Media selected" : "Upload image/video"}
          </p>
          <p className="text-xs text-gray-500 mt-1">PNG/JPG/WebP or MP4/WebM/MOV</p>
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => uploadMedia(e.target.files?.[0])}
          />
        </label>
        {form.mediaUrl && (
          <p className="text-xs text-gray-500 break-all">Media URL: {form.mediaUrl}</p>
        )}

        <button
          onClick={async () => {
            await sellerApi.createMyAd(form);
            setForm((prev) => ({ ...prev, title: "", mediaUrl: "", mediaType: "image", targetUrl: "", paidAmount: "" }));
            await load();
          }}
          disabled={!form.title || !form.mediaUrl || Number(form.paidAmount || 0) < 0}
          className="px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase disabled:opacity-60"
        >
          Submit for Approval
        </button>
      </div>

      <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6">
        <h2 className="text-xl font-black text-zoop-obsidian dark:text-white mb-4">My Ads</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : ads.length === 0 ? (
          <p className="text-gray-500">No ads submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <p className="font-bold text-zoop-obsidian dark:text-white">{ad.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Slot: {ad.slotId} • Status: {ad.status} • {ad.active ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Paid: Rs. {Number(ad.paidAmount || 0).toLocaleString("en-IN")} / Required: Rs.
                  {Number(ad.requiredAmount || 0).toLocaleString("en-IN")}
                </p>
                {ad.mediaUrl && (
                  <a
                    href={ad.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-zoop-moss hover:underline"
                  >
                    View media
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerAds;
