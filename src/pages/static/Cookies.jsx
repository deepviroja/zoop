import React from "react";

const sections = [
  {
    title: "What Cookies Do",
    content:
      "Cookies and similar storage technologies help ZOOP keep users signed in, remember settings, maintain carts, improve performance, and understand general website usage patterns.",
  },
  {
    title: "Types We Use",
    content:
      "The platform may use essential cookies for login and navigation, preference cookies for saved settings, and analytics-related storage to understand how pages and features are used.",
  },
  {
    title: "Why They Matter",
    content:
      "Without essential cookies, parts of the marketplace such as login, cart persistence, and account-related features may not work correctly.",
  },
  {
    title: "Managing Cookies",
    content:
      "You can clear browser storage or block cookies in your browser settings. Doing so may remove saved sessions, location preferences, and other convenience features.",
  },
];

const Cookies = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-white dark:glass-card p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zoop-copper">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-black text-zoop-obsidian dark:text-white">
            Cookies Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            This page explains how browser storage and cookies are used across ZOOP.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
