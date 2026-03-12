import React, { useState, useEffect } from "react";
import { adminApi } from "../../services/api";
import { Check } from "../../assets/icons/Check";
import { X } from "../../assets/icons/X";
import { Eye } from "../../assets/icons/Eye";
import { FileText } from "../../assets/icons/FileText";
import { Star } from "../../assets/icons/Star";
import { normalizeDocumentUrl } from "../../utils/documentLinks";

const VerifySellers = () => {
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // stores seller id being actioned
  const [rejectModal, setRejectModal] = useState(null); // stores sellerId for reject flow
  const [rejectReason, setRejectReason] = useState("");

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users with 'seller' role OR those who have 'verificationStatus' as pending/approved/rejected
      // The backend getAllUsers handles role filtering.
      const response = await adminApi.getUsers({
        role: "seller",
        limit: "100",
      });
      const data = response.users || [];

      // Also fetch specifically pending ones if role filter wasn't enough (edge case)
      let pendingSellers = [];
      try {
        pendingSellers = await adminApi.getPendingSellers();
      } catch (e) {
        console.warn(
          "Could not fetch pending sellers specifically, using results from getUsers",
          e,
        );
      }

      // Merge and deduplicate
      const combinedSellers = [...data];
      (pendingSellers || []).forEach((ps) => {
        if (!combinedSellers.some((s) => s.id === ps.id)) {
          combinedSellers.push(ps);
        }
      });

      const normalized = combinedSellers.map((s) => ({
        ...s,
        status: s.verificationStatus || "pending",
        name: s.businessName || s.displayName || s.name || "Unnamed Store",
        owner: s.displayName || s.name || "Unknown",
        email: s.email,
        phone: s.phone || "N/A",
        category: s.businessType || "Retail",
        location: s.address || "N/A",
        gst: s.gstNumber || "N/A",
        pan: s.panNumber || "N/A",
        // Only show documents that were actually submitted
        documents: [
          s.panCardUrl
            ? { label: `PAN Card${s.panNumber ? ` (${s.panNumber})` : ""}`, url: normalizeDocumentUrl(s.panCardUrl) }
            : null,
          s.gstCertificateUrl
            ? {
                label: `GST Certificate${s.gstNumber ? ` (${s.gstNumber})` : ""}`,
                url: normalizeDocumentUrl(s.gstCertificateUrl),
              }
            : null,
          s.cancelledChequeUrl
            ? { label: "Cancelled Cheque / Bank Proof", url: normalizeDocumentUrl(s.cancelledChequeUrl) }
            : null,
        ].filter(Boolean),
        submittedDate: s.onboardingCompletedAt
          ? new Date(s.onboardingCompletedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recently",
        rating: s.rating || 0,
        productsCount: s.productsCount || 0,
        rejectReason: s.rejectionReason || null,
      }));
      setSellers(normalized);
    } catch (err) {
      console.error("Error fetching sellers:", err);
      if (err.status === 403 || err.message?.includes("Forbidden")) {
        setError(
          "Forbidden: Insufficient permissions. Please ensure you are logged in as an Admin.",
        );
      } else {
        setError("Failed to load sellers: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter((s) => s.status === filter);

  const handleApprove = async (sellerId) => {
    if (actionLoading) return;
    setActionLoading(sellerId);
    try {
      await adminApi.approveSeller(sellerId);
      await fetchSellers();
    } catch (e) {
      setError("Could not approve seller: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (sellerId) => {
    setRejectReason("");
    setRejectModal(sellerId);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    if (actionLoading) return;
    setActionLoading(rejectModal);
    try {
      await adminApi.rejectSeller(rejectModal, rejectReason);
      setRejectModal(null);
      await fetchSellers();
    } catch (e) {
      setError("Could not reject seller: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    pending: sellers.filter((s) => s.status === "pending").length,
    approved: sellers.filter((s) => s.status === "approved").length,
    rejected: sellers.filter((s) => s.status === "rejected").length,
  };

  if (loading && sellers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">
            Loading Seller Applications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-zoop-obsidian dark:text-white tracking-tight">
              Verify Sellers
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Review and manage marketplace partner applications
            </p>
          </div>
          <button
            onClick={fetchSellers}
            className="px-4 py-2 bg-white dark:glass-card border border-gray-200 dark:border-white/10 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <X width={24} height={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-red-700 font-black">Access Denied / Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/login")}
              className="ml-auto px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:glass-card rounded-[2rem] p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 group hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">
                  Pending_Review
                </p>
                <p className="text-5xl font-black text-orange-500">
                  {stats.pending.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText width={32} height={32} stroke="#f97316" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:glass-card rounded-[2rem] p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 group hover:border-green-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">
                  Approved_Partners
                </p>
                <p className="text-5xl font-black text-green-500">
                  {stats.approved.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check width={32} height={32} stroke="#22c55e" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:glass-card rounded-[2rem] p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 group hover:border-red-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">
                  Rejected_Files
                </p>
                <p className="text-5xl font-black text-red-500">
                  {stats.rejected.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <X width={32} height={32} stroke="#ef4444" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:glass-card rounded-2xl p-2 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex gap-2">
          {["pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                filter === tab
                  ? "bg-zoop-obsidian text-white shadow-lg dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              {tab} ({sellers.filter((s) => s.status === tab).length})
            </button>
          ))}
        </div>

        {/* Sellers List */}
        <div className="space-y-4">
          {filteredSellers.length > 0 ? (
            filteredSellers.map((seller) => (
              <div
                key={seller.id}
                className="bg-white dark:glass-card rounded-3xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 hover:border-zoop-moss/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Seller Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-black text-zoop-obsidian dark:text-white">
                          {seller.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          Owner: {seller.owner}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          seller.status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : seller.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {seller.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Email
                        </p>
                        <p className="font-bold text-sm">{seller.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Phone
                        </p>
                        <p className="font-bold text-sm">{seller.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Category
                        </p>
                        <p className="font-bold text-sm">{seller.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Location
                        </p>
                        <p className="font-bold text-sm">{seller.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          GST Number
                        </p>
                        <p className="font-bold text-sm">{seller.gst}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Submitted Date
                        </p>
                        <p className="font-bold text-sm">
                          {seller.submittedDate}
                        </p>
                      </div>
                    </div>

                    {seller.status === "approved" && (
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-1">
                          <Star
                            width={16}
                            height={16}
                            fill="#b7e84b"
                            stroke="#b7e84b"
                          />
                          <span className="font-bold text-sm">
                            {seller.rating}
                          </span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {seller.productsCount} products
                        </span>
                      </div>
                    )}

                    {seller.status === "rejected" && seller.rejectReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-600">
                          {seller.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Documents & Actions */}
                  <div className="lg:w-80 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Documents Submitted
                      </p>
                      <div className="space-y-2">
                        {seller.documents && seller.documents.length > 0 ? (
                          seller.documents.map((doc, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText
                                  width={16}
                                  height={16}
                                  className="text-gray-400"
                                />
                                <span className="text-sm font-medium">
                                  {doc.label}
                                </span>
                              </div>
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zoop-moss hover:text-zoop-obsidian"
                                  title="View document"
                                >
                                  <Eye width={16} height={16} />
                                </a>
                              ) : (
                                <button className="text-gray-300 cursor-not-allowed" disabled>
                                  <Eye width={16} height={16} />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                            No documents uploaded during signup
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons — only for pending sellers */}
                    {seller.status === "pending" ? (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleApprove(seller.id)}
                          disabled={actionLoading === seller.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === seller.id ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check width={16} height={16} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(seller.id)}
                          disabled={actionLoading === seller.id}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <X width={16} height={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4">
                        <p
                          className={`text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl text-center ${
                            seller.status === "approved"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {seller.status === "approved"
                            ? "✓ Approved — no further action needed"
                            : "✗ Rejected"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:glass-card rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-black text-zoop-obsidian dark:text-white mb-2">
                No {filter} sellers
              </h3>
              <p className="text-gray-500">
                There are no sellers in the {filter} status
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:glass-card rounded-3xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-zoop-obsidian dark:text-white mb-2">
              Reject Seller Application
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              This reason will be shown to the seller so they understand why
              their application was not approved.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-200 dark:border-white/10 focus:border-red-400 rounded-xl px-4 py-3 font-medium outline-none transition-colors mb-6"
              placeholder="e.g. Incomplete business documents, invalid GST number..."
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-xl font-black text-sm hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X width={14} height={14} />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifySellers;
