import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package } from '../../assets/icons/Package';
import { Truck } from '../../assets/icons/Truck';
import { CheckCircle } from '../../assets/icons/CheckCircle';
import { ordersApi } from '../../services/api';

const Track = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillId = searchParams.get('orderId');
    if (prefillId) {
      setTrackingId(prefillId);
      void fetchOrder(prefillId);
    }
  }, [searchParams]);

  const buildTimeline = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const idx = steps.indexOf((status || '').toLowerCase());
    return steps.map((step, i) => ({
      status: step[0].toUpperCase() + step.slice(1),
      date: i <= idx ? 'Updated' : 'Pending',
      completed: i <= idx,
      current: i === idx,
    }));
  };

  const fetchOrder = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const order = await ordersApi.getById(id);
      const normalizedStatus = String(order.status || "pending").toLowerCase();
      const statusLabel = normalizedStatus.replace(/^\w/, (s) => s.toUpperCase()).replace('_', ' ');
      setTrackingResult({
        id: order.id,
        status: statusLabel,
        estimatedDelivery:
          normalizedStatus === 'cancelled'
            ? 'Not applicable'
            : normalizedStatus === 'delivered'
              ? 'Delivered'
              : 'In progress',
        currentLocation:
          normalizedStatus === 'cancelled'
            ? 'Order cancelled'
            : order.shippingAddress?.city || order.shippingAddress?.state || 'Transit Hub',
        timeline: normalizedStatus === 'cancelled' ? buildTimeline('pending') : buildTimeline(normalizedStatus),
      });
    } catch (e) {
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    void fetchOrder(trackingId.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zoop-moss rounded-full mb-4">
            <Package width={40} height={40} className="text-zoop-obsidian" />
          </div>
          <h1 className="text-4xl font-black text-zoop-obsidian mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your tracking ID to see real-time updates</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Tracking ID (e.g., ZP123456789)"
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-zoop-moss transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-zoop-obsidian text-white rounded-xl font-black hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tracking ID</p>
                <p className="text-2xl font-black text-zoop-obsidian">{trackingResult.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                <p className="text-xl font-bold text-zoop-moss">{trackingResult.estimatedDelivery}</p>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gradient-to-r from-zoop-moss/10 to-transparent rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zoop-moss rounded-full flex items-center justify-center">
                  <Truck width={24} height={24} className="text-zoop-obsidian" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="text-2xl font-black text-zoop-obsidian">{trackingResult.status}</p>
                  <p className="text-sm text-gray-500 mt-1">{trackingResult.currentLocation}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-zoop-obsidian uppercase tracking-wider mb-6">
                Tracking Timeline
              </h3>
              {trackingResult.timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  {/* Icon */}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.completed
                          ? 'bg-zoop-moss'
                          : 'bg-gray-200'
                      } ${item.current ? 'ring-4 ring-zoop-moss/30' : ''}`}
                    >
                      {item.completed ? (
                        <CheckCircle width={20} height={20} className="text-zoop-obsidian" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    {index < trackingResult.timeline.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-10 w-0.5 h-12 -translate-x-1/2 ${
                          item.completed ? 'bg-zoop-moss' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <p
                      className={`font-bold ${
                        item.current ? 'text-zoop-obsidian text-lg' : 'text-gray-700'
                      }`}
                    >
                      {item.status}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Need help with your order?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold hover:border-zoop-moss transition-colors"
                >
                  Contact Support
                </button>
                <Link
                  to="/history"
                  className="px-6 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  View Order Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        {!trackingResult && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package width={24} height={24} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">
                Get live tracking updates on your order status
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck width={24} height={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-600">
                Same-day delivery available for local orders
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle width={24} height={24} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-zoop-obsidian mb-2">Secure Delivery</h3>
              <p className="text-sm text-gray-600">
                Your orders are handled with care and security
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
