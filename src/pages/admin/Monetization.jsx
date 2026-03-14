import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../services/api";
import { formatInrWithSymbol } from "../../utils/currency";

const isNotFoundError = (e) => {
  const msg = String(e?.message || "").toLowerCase();
  return e?.status === 404 || msg.includes("not found") || msg.includes("404") || msg.includes("route");
};

const fmtInr = (value, options = {}) => formatInrWithSymbol(value, options);
const amountCardClass = "mt-2 break-words text-[clamp(1.95rem,2vw,2.55rem)] font-black leading-none tracking-tight tabular-nums";

const Monetization = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState({ totals: {}, commissionStructure: [], payouts: [] });
  const [commission, setCommission] = useState([]);
  const [offers, setOffers] = useState([]);
  const [editingOffer, setEditingOffer] = useState(null);
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
        setOverview(data.value || { totals: {}, commissionStructure: [], payouts: [] });
        setCommission(Array.isArray(data.value?.commissionStructure) ? data.value.commissionStructure : []);
      } else if (data.status === "rejected" && isNotFoundError(data.reason)) {
        setApiUnavailable(true);
      }
      if (offerItems.status === "fulfilled") {
        setOffers(Array.isArray(offerItems.value) ? offerItems.value : []);
      }
      setError("");
    } catch (e) {
      if (isNotFoundError(e)) setApiUnavailable(true);
      else setError(e?.message || "Failed to load monetization data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visiblePayouts = useMemo(() => {
    const rows = Array.isArray(overview?.payouts) ? overview.payouts : [];
    if (payoutStatusFilter === "all") return rows;
    return rows.filter((row) => row.status === payoutStatusFilter);
  }, [overview, payoutStatusFilter]);

  const release = async (id) => {
    try {
      await adminApi.releasePayout(id);
      await load();
    } catch (e) {
      setError(e?.message || "Could not release payout");
    }
  };

  const deleteOffer = async (offer) => {
    if (!offer?.id) return;
    if (!window.confirm(`Remove offer "${offer.title || offer.code || offer.id}"?`)) return;
    try {
      await adminApi.deleteOffer(offer.id);
      if (editingOffer?.id === offer.id) setEditingOffer(null);
      await load();
    } catch (e) {
      setError(e?.message || "Could not remove offer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] p-6 lg:p-10 space-y-10 transition-colors duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-zoop-obsidian dark:text-white tracking-tight">Monetization Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Controlling revenue streams & settlements</p>
        </div>
      </div>

      {apiUnavailable && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 backdrop-blur-xl">
          <p className="font-black text-lg mb-1">Financial Engine Offline</p>
          <p className="text-sm font-medium">Real-time payouts are currently paused. Campaign management remains active.</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-black text-xl leading-none">×</button>
        </div>
      )}

      {/* Modern Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: "Revenue", value: overview?.totals?.totalRevenue, color: "text-zoop-obsidian dark:text-white" },
          { label: "Commission", value: overview?.totals?.totalCommission, color: "text-zoop-moss" },
          { label: "Pending", value: overview?.totals?.pendingTransfer, color: "text-amber-500" },
          { label: "Settling", value: overview?.totals?.awaitingSettlement, color: "text-sky-500" },
          { label: "On Hold", value: overview?.totals?.onHold, color: "text-rose-500" },
          { label: "Payouts", value: overview?.totals?.transferred, color: "text-emerald-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-white/5 rounded-[2rem] p-6 border border-gray-100 dark:border-white/10 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
            <p className={`text-2xl font-black tracking-tight tabular-nums ${stat.color}`}>
              {fmtInr(stat.value, { compact: true })}
            </p>
          </div>
        ))}
      </div>

      {/* Offers & Coupons Redesign */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white">Active Campaigns</h2>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Creator View */}
          <div className="xl:col-span-3 bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-white dark:border-white/10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-zoop-moss/10 rounded-full blur-3xl" />
             <h3 className="text-xl font-black text-zoop-obsidian dark:text-white mb-6">Create Campaign</h3>
             <div className="space-y-4">
               <input value={offerDraft.title} onChange={(e) => setOfferDraft({...offerDraft, title: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-bold text-sm" placeholder="Campaign Title (e.g. Summer Sale)" />
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input value={offerDraft.code} onChange={(e) => setOfferDraft({...offerDraft, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm" placeholder="COUPON_CODE (optional)" />
                 <input type="number" value={offerDraft.discountValue} onChange={(e) => setOfferDraft({...offerDraft, discountValue: Number(e.target.value || 0)})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm" placeholder="Discount value" />
                 <input type="number" value={offerDraft.minOrderAmount} onChange={(e) => setOfferDraft({...offerDraft, minOrderAmount: Number(e.target.value || 0)})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm" placeholder="Min order amount (e.g. 399)" />
                 <input type="number" value={offerDraft.maxDiscountAmount} onChange={(e) => setOfferDraft({...offerDraft, maxDiscountAmount: Number(e.target.value || 0)})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm" placeholder="Max discount cap (optional)" />
               </div>
               <textarea value={offerDraft.description} onChange={(e) => setOfferDraft({...offerDraft, description: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white text-sm" placeholder="Short description for customers..." rows={3} />
               <div className="grid grid-cols-2 gap-4">
                 <select value={offerDraft.discountType} onChange={(e) => setOfferDraft({...offerDraft, discountType: e.target.value})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl font-bold text-sm dark:text-white outline-none">
                   <option value="percent">% Percent</option>
                   <option value="flat">₹ Flat</option>
                 </select>
                 <select value={offerDraft.scope} onChange={(e) => setOfferDraft({...offerDraft, scope: e.target.value})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl font-bold text-sm dark:text-white outline-none">
                   <option value="order">Order Total</option>
                   <option value="shipping">Shipping</option>
                 </select>
               </div>
               <button onClick={async () => {
                 try {
                   await adminApi.createOffer(offerDraft);
                   setOfferDraft({ title: "", description: "", type: "coupon", discountType: "percent", discountValue: 10, code: "", minOrderAmount: 0, maxDiscountAmount: 0, scope: "order", active: true });
                   void load();
                 } catch (e) { setError(e.message); }
               }} 
               className="w-full py-4 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all">Launch Campaign</button>
             </div>
          </div>

          {/* Active List */}
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.length === 0 && (
              <div className="col-span-full py-20 text-center bg-gray-100/50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-2xl grayscale">🎫</div>
                <p className="text-gray-400 font-black tracking-widest uppercase text-xs">No Active Campaigns Found</p>
              </div>
            )}
            {offers.map((offer) => (
              <div key={offer.id} className={`group/offer relative p-1 rounded-[2.5rem] transition-all duration-700 ${offer.active ? "bg-gradient-to-br from-zoop-moss/40 to-zoop-moss/0 shadow-2xl" : "opacity-50 grayscale"}`}>
                <div className="bg-white dark:bg-[#0f0f10] p-8 rounded-[2.4rem] h-full relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-zoop-moss/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/offer:bg-zoop-moss/20 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-10 relative z-10 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit ${offer.type === "coupon" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                        {offer.type}
                      </div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{offer.scope} Scope</span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={async () => {
                        try {
                          await adminApi.updateOffer(offer.id, { ...offer, active: !offer.active });
                          void load();
                        } catch (e) { setError(e.message); }
                      }} className={`w-12 h-6 rounded-full relative transition-all duration-500 ${offer.active ? "bg-zoop-moss" : "bg-gray-200 dark:bg-white/10"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-500 ${offer.active ? "right-1" : "left-1"}`} />
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingOffer({ ...offer })}
                          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:text-zoop-moss transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOffer(offer)}
                          className="px-3 py-1 rounded-lg bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-500/15 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-zoop-obsidian dark:text-white leading-tight mb-2 group-hover/offer:text-zoop-moss transition-colors">{offer.title}</h4>
                    <p className="text-gray-500 text-xs font-medium mb-10 line-clamp-2">{offer.description || "No description provided for this campaign."}</p>
                    <div className="mb-8 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {Number(offer.minOrderAmount || 0) > 0 && (
                        <span className="px-3 py-1 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                          Min {fmtInr(offer.minOrderAmount, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                      {Number(offer.maxDiscountAmount || 0) > 0 && (
                        <span className="px-3 py-1 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                          Cap {fmtInr(offer.maxDiscountAmount, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between border-t border-dashed border-gray-100 dark:border-white/10 pt-8 mt-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">Platform Benefit</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-zoop-obsidian dark:text-white tracking-tighter">
                            {offer.discountType === "flat" ? "Rs. " : ""}{offer.discountValue}{offer.discountType === "percent" ? "%" : ""}
                          </span>
                          <span className="text-[10px] font-black text-zoop-moss uppercase">OFF</span>
                        </div>
                      </div>
                      
                      {offer.code && (
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 block">Copy Code</span>
                          <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl font-black text-sm dark:text-white border border-gray-100 dark:border-white/10 group-hover/offer:border-zoop-moss/30 transition-colors">
                            {offer.code}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingOffer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingOffer(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f0f10] rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white">Edit Campaign</h3>
                <p className="text-xs text-gray-500 mt-1">Update coupon/offer rules and visibility.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOffer(null)}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-black text-gray-600 dark:text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={editingOffer.title || ""}
                onChange={(e) => setEditingOffer((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-bold text-sm sm:col-span-2"
                placeholder="Title"
              />
              <input
                value={editingOffer.code || ""}
                onChange={(e) => setEditingOffer((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm"
                placeholder="Code (optional)"
              />
              <input
                type="number"
                value={Number(editingOffer.discountValue || 0)}
                onChange={(e) => setEditingOffer((p) => ({ ...p, discountValue: Number(e.target.value || 0) }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm"
                placeholder="Discount value"
              />
              <select
                value={editingOffer.discountType || "percent"}
                onChange={(e) => setEditingOffer((p) => ({ ...p, discountType: e.target.value }))}
                className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl font-bold text-sm dark:text-white outline-none"
              >
                <option value="percent">% Percent</option>
                <option value="flat">₹ Flat</option>
              </select>
              <select
                value={editingOffer.scope || "order"}
                onChange={(e) => setEditingOffer((p) => ({ ...p, scope: e.target.value }))}
                className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl font-bold text-sm dark:text-white outline-none"
              >
                <option value="order">Order Total</option>
                <option value="shipping">Shipping</option>
              </select>
              <input
                type="number"
                value={Number(editingOffer.minOrderAmount || 0)}
                onChange={(e) => setEditingOffer((p) => ({ ...p, minOrderAmount: Number(e.target.value || 0) }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm"
                placeholder="Min order amount"
              />
              <input
                type="number"
                value={Number(editingOffer.maxDiscountAmount || 0)}
                onChange={(e) => setEditingOffer((p) => ({ ...p, maxDiscountAmount: Number(e.target.value || 0) }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white font-black text-sm"
                placeholder="Max discount cap"
              />
              <textarea
                value={editingOffer.description || ""}
                onChange={(e) => setEditingOffer((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-zoop-moss p-4 rounded-2xl outline-none transition-all dark:text-white text-sm sm:col-span-2"
                placeholder="Description"
                rows={3}
              />
              <label className="flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-2xl sm:col-span-2">
                <input
                  type="checkbox"
                  checked={editingOffer.active !== false}
                  onChange={(e) => setEditingOffer((p) => ({ ...p, active: e.target.checked }))}
                />
                <span className="font-black text-xs uppercase tracking-widest text-gray-500">
                  Active
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => deleteOffer(editingOffer)}
                className="px-5 py-3 rounded-2xl bg-red-500/10 text-red-600 font-black text-xs uppercase tracking-widest"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSaving(true);
                    await adminApi.updateOffer(editingOffer.id, editingOffer);
                    setEditingOffer(null);
                    await load();
                  } catch (e) {
                    setError(e?.message || "Could not update offer");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian font-black text-xs uppercase tracking-widest disabled:opacity-60"
                disabled={saving || !editingOffer.title}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Table Section */}
      <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-white dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-black text-zoop-obsidian dark:text-white tracking-tight">Financial Ledger</h2>
              <p className="text-gray-500 mt-2">Historical and pending payout settlements</p>
            </div>
            <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-[1.5rem]">
              {["all", "PENDING_TRANSFER", "ON_HOLD", "TRANSFERRED"].map((tab) => (
                <button key={tab} onClick={() => setPayoutStatusFilter(tab)}
                  className={`px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${payoutStatusFilter === tab ? "bg-zoop-obsidian text-white dark:bg-zoop-moss dark:text-zoop-obsidian shadow-xl" : "text-gray-400 hover:text-zoop-obsidian dark:hover:text-white"}`}>
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Merchant</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Order ID</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Payout</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Status</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {visiblePayouts.map(p => (
                  <tr key={p.id} className="group hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-6">
                      <p className="font-black text-sm text-zoop-obsidian dark:text-white">{p.sellerName || "Merchant"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{p.sellerId.slice(0, 12)}...</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-xs font-mono">{p.displayOrderId || p.orderId.slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="font-black text-lg text-emerald-500 tracking-tight">{fmtInr(p.payoutAmount)}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${p.status === "TRANSFERRED" ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      {p.status === "PENDING_TRANSFER" ? (
                        <button onClick={() => release(p.id)} className="px-6 py-2.5 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian rounded-xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">Settle</button>
                      ) : <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Locked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monetization;
