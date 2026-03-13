import React, { useEffect, useState } from "react";
import { sellerApi } from "../../services/api";
import { apiClient } from "../../api/client";
import { useSiteConfig } from "../../context/SiteConfigContext";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SellerAds = () => {
  const { brandName } = useSiteConfig();
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
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
                  {slot.name} ({slot.placement}) - Rs.{" "}
                  {Number(slot.price || 0).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
            <input
              value={form.paidAmount}
              onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
              placeholder="Amount paid (as per slot price)"
              type="number"
              min="0"
            />
          </div>

          <div className="space-y-3">
            <label className="block border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 dark:bg-white/5 cursor-pointer">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {uploading
                  ? "Uploading..."
                  : form.mediaUrl
                    ? "Media selected"
                    : "Upload image/video"}
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
              <p className="text-xs text-gray-500 break-all">
                Media URL: {form.mediaUrl}
              </p>
            )}

            <button
              onClick={async () => {
                const selectedSlot = slots.find((s) => s.id === form.slotId);
                const required = Math.max(0, Number(selectedSlot?.price || 0));

                // Use Razorpay checkout when there is a price configured for the slot.
                if (required > 0) {
                  const sdkLoaded = await loadRazorpayCheckoutScript();
                  if (!sdkLoaded || !window.Razorpay) {
                    throw new Error("Could not load Razorpay checkout. Please try again.");
                  }

                  const paymentOrderResponse = await sellerApi.createAdRazorpayOrder({
                    title: form.title,
                    mediaUrl: form.mediaUrl,
                    mediaType: form.mediaType,
                    targetUrl: form.targetUrl,
                    slotId: form.slotId,
                  });

                  const keyId = paymentOrderResponse?.keyId;
                  const razorpayOrder = paymentOrderResponse?.order;
                  if (!keyId || !razorpayOrder?.id) {
                    throw new Error("Could not start ad payment.");
                  }

                  const paymentResult = await new Promise((resolve, reject) => {
                    const rzp = new window.Razorpay({
                      key: keyId,
                      amount: razorpayOrder.amount,
                      currency: razorpayOrder.currency || "INR",
                      name: brandName || "Zoop",
                      description: "Ad Campaign Payment",
                      order_id: razorpayOrder.id,
                      notes: razorpayOrder.notes || {},
                      theme: { color: "#a3e635" },
                      handler: (payment) => resolve(payment),
                      modal: {
                        ondismiss: () => reject(new Error("Payment cancelled by user")),
                      },
                    });
                    rzp.on("payment.failed", (resp) => {
                      const reason =
                        resp?.error?.description ||
                        resp?.error?.reason ||
                        "Payment failed";
                      reject(new Error(reason));
                    });
                    rzp.open();
                  });

                  await sellerApi.verifyAdRazorpayPayment({
                    razorpayOrderId: paymentResult.razorpay_order_id,
                    razorpayPaymentId: paymentResult.razorpay_payment_id,
                    razorpaySignature: paymentResult.razorpay_signature,
                  });

                  setForm((prev) => ({
                    ...prev,
                    title: "",
                    mediaUrl: "",
                    mediaType: "image",
                    targetUrl: "",
                    paidAmount: "",
                  }));
                  await load();
                  return;
                }

                // Fallback: legacy manual amount entry (kept for backward compatibility)
                await sellerApi.createMyAd(form);
                setForm((prev) => ({
                  ...prev,
                  title: "",
                  mediaUrl: "",
                  mediaType: "image",
                  targetUrl: "",
                  paidAmount: "",
                }));
                await load();
              }}
              disabled={!form.title || !form.mediaUrl}
              className="w-full px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase disabled:opacity-60"
            >
              Submit for Approval
            </button>
          </div>
        </div>
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
