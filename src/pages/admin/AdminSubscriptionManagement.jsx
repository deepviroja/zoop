import React, { useEffect, useState } from "react";
import { adminApi } from "../../services/api";

const AdminSubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    durationDays: 30,
    sidebarColor: "#111827",
    featuresText: "",
  });

  const load = async () => {
    const data = await adminApi.getSubscriptionPlans();
    setPlans(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
          Subscription Management
        </h1>
        <p className="text-gray-500 mt-1">Create/manage seller plans and feature limits.</p>
      </div>

      <div className="bg-white dark:glass-card rounded-2xl border border-gray-100 dark:border-white/10 p-6 space-y-3">
        <h2 className="text-xl font-black text-zoop-obsidian dark:text-white">Create Plan</h2>
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
        </div>
        <textarea
          value={form.featuresText}
          onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl"
          placeholder="Features, one per line"
        />
        <button
          onClick={async () => {
            await adminApi.createSubscriptionPlan({
              name: form.name,
              price: form.price,
              durationDays: form.durationDays,
              sidebarColor: form.sidebarColor,
              features: form.featuresText
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean),
            });
            setForm({ name: "", price: 0, durationDays: 30, sidebarColor: "#111827", featuresText: "" });
            await load();
          }}
          className="px-5 py-2.5 bg-zoop-obsidian text-white rounded-xl font-black text-xs uppercase"
        >
          Save Plan
        </button>
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
            <ul className="mt-3 space-y-1">
              {(plan.features || []).map((f, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                  • {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubscriptionManagement;
