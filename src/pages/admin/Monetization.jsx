import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/api";
import { formatInrWithSymbol } from "../../utils/currency";

const isNotFoundError = (e) => {
  const msg = String(e?.message || "").toLowerCase();
  return (
    e?.status === 404 ||
    msg.includes("not found") ||
    msg.includes("404") ||
    msg.includes("route")
  );
};

const fmtInr = (value, options = {}) => formatInrWithSymbol(value, options);
const amountCardClass =
  "mt-2 break-words text-[clamp(1.95rem,2vw,2.55rem)] font-black leading-none tracking-tight tabular-nums";

const Monetization = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState({
    totals: {},
    commissionStructure: [],
    payouts: [],
  });
  const [commission, setCommission] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offerDraft, setOfferDraft] = useState({
    title: "",
    description: "",
    type: "coupon",
    discountType: "percent",
    discountValue: 10,
    code: "",
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    scope: "order",
    active: true,
  });
  const [error, setError] = useState("");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("all");

  const [apiUnavailable, setApiUnavailable] = useState(false);

  const load = async () => {
    setLoading(true);
    setApiUnavailable(false);
    try {
      const [data, offerItems] = await Promise.allSettled([
        adminApi.getMonetizationOverview(),
        adminApi.getOffers(),
      ]);
      if (data.status === "fulfilled" && data.value) {
        setOverview(
          data.value || { totals: {}, commissionStructure: [], payouts: [] },
        );
        setCommission(
          Array.isArray(data.value?.commissionStructure)
            ? data.value.commissionStructure
            : [],
        );
      } else if (data.status === "rejected" && isNotFoundError(data.reason)) {
        setApiUnavailable(true);
      } else if (data.status === "rejected") {
        setError(data.reason?.message || "Failed to load monetization data");
      }
      if (offerItems.status === "fulfilled") {
        setOffers(Array.isArray(offerItems.value) ? offerItems.value : []);
      }
      setError("");
    } catch (e) {
      if (isNotFoundError(e)) {
        setApiUnavailable(true);
      } else {
        setError(e?.message || "Failed to load monetization data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const payoutRows = useMemo(
    () => (Array.isArray(overview?.payouts) ? overview.payouts : []),
    [overview],
  );
  const visiblePayouts = useMemo(() => {
    if (payoutStatusFilter === "all") return payoutRows;
    return payoutRows.filter((row) => row.status === payoutStatusFilter);
  }, [payoutRows, payoutStatusFilter]);

  const saveCommission = async () => {
    setSaving(true);
    try {
      await adminApi.updateCommissionStructure(commission);
      await load();
    } catch (e) {
      setError(e?.message || "Could not save commission structure");
    } finally {
      setSaving(false);
    }
  };

  const release = async (id) => {
    try {
      await adminApi.releasePayout(id);
      await load();
    } catch (e) {
      setError(e?.message || "Could not release payout");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
          Monetization Hub
        </h1>
        <p className="text-gray-500 mt-1">
          Commission, revenue, and payout transfer control.
        </p>
      </div>

      {apiUnavailable && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
          <p className="font-black text-base mb-1">
            Monetization API not yet available
          </p>
          <p className="text-sm font-medium">
            The backend monetization endpoint is not set up yet. Offers &amp;
            coupon management is still available below.
          </p>
        </div>
      )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Total Revenue
          </p>
          <p className={`${amountCardClass} text-zoop-obsidian dark:text-white`}>
            {fmtInr(overview?.totals?.totalRevenue, { compact: true })}
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Total Commission
          </p>
          <p className={`${amountCardClass} text-zoop-moss`}>
            {fmtInr(overview?.totals?.totalCommission, { compact: true })}
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Pending Transfer
          </p>
          <p className={`${amountCardClass} text-amber-600`}>
            {fmtInr(overview?.totals?.pendingTransfer, { compact: true })}
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Awaiting Settlement
          </p>
          <p className={`${amountCardClass} text-sky-600`}>
            {fmtInr(overview?.totals?.awaitingSettlement, { compact: true })}
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            On Hold
          </p>
          <p className={`${amountCardClass} text-rose-600`}>
            {fmtInr(overview?.totals?.onHold, { compact: true })}
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-5 border border-gray-100 dark:border-white/10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Transferred
          </p>
          <p className={`${amountCardClass} text-green-600`}>
            {fmtInr(overview?.totals?.transferred, { compact: true })}
          </p>
        </div>
      </div>

      <div className="bg-white dark:glass-card rounded-3xl border border-gray-100 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white">
            Commission Structure
          </h2>
          <button
            onClick={() =>
              setCommission((prev) => [
                ...prev,
                { categoryId: "", categoryName: "", commissionPercent: 0 },
              ])
            }
            className="px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg font-black text-xs uppercase"
          >
            Add Row
          </button>
        </div>
        <div className="space-y-3">
          {commission.map((row, idx) => (
            <div
              key={`${row.categoryId}-${idx}`}
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
            >
              <input
                value={row.categoryId || ""}
                onChange={(e) =>
                  setCommission((prev) =>
                    prev.map((p, i) =>
                      i === idx ? { ...p, categoryId: e.target.value } : p,
                    ),
                  )
                }
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
                placeholder="category id (e.g. electronics)"
              />
              <input
                value={row.categoryName || ""}
                onChange={(e) =>
                  setCommission((prev) =>
                    prev.map((p, i) =>
                      i === idx ? { ...p, categoryName: e.target.value } : p,
                    ),
                  )
                }
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
                placeholder="category name"
              />
              <input
                type="number"
                value={row.commissionPercent || 0}
                onChange={(e) =>
                  setCommission((prev) =>
                    prev.map((p, i) =>
                      i === idx
                        ? {
                            ...p,
                            commissionPercent: Number(e.target.value || 0),
                          }
                        : p,
                    ),
                  )
                }
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
                placeholder="commission %"
              />
              <button
                onClick={() =>
                  setCommission((prev) => prev.filter((_, i) => i !== idx))
                }
                className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={saveCommission}
          disabled={saving}
          className="mt-4 px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-sm"
        >
          {saving ? "Saving..." : "Save Commission Structure"}
        </button>
      </div>

      <div className="bg-white dark:glass-card rounded-3xl border border-gray-100 dark:border-white/10 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white">
              Offers & Coupons
            </h2>
            <p className="text-sm text-gray-500">
              Manage checkout discounts shown to customers.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={offerDraft.title}
            onChange={(e) =>
              setOfferDraft((p) => ({ ...p, title: e.target.value }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Offer title"
          />
          <input
            value={offerDraft.code}
            onChange={(e) =>
              setOfferDraft((p) => ({
                ...p,
                code: e.target.value.toUpperCase(),
              }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Coupon code"
          />
          <input
            value={offerDraft.description}
            onChange={(e) =>
              setOfferDraft((p) => ({ ...p, description: e.target.value }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl md:col-span-2"
            placeholder="Short description"
          />
          <select
            value={offerDraft.type}
            onChange={(e) =>
              setOfferDraft((p) => ({ ...p, type: e.target.value }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <option value="coupon">Coupon</option>
            <option value="offer">Offer</option>
          </select>
          <select
            value={offerDraft.discountType}
            onChange={(e) =>
              setOfferDraft((p) => ({ ...p, discountType: e.target.value }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
          <input
            type="number"
            value={offerDraft.discountValue}
            onChange={(e) =>
              setOfferDraft((p) => ({
                ...p,
                discountValue: Number(e.target.value || 0),
              }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Discount value"
          />
          <input
            type="number"
            value={offerDraft.minOrderAmount}
            onChange={(e) =>
              setOfferDraft((p) => ({
                ...p,
                minOrderAmount: Number(e.target.value || 0),
              }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Minimum order amount"
          />
          <input
            type="number"
            value={offerDraft.maxDiscountAmount}
            onChange={(e) =>
              setOfferDraft((p) => ({
                ...p,
                maxDiscountAmount: Number(e.target.value || 0),
              }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Max discount amount"
          />
          <select
            value={offerDraft.scope}
            onChange={(e) =>
              setOfferDraft((p) => ({ ...p, scope: e.target.value }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <option value="order">Order</option>
            <option value="shipping">Shipping</option>
          </select>
        </div>
        <button
          onClick={async () => {
            try {
              await adminApi.createOffer(offerDraft);
              setOfferDraft({
                title: "",
                description: "",
                type: "coupon",
                discountType: "percent",
                discountValue: 10,
                code: "",
                minOrderAmount: 0,
                maxDiscountAmount: 0,
                scope: "order",
                active: true,
              });
              await load();
            } catch (e) {
              setError(e?.message || "Could not save offer");
            }
          }}
          className="mt-4 px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-sm"
        >
          Save Offer
        </button>
        <div className="mt-6 space-y-3">
          {offers.length === 0 && !loading && (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              No offers or coupons yet.
            </p>
          )}
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-zoop-obsidian dark:text-white">
                    {offer.title} {offer.code ? `(${offer.code})` : ""}
                  </p>
                  <p className="text-sm text-gray-500">{offer.description}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8b5e3c]">
                    {offer.discountType === "flat"
                      ? `Flat ${fmtInr(offer.discountValue, {
                          maximumFractionDigits: 0,
                        })}`
                      : `${offer.discountValue}% off`}{" "}
                    • {offer.scope || "order"} • Min{" "}
                    {fmtInr(offer.minOrderAmount || 0, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await adminApi.updateOffer(offer.id, {
                          ...offer,
                          active: !offer.active,
                        });
                        await load();
                      } catch (e) {
                        setError(e?.message || "Could not update offer");
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${offer.active ? "bg-green-50 text-green-700" : "bg-gray-200 dark:bg-white/20 text-gray-700 dark:text-gray-300"}`}
                  >
                    {offer.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:glass-card rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white">
                Seller Payouts
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Waiting, transferred, and held payouts in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "PENDING_TRANSFER", label: "Pending Transfer" },
                { id: "AWAITING_SETTLEMENT", label: "Awaiting Settlement" },
                { id: "ON_HOLD", label: "On Hold" },
                { id: "TRANSFERRED", label: "Transferred" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPayoutStatusFilter(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                    payoutStatusFilter === tab.id
                      ? "bg-zoop-obsidian text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading ? (
          <p className="p-6 text-gray-500 font-bold">Loading...</p>
        ) : visiblePayouts.length === 0 ? (
          <p className="p-6 text-gray-500 font-bold">No payout records yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-gap">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  {[
                    "Payout ID",
                    "Seller",
                    "Customer",
                    "Order",
                    "Product",
                    "Payout Amount",
                    "Status",
                    "Available / Released",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiblePayouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zoop-obsidian dark:text-white">{p.id}</p>
                      {p.transferRef && (
                        <p className="text-xs text-gray-500">{p.transferRef}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-bold text-zoop-obsidian dark:text-white">
                        {p.sellerName || p.sellerId}
                      </p>
                      <p className="text-xs text-gray-500">{p.sellerId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-bold text-zoop-obsidian dark:text-white">
                        {p.customer?.name || "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.customer?.email || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-bold text-zoop-obsidian dark:text-white">
                        {p.displayOrderId || p.orderId}
                      </p>
                      <p className="text-xs text-gray-500">{p.orderId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-bold text-zoop-obsidian dark:text-white">
                        {p.productTitle || p.productId}
                      </p>
                      <p className="text-xs text-gray-500">{p.productId}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-zoop-moss">
                      <span className="tabular-nums">{fmtInr(p.payoutAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          p.status === "PENDING_TRANSFER"
                            ? "bg-amber-100 text-amber-700"
                            : p.status === "AWAITING_SETTLEMENT"
                              ? "bg-sky-100 text-sky-700"
                              : p.status === "ON_HOLD"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {String(p.status || "").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.status === "TRANSFERRED"
                        ? p.releasedAt
                          ? new Date(p.releasedAt).toLocaleString()
                          : "Released"
                        : p.availableAt
                          ? new Date(p.availableAt).toLocaleString()
                          : p.holdReason || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === "PENDING_TRANSFER" ? (
                        <button
                          onClick={() => release(p.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-black uppercase"
                        >
                          Release
                        </button>
                      ) : p.status === "TRANSFERRED" ? (
                        <span className="text-xs font-bold text-green-600">
                          Released
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          Waiting
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monetization;
