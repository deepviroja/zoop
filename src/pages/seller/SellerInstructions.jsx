import React from "react";

const points = [
  {
    title: "Complete your store profile first",
    desc: "Keep business details, bank info, PAN/GST, and contact details updated so your payouts and approvals are not blocked.",
  },
  {
    title: "Publish clean product data",
    desc: "Use clear titles, accurate category, stock, and pricing. Upload a good thumbnail and keep quantity updated daily.",
  },
  {
    title: "Manage orders every day",
    desc: "Process pending orders quickly, update statuses correctly, and respond to return requests within the return window.",
  },
  {
    title: "Use ads only for valid products",
    desc: "Choose an available ad position, pay the admin-defined amount, and wait for approval before the ad is published.",
  },
  {
    title: "Track dashboard trends",
    desc: "Use week/month/year charts to monitor revenue movement and identify categories/items with best conversion.",
  },
];

const SellerInstructions = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
            Seller_Guide
          </h1>
          <p className="text-gray-500 mt-2">
            Best-practice playbook to use your seller panel effectively.
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-3xl border border-gray-100 dark:border-white/10 p-6 md:p-8 space-y-4 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {points.map((item, idx) => (
            <div key={item.title} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                Step {idx + 1}
              </p>
              <h3 className="text-lg font-black text-zoop-obsidian dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerInstructions;
