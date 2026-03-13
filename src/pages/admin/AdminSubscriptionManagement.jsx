import React, { useEffect, useState } from "react";
import { adminApi } from "../../services/api";

const AdminSubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: 0,
    durationDays: 30,
    sidebarColor: "#111827",
    featuresText: "",
    commissionPercent: 0,
    productAddLimit: 0,
    adCampaignLimit: 0,
  });

  const load = async () => {
    const data = await adminApi.getSubscriptionPlans();
    setPlans(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId("");
    setForm({
      name: "",
      price: 0,
      durationDays: 30,
      sidebarColor: "#111827",
      featuresText: "",
      commissionPercent: 0,
      productAddLimit: 0,
      adCampaignLimit: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
          Subscription Management
        </h1>
        <p className="text-gray-500 mt-1">Create/manage seller plans and feature limits.</p>
      </div>

      <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">
            {editingId ? "Edit Plan" : "Create Plan"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-zoop-moss"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Plan name"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value || 0) }))}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Price"
          />
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm((p) => ({ ...p, durationDays: Number(e.target.value || 30) }))}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Duration Days"
          />
          <input
            value={form.sidebarColor}
            onChange={(e) => setForm((p) => ({ ...p, sidebarColor: e.target.value }))}
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Sidebar color hex"
          />
          <input
            type="number"
            value={form.commissionPercent}
            onChange={(e) =>
              setForm((p) => ({ ...p, commissionPercent: Number(e.target.value || 0) }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Commission % (e.g. 5)"
            min="0"
            max="99"
          />
          <input
            type="number"
            value={form.productAddLimit}
            onChange={(e) =>
              setForm((p) => ({ ...p, productAddLimit: Number(e.target.value || 0) }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
            placeholder="Product add limit (0 = unlimited)"
            min="0"
          />
          <input
            type="number"
            value={form.adCampaignLimit}
            onChange={(e) =>
              setForm((p) => ({ ...p, adCampaignLimit: Number(e.target.value || 0) }))
            }
            className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl md:col-span-2"
            placeholder="Ad campaigns per period (0 = unlimited)"
            min="0"
          />
        </div>
        <textarea
          value={form.featuresText}
          onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          placeholder="Features, one per line"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={async () => {
              const payload = {
                name: form.name,
                price: form.price,
                durationDays: form.durationDays,
                sidebarColor: form.sidebarColor,
                features: form.featuresText
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
                featureLimits: {
                  commissionPercent: Number(form.commissionPercent || 0),
                  productAddLimit: Number(form.productAddLimit || 0),
                  adCampaignLimit: Number(form.adCampaignLimit || 0),
                },
              };

              if (editingId) {
                await adminApi.updateSubscriptionPlan(editingId, payload);
              } else {
                await adminApi.createSubscriptionPlan(payload);
              }

              resetForm();
              await load();
            }}
            className="px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase"
          >
            {editingId ? "Update Plan" : "Save Plan"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-zoop-obsidian dark:text-white">{plan.name}</h3>
              <span className="text-xs font-black text-gray-400">{plan.durationDays} days</span>
            </div>
            <p className="text-2xl font-black mt-2">Rs. {Number(plan.price || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-500 mt-1">Sidebar Color: {plan.sidebarColor || "-"}</p>
            <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-400">
              <p>
                Commission:{" "}
                <span className="font-black text-zoop-obsidian dark:text-white">
                  {Number(plan?.featureLimits?.commissionPercent || 0)}%
                </span>
              </p>
              <p>
                Product add limit:{" "}
                <span className="font-black text-zoop-obsidian dark:text-white">
                  {Number(plan?.featureLimits?.productAddLimit || 0) || "Unlimited"}
                </span>
              </p>
              <p>
                Ad campaigns/period:{" "}
                <span className="font-black text-zoop-obsidian dark:text-white">
                  {Number(plan?.featureLimits?.adCampaignLimit || 0) || "Unlimited"}
                </span>
              </p>
            </div>
            <ul className="mt-3 space-y-1">
              {(plan.features || []).map((f, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                  • {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(plan.id);
                  setForm({
                    name: plan.name || "",
                    price: Number(plan.price || 0),
                    durationDays: Number(plan.durationDays || 30),
                    sidebarColor: plan.sidebarColor || "#111827",
                    featuresText: Array.isArray(plan.features) ? plan.features.join("\n") : "",
                    commissionPercent: Number(plan?.featureLimits?.commissionPercent || 0),
                    productAddLimit: Number(plan?.featureLimits?.productAddLimit || 0),
                    adCampaignLimit: Number(plan?.featureLimits?.adCampaignLimit || 0),
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  // eslint-disable-next-line no-alert
                  const ok = window.confirm(`Delete plan "${plan.name}"?`);
                  if (!ok) return;
                  await adminApi.deleteSubscriptionPlan(plan.id);
                  if (editingId === plan.id) resetForm();
                  await load();
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubscriptionManagement;
