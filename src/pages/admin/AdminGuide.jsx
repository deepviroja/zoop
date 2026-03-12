import React from "react";

const sections = [
  {
    title: "Dashboard and Sales",
    points: [
      "Use Week/Month/Year filters to see sales trend bars.",
      "Stats cards show total users, products, orders, and revenue.",
      "If values are zero, data has been reset or no orders exist yet.",
    ],
  },
  {
    title: "Content Curation",
    points: [
      "Approve or reject product listings.",
      "Rejected items can be re-reviewed and approved later.",
      "Curation becomes empty when products are removed/reset.",
    ],
  },
  {
    title: "Ads Review",
    points: [
      "Seller ads enter as PENDING_REVIEW and inactive.",
      "In Ads Management, use Approve & Publish to make ad live.",
      "Use Reject to block, and Activate/Deactivate to control visibility.",
      "Slot dropdown assigns exact ad position (home_top, home_mid, etc.).",
    ],
  },
  {
    title: "Website Control",
    points: [
      "Set global brand name/logo/text style for header/footer and all panels.",
      "Set sub-navbar categories (comma separated) for customer navigation.",
      "Maintenance mode should be used for planned updates only.",
    ],
  },
  {
    title: "Super Admin Actions",
    points: [
      "Only admin@zoop.com can run destructive actions.",
      "Delete All Products clears curation and product listings.",
      "Delete Users/Sellers/Admins marks records as deleted (super admin is preserved).",
      "Reset Web clears operational collections: orders, ads, tickets, notifications, payouts, etc.",
      "Run resets carefully; these are intended for controlled maintenance/testing.",
    ],
  },
];

const AdminGuide = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
            Admin_Guide
          </h1>
          <p className="text-gray-500 mt-2">
            Operational instructions for admin panel workflows.
          </p>
        </div>
        <div className="bg-white dark:glass-card rounded-3xl border border-gray-100 dark:border-white/10 p-6 md:p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <h3 className="text-lg font-black text-zoop-obsidian dark:text-white mb-2">{section.title}</h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminGuide;
