import React from 'react';
import { Shield } from '../../assets/icons/Shield';
import { Check } from '../../assets/icons/Check';

const Terms = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using ZOOP marketplace, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.'
    },
    {
      title: 'Use of Service',
      content: 'ZOOP provides a platform connecting buyers with local and national sellers. You agree to use our service only for lawful purposes and in accordance with these Terms of Service.'
    },
    {
      title: 'User Accounts',
      items: [
        'You must provide accurate information when creating an account',
        'You are responsible for maintaining the confidentiality of your account',
        'You agree to accept responsibility for all activities under your account',
        'You must notify us immediately of any unauthorized use'
      ]
    },
    {
      title: 'Products and Services',
      items: [
        'Product descriptions and prices are provided by sellers',
        'We reserve the right to refuse service to anyone',
        'Prices are subject to change without notice',
        'We do not guarantee availability of any product'
      ]
    },
    {
      title: 'Orders and Payments',
      content: 'All orders are subject to acceptance and availability. Payment must be made through our secure payment gateway. We accept all major credit/debit cards, UPI, and net banking.'
    },
    {
      title: 'Delivery and Shipping',
      items: [
        'Same-day delivery available for local products in select cities',
        'National delivery takes 3-7 business days',
        'Delivery times are estimates and not guaranteed',
        'Risk of loss passes to you upon delivery'
      ]
    },
    {
      title: 'Returns and Refunds',
      content: 'We offer a 7-day return policy for most products. Items must be unused and in original packaging. Refunds will be processed within 5-7 business days after receiving the returned item.'
    },
    {
      title: 'Seller Responsibilities',
      items: [
        'Sellers must provide accurate product information',
        'Sellers are responsible for order fulfillment',
        'Sellers must comply with all applicable laws',
        'Sellers must maintain quality standards'
      ]
    },
    {
      title: 'Intellectual Property',
      content: 'All content on ZOOP, including logos, text, graphics, and software, is the property of ZOOP or its licensors and is protected by copyright and trademark laws.'
    },
    {
      title: 'Limitation of Liability',
      content: 'ZOOP shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our service.'
    },
    {
      title: 'Privacy',
      content: 'Your use of ZOOP is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal information.'
    },
    {
      title: 'Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of any changes.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-zoop-obsidian to-zoop-ink text-white rounded-2xl p-12 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Shield width={32} height={32} className="text-zoop-moss" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black">
                Terms & Conditions
              </h1>
              <p className="text-white/60 mt-2">Last updated: Month ago</p>
            </div>
          </div>
          <p className="text-lg text-white/80">
            Please read these terms and conditions carefully before using ZOOP marketplace services.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white dark:glass-card rounded-2xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10">
              <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-zoop-moss/20 text-zoop-moss rounded-full flex items-center justify-center text-sm font-black">
                  {idx + 1}
                </span>
                {section.title}
              </h2>
              
              {section.content && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {section.content}
                </p>
              )}
              
              {section.items && (
                <ul className="space-y-3 mt-4">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check width={20} height={20} className="text-zoop-moss flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-br from-zoop-moss/10 to-green-50 rounded-2xl p-8 border border-zoop-moss/20">
          <h3 className="text-xl font-black text-zoop-obsidian dark:text-white mb-3">
            Questions About Our Terms?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have any questions about these Terms & Conditions, please contact our legal team.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:legal@zoop.com"
              className="inline-block px-6 py-3 bg-zoop-obsidian text-white rounded-xl font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
            >
              legal@zoop.com
            </a>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-white dark:glass-card border-2 border-zoop-obsidian text-zoop-obsidian dark:text-white rounded-xl font-bold hover:bg-zoop-obsidian hover:text-white transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
