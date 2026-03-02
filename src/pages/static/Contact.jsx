import React, { useState } from 'react';
import { MapPin } from '../../assets/icons/MapPin';
import { MessageCircle } from '../../assets/icons/MessageCircle';
import { Clock } from '../../assets/icons/Clock';
import { useToast } from '../../context/ToastContext';
import { contentApi } from '../../services/api';
import { useUser } from '../../context/UserContext';
import CountryPhoneField from '../../components/common/CountryPhoneField';
import { hasUppercase, isValidEmail } from '../../utils/liveValidation';

const Contact = () => {
  const { success, error } = useToast();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [myTickets, setMyTickets] = useState([]);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (!user?.uid) return;
    contentApi
      .getMySupportTickets()
      .then((items) => setMyTickets(Array.isArray(items) ? items.slice(0, 5) : []))
      .catch(() => setMyTickets([]));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'name') {
      setErrors((prev) => ({
        ...prev,
        name: !hasUppercase(value) ? 'Add at least one capital letter' : '',
      }));
    }
    if (name === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: value && !isValidEmail(value) ? 'Please enter a valid email address' : '',
      }));
    }
    if (name === 'message') {
      setErrors((prev) => ({
        ...prev,
        message: value.trim().length < 10 ? 'Message should be at least 10 characters' : '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.uid) {
        error('Please login to create a support ticket.');
        return;
      }
      if (Object.values(errors).some(Boolean)) {
        error('Please fix form errors before submit.');
        return;
      }
      await contentApi.createSupportTicket({
        subject: formData.subject || 'General',
        message: formData.message,
        priority: 'medium',
        category: formData.subject || 'General',
        contactType: formData.subject === 'seller' ? 'seller' : 'user',
        phone: formData.phone,
        email: formData.email,
      });
      success('Ticket created successfully. Our team will contact you.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (e) {
      error(e?.message || 'Unable to submit your request');
    }
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Customer Support',
      details: ['support@zoop.com', '+91 1800 123 4567'],
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: MapPin,
      title: 'Head Office',
      details: ['Ring Road, Surat', 'Gujarat 395001, India'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Mon - Sat: 9 AM - 9 PM', 'Sunday: 10 AM - 6 PM'],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-zoop-obsidian mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow=sm border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon width={32} height={32} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-zoop-obsidian mb-3">
                  {method.title}
                </h3>
                {method.details.map((detail, i) => (
                  <p key={i} className="text-gray-600">
                    {detail}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h2 className="text-2xl font-black text-zoop-obsidian mb-8">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CountryPhoneField
                label="Phone Number"
                value={formData.phone}
                onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                error=""
                defaultCountry="in"
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="order">Order Related</option>
                  <option value="product">Product Inquiry</option>
                  <option value="seller">Seller Support</option>
                  <option value="support">Customer Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent resize-none"
                placeholder="Tell us how we can help you..."
              />
              {errors.message && <p className="text-red-500 text-xs mt-1 font-bold">{errors.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 bg-zoop-moss hover:bg-zoop-moss/90 text-zoop-obsidian rounded-xl font-black transition-all shadow-lg hover:scale-105"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Map placeholder */}
        <div className="mt-12 bg-gray-200 rounded-2xl h-96 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <MapPin width={48} height={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-bold">Map Location</p>
            <p className="text-sm text-gray-500">Ring Road, Surat, Gujarat</p>
          </div>
        </div>

        {user?.uid && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-zoop-obsidian mb-6">My Support Tickets</h2>
            {myTickets.length === 0 ? (
              <p className="text-sm text-gray-500">No tickets yet.</p>
            ) : (
              <div className="space-y-4">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-zoop-obsidian">{ticket.subject}</p>
                      <span className="text-xs font-black uppercase text-gray-600">{ticket.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{ticket.message}</p>
                    {Array.isArray(ticket.replies) && ticket.replies.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-xs font-bold text-green-800">Replies</p>
                        <div className="space-y-2 mt-2">
                          {ticket.replies.map((reply, idx) => (
                            <div key={`${ticket.id}-reply-${idx}`} className="bg-white/80 rounded-md p-2">
                              <p className="text-sm text-green-700">{reply.message}</p>
                              {reply.createdAt && (
                                <p className="text-[11px] text-green-900/70 mt-1">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
