import React from "react";

const sections = [
  {
    title: "Information We Collect",
    content:
      "ZOOP may collect account details, order information, delivery addresses, payment references, support requests, and device or usage data needed to operate the marketplace securely.",
  },
  {
    title: "How We Use Information",
    content:
      "We use your information to manage accounts, process orders, provide support, improve the website, prevent fraud, and communicate important updates related to your activity on the platform.",
  },
  {
    title: "Sharing of Information",
    content:
      "We only share required information with service providers, sellers, delivery partners, and legal authorities when necessary for order fulfillment, compliance, platform safety, or dispute resolution.",
  },
  {
    title: "Data Protection",
    content:
      "We apply reasonable technical and operational safeguards to protect stored data. No internet-connected system can be guaranteed fully secure, but we work to reduce risk and limit access appropriately.",
  },
  {
    title: "Your Controls",
    content:
      "You can update profile details, manage saved data where available, and contact support for questions related to your account information or privacy concerns.",
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl bg-white dark:glass-card p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-zoop-copper">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-black text-zoop-obsidian dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
            This page explains how ZOOP handles account, order, and platform data.
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

export default Privacy;
