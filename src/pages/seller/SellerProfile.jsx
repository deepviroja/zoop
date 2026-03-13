import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { authApi, contentApi } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { User } from "../../assets/icons/User";
import { Mail } from "../../assets/icons/Mail";
import { Phone } from "../../assets/icons/Phone";
import { MapPin } from "../../assets/icons/MapPin";
import { Edit } from "../../assets/icons/Edit";
import { Store } from "../../assets/icons/Store";
import { Package } from "../../assets/icons/Package";
import { TrendingUp } from "../../assets/icons/TrendingUp";
import { Star } from "../../assets/icons/Star";
import { ShoppingCart } from "../../assets/icons/ShoppingCart";
import { Check } from "../../assets/icons/Check";
import { Shield } from "../../assets/icons/Shield";
import { BellRing } from "../../assets/icons/BellRing";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import { normalizeDocumentUrl } from "../../utils/documentLinks";

const SellerProfile = () => {
  const location = useLocation();
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Pre-populate from real user data
  const [profileData, setProfileData] = useState({
    name: user?.businessName || user?.displayName || user?.name || "My Store",
    ownerName: user?.displayName || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    businessType: user?.businessType || "",
    location: user?.address || "",
    bio: user?.bio || "",
    gstNumber: user?.gstNumber || "",
    panNumber: user?.panNumber || "",
    bankName: user?.bankName || "",
    accountNumber: user?.accountNumber || "",
    ifscCode: user?.ifscCode || "",
    panCardUrl: user?.panCardUrl || "",
    cancelledChequeUrl: user?.cancelledChequeUrl || "",
    gstCertificateUrl: user?.gstCertificateUrl || "",
    verificationStatus: user?.verificationStatus || "pending",
    joinDate: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN"),
  });

  const [deleteFlow, setDeleteFlow] = useState({
    open: false,
    otpSent: false,
    otp: "",
    reason: "",
    loading: false,
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "notifications") {
      setActiveTab("notifications");
      setTimeout(() => {
        document.getElementById("seller-notifications")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await authApi.getProfile();
        if (cancelled) return;
        setProfileData((prev) => ({
          ...prev,
          name: profile.businessName || profile.displayName || prev.name,
          ownerName: profile.displayName || profile.name || prev.ownerName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          businessType: profile.businessType || prev.businessType,
          location: profile.address || prev.location,
          bio: profile.bio || prev.bio,
          gstNumber: profile.gstNumber || prev.gstNumber,
          panNumber: profile.panNumber || prev.panNumber,
          bankName: profile.bankName || prev.bankName,
          accountNumber: profile.accountNumber || prev.accountNumber,
          ifscCode: profile.ifscCode || prev.ifscCode,
          panCardUrl: profile.panCardUrl || prev.panCardUrl,
          cancelledChequeUrl: profile.cancelledChequeUrl || prev.cancelledChequeUrl,
          gstCertificateUrl: profile.gstCertificateUrl || prev.gstCertificateUrl,
          verificationStatus: profile.verificationStatus || prev.verificationStatus,
        }));
      } catch {
        // no-op
      }
    };
    if (user?.uid) void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const list = await contentApi.getMyNotifications();
        if (!cancelled) setNotifications(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };
    if (user?.uid) void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSaveProfile = () => {
    setSaving(true);
    authApi
      .updateProfile({
        displayName: profileData.ownerName || profileData.name,
        businessName: profileData.name,
        businessType: profileData.businessType,
        phone: profileData.phone,
        address: profileData.location,
        gstNumber: profileData.gstNumber,
        panNumber: profileData.panNumber,
        bankName: profileData.bankName,
        accountNumber: profileData.accountNumber,
        ifscCode: profileData.ifscCode,
        panCardUrl: profileData.panCardUrl,
        cancelledChequeUrl: profileData.cancelledChequeUrl,
        gstCertificateUrl: profileData.gstCertificateUrl,
        bio: profileData.bio,
      })
      .then(async () => {
        await refreshUser({
          suppressMissingProfileToast: true,
          suppressIncompleteProfileToast: true,
        });
        showToast("Seller profile updated", "success");
        setIsEditing(false);
      })
      .catch((e) => showToast(e?.message || "Failed to update profile", "error"))
      .finally(() => setSaving(false));
  };

  const requestDeleteOtp = async () => {
    setDeleteFlow((p) => ({ ...p, loading: true }));
    try {
      await authApi.requestDeleteAccountOTP();
      setDeleteFlow((p) => ({ ...p, otpSent: true, loading: false }));
      showToast("Deletion OTP sent to email", "info");
    } catch (e) {
      setDeleteFlow((p) => ({ ...p, loading: false }));
      showToast(e?.message || "Could not send OTP", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteFlow.otp) {
      showToast("Enter OTP", "warning");
      return;
    }
    setDeleteFlow((p) => ({ ...p, loading: true }));
    try {
      await authApi.confirmDeleteAccount(deleteFlow.otp, deleteFlow.reason);
      showToast("Seller account deleted", "success");
      window.location.href = "/login";
    } catch (e) {
      setDeleteFlow((p) => ({ ...p, loading: false }));
      showToast(e?.message || "Could not delete account", "error");
    }
  };

  const statusConfig = {
    approved: {
      label: "Verified",
      color: "bg-zoop-moss text-zoop-obsidian dark:text-white",
      icon: Check,
    },
    pending: {
      label: "Pending Review",
      color: "bg-amber-100 text-amber-700",
      icon: Shield,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-700",
      icon: Shield,
    },
  };
  const statusInfo =
    statusConfig[profileData.verificationStatus] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-900 tracking-tighter italic text-zoop-obsidian dark:text-white uppercase">
              Store_Profile
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
              Your business information and store settings
            </p>
          </div>
          {!isEditing && activeTab === "profile" && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Edit width={16} height={16} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-zoop-obsidian via-gray-900 to-zoop-obsidian text-white rounded-3xl p-10 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-zoop-moss rounded-3xl flex items-center justify-center text-zoop-obsidian dark:text-white font-black text-4xl shrink-0">
                {(profileData.name || "S")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-3xl font-black">{profileData.name}</h2>
                  <span
                    className={`px-3 py-1 ${statusInfo.color} rounded-full text-xs font-black flex items-center gap-1`}
                  >
                    <StatusIcon width={12} height={12} />
                    {statusInfo.label}
                  </span>
                </div>
                {profileData.ownerName && (
                  <p className="text-white/70 mb-1 text-sm">
                    Owner: {profileData.ownerName}
                  </p>
                )}
                {profileData.businessType && (
                  <p className="text-white/50 text-sm mb-3">
                    {profileData.businessType}
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  {profileData.email && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Mail width={14} height={14} className="text-zoop-moss" />
                      {profileData.email}
                    </div>
                  )}
                  {profileData.phone && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Phone
                        width={14}
                        height={14}
                        className="text-zoop-moss"
                      />
                      {profileData.phone}
                    </div>
                  )}
                  {profileData.location && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MapPin
                        width={14}
                        height={14}
                        className="text-zoop-moss"
                      />
                      {profileData.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-zoop-moss opacity-10 blur-[100px] rounded-full" />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:glass-card  rounded-2xl p-2 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex gap-2">
            {[
              { key: "profile", label: "Business Info", icon: Store },
              { key: "notifications", label: "Notifications", icon: BellRing },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? "bg-zoop-moss text-zoop-obsidian dark:text-white shadow"
                      : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-100/10"
                  }`}
                >
                  <Icon width={18} height={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:glass-card rounded-3xl p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-6">
                Business Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Business Name", key: "name", type: "text" },
                  { label: "Owner Name", key: "ownerName", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                  { label: "Business Type", key: "businessType", type: "text" },
                  {
                    label: "Location / Address",
                    key: "location",
                    type: "text",
                  },
                  { label: "GST Number", key: "gstNumber", type: "text" },
                  { label: "PAN Number", key: "panNumber", type: "text" },
                  { label: "Bank Name", key: "bankName", type: "text" },
                  { label: "Account Number", key: "accountNumber", type: "text" },
                  { label: "IFSC Code", key: "ifscCode", type: "text" },
                  { label: "PAN Card URL", key: "panCardUrl", type: "text" },
                  {
                    label: "Cancelled Cheque URL",
                    key: "cancelledChequeUrl",
                    type: "text",
                  },
                  {
                    label: "GST Certificate URL",
                    key: "gstCertificateUrl",
                    type: "text",
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                      {field.label}
                    </label>
                    {field.key === "phone" && isEditing ? (
                      <CountryPhoneField
                        label=""
                        value={profileData.phone}
                        onChange={(phone) =>
                          setProfileData({
                            ...profileData,
                            phone,
                          })
                        }
                        error=""
                        defaultCountry="in"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={profileData[field.key]}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            [field.key]: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border-2 rounded-xl font-bold ${
                          isEditing
                            ? "border-gray-200 dark:border-white/10 focus:border-zoop-moss outline-none"
                            : "border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                        }`}
                        placeholder={
                          isEditing ? `Enter ${field.label.toLowerCase()}` : "N/A"
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                {[
                  { label: "PAN Card", url: normalizeDocumentUrl(profileData.panCardUrl) },
                  { label: "Cancelled Cheque", url: normalizeDocumentUrl(profileData.cancelledChequeUrl) },
                  { label: "GST Certificate", url: normalizeDocumentUrl(profileData.gstCertificateUrl) },
                ].map((doc) => (
                  <a
                    key={doc.label}
                    href={doc.url || "#"}
                    target={doc.url ? "_blank" : undefined}
                    rel={doc.url ? "noreferrer" : undefined}
                    onClick={(e) => {
                      if (!doc.url) e.preventDefault();
                    }}
                    className={`px-4 py-3 rounded-xl border text-sm font-black transition-all ${
                      doc.url
                        ? "bg-white dark:glass-card border-gray-200 dark:border-white/10 text-zoop-obsidian dark:text-white hover:border-zoop-moss"
                        : "bg-gray-100 dark:bg-white/10 border-gray-100 dark:border-white/10 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    View {doc.label}
                  </a>
                ))}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                  Business Description
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl font-medium ${
                    isEditing
                      ? "border-gray-200 dark:border-white/10 focus:border-zoop-moss outline-none"
                      : "border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                  }`}
                  placeholder={isEditing ? "Describe your business..." : "N/A"}
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div id="seller-notifications" className="space-y-6">
              <h3 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-2">
                Notifications
              </h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border ${
                        note.read
                          ? "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10"
                          : "bg-zoop-moss/10 border-zoop-moss/30"
                      }`}
                    >
                      <p className="font-bold text-zoop-obsidian dark:text-white">{note.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{note.message}</p>
                      {note.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() =>
                    setDeleteFlow({ open: true, otpSent: false, otp: "", reason: "", loading: false })
                  }
                  className="w-full px-5 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100"
                >
                  Delete Seller Account
                </button>
              </div>
            </div>
          )}
        </div>
        {deleteFlow.open && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                setDeleteFlow({ open: false, otpSent: false, otp: "", reason: "", loading: false })
              }
            />
            <div className="relative bg-white dark:glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10">
              <h3 className="text-lg font-black text-zoop-obsidian dark:text-white">Delete Seller Account</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                OTP will be sent to your registered email for confirmation.
              </p>
              <textarea
                value={deleteFlow.reason}
                onChange={(e) => setDeleteFlow((p) => ({ ...p, reason: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm mb-3"
                placeholder="Optional reason"
              />
              {deleteFlow.otpSent && (
                <input
                  value={deleteFlow.otp}
                  onChange={(e) => setDeleteFlow((p) => ({ ...p, otp: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 mb-3"
                  placeholder="Enter OTP"
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteFlow({ open: false, otpSent: false, otp: "", reason: "", loading: false })
                  }
                  className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl font-bold"
                >
                  Cancel
                </button>
                {!deleteFlow.otpSent ? (
                  <button
                    onClick={requestDeleteOtp}
                    disabled={deleteFlow.loading}
                    className="flex-1 py-2.5 bg-zoop-obsidian text-white rounded-xl font-bold"
                  >
                    {deleteFlow.loading ? "Sending..." : "Send OTP"}
                  </button>
                ) : (
                  <button
                    onClick={confirmDelete}
                    disabled={deleteFlow.loading}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold"
                  >
                    {deleteFlow.loading ? "Deleting..." : "Confirm Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;
