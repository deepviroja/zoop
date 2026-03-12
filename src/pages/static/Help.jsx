import React, { useState } from 'react';
import { Mail } from '../../assets/icons/Mail';
import { Phone } from '../../assets/icons/Phone';
import { MessageCircle } from '../../assets/icons/MessageCircle';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Orders & Delivery',
      questions: [
        {
          q: 'How can I track my order?',
          a: 'You can track your order by visiting the "Track Order" page and entering your tracking ID. You can also view all your orders in the "My Orders" section.'
        },
        {
          q: 'What is same-day delivery?',
          a: 'Same-day delivery is available for local products in select cities. Orders placed before 2 PM will be delivered the same day.'
        },
        {
          q: 'Can I cancel my order?',
          a: 'Yes, you can cancel your order before it is shipped. Go to "My Orders" and click on the cancel button next to your order.'
        }
      ]
    },
    {
      category: 'Payments & Refunds',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Credit/Debit cards, UPI, Net Banking, and Cash on Delivery for eligible orders.'
        },
        {
          q: 'How long does it take to get a refund?',
          a: 'Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.'
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, all payment transactions are encrypted and processed through secure payment gateways. We do not store your card details.'
        }
      ]
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 7-day return policy for most products. Items must be unused and in original packaging with tags intact.'
        },
        {
          q: 'How do I return a product?',
          a: 'Go to "My Orders", select the order, and click on "Return Item". Our team will arrange a pickup from your location.'
        },
        {
          q: 'Can I exchange a product?',
          a: 'Yes, exchanges are available for size/color variations. Select "Exchange" instead of "Return" when initiating the return process.'
        }
      ]
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click on "Forgot Password" on the login page and enter your registered email. You will receive a password reset link.'
        },
        {
          q: 'How do I update my profile information?',
          a: 'Go to "My Profile" from the account menu and click on "Edit Profile" to update your information.'
        },
        {
          q: 'Is my personal information safe?',
          a: 'Yes, we use industry-standard encryption to protect your personal information. We never share your data with third parties without your consent.'
        }
      ]
    }
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-zoop-obsidian dark:text-white mb-4">
            How Can We Help You?
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-6 py-4 pl-12 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg focus:outline-none focus:border-zoop-moss transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:glass-card rounded-2xl p-6 text-center shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail width={32} height={32} className="text-blue-600" />
            </div>
            <h3 className="font-black text-zoop-obsidian dark:text-white mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get help via email within 24 hours
            </p>
            <a
              href="mailto:support@zoop.com"
              className="text-zoop-moss font-bold hover:underline"
            >
              support@zoop.com
            </a>
          </div>

          <div className="bg-white dark:glass-card rounded-2xl p-6 text-center shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone width={32} height={32} className="text-green-600" />
            </div>
            <h3 className="font-black text-zoop-obsidian dark:text-white mb-2">Phone Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Mon-Sat, 9 AM - 6 PM IST
            </p>
            <a
              href="tel:+911800123456"
              className="text-zoop-moss font-bold hover:underline"
            >
              1800-123-456
            </a>
          </div>

          <div className="bg-white dark:glass-card rounded-2xl p-6 text-center shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle width={32} height={32} className="text-purple-600" />
            </div>
            <h3 className="font-black text-zoop-obsidian dark:text-white mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Chat with our support team
            </p>
            <button className="text-zoop-moss font-bold hover:underline">
              Start Chat
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:glass-card rounded-2xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-8">
            Frequently Asked Questions
          </h2>

          {filteredFaqs.length > 0 ? (
            <div className="space-y-8">
              {filteredFaqs.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-black text-zoop-moss mb-4 uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <div className="space-y-4">
                    {category.questions.map((item, qIdx) => (
                      <details
                        key={qIdx}
                        className="group border-b border-gray-200 dark:border-white/10 pb-4"
                      >
                        <summary className="flex justify-between items-center cursor-pointer list-none">
                          <span className="font-bold text-zoop-obsidian dark:text-white group-open:text-zoop-moss transition-colors">
                            {item.q}
                          </span>
                          <svg
                            className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No results found for "{searchQuery}". Try different keywords or contact support.
              </p>
            </div>
          )}
        </div>
        <div className="bg-white dark:glass-card rounded-2xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] mt-8">
          <h2 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-4">Returns Policy</h2>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              Most items are eligible for return within <span className="font-black">7 days</span> of delivery.
              Products must be unused, with original packaging and tags.
            </p>
            <p>
              Non-returnable items include perishable goods, intimate wear, and any product marked
              as final sale on the product page.
            </p>
            <p>
              Refund is processed after seller quality check, typically within <span className="font-black">5-7 business days</span>.
              Original shipping fees are non-refundable unless the item is damaged or wrong.
            </p>
            <p>
              To request a return, go to <span className="font-black">My Orders</span> and select
              <span className="font-black"> Return Item</span>.
            </p>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-zoop-moss/20 to-zoop-copper/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-4">
            Still Need Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our support team is here to assist you with any questions
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-zoop-obsidian text-white rounded-xl font-black hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;
