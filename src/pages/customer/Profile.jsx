import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { authApi, contentApi, ordersApi, wishlistApi } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { User } from "../../assets/icons/User";
import { Edit } from "../../assets/icons/Edit";
import { Package } from "../../assets/icons/Package";
import { Heart } from "../../assets/icons/Heart";
import { MapPin } from "../../assets/icons/MapPin";
import { Star } from "../../assets/icons/Star";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import CountryStateCityFieldset from "../../components/common/CountryStateCityFieldset";
import {
  isValidEmail,
  isValidInternationalPhone,
  isValidPincode,
  getPincodeValidationMessage,
} from "../../utils/liveValidation";
import { apiClient } from "../../api/client";
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { getCountryByCode, getStateByCodeAndCountry, getStatesOfCountry } from "../../utils/locationData";

const Profile = () => {
  const { user, logout, updateLocation } = useUser();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, reviews: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.displayName || user?.name || "Guest User",
    email: user?.email || "guest@zoop.com",
    phone: "",
    altPhone: "",
    address: "",
    countryCode: "IN",
    country: "India",
    stateCode: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    gender: "",
    dateOfBirth: "",
    photoURL: "",
    addresses: [],
  });
  const [addressDraft, setAddressDraft] = useState({
    label: "home",
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState({});
  const [phoneMeta, setPhoneMeta] = useState({ dialCode: "91", countryCode: "in", format: "" });
  const [altPhoneMeta, setAltPhoneMeta] = useState({ dialCode: "91", countryCode: "in", format: "" });
  const [deleteFlow, setDeleteFlow] = useState({
    open: false,
    otpSent: false,
    otp: "",
    reason: "",
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await authApi.getProfile();
        if (cancelled) return;
        setFormData({
          name: data.displayName || data.name || user?.displayName || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          altPhone: data.altPhone || "",
          address: data.address || "",
          countryCode: "IN",
          country: "India",
          stateCode: "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          landmark: data.landmark || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          photoURL: data.photoURL || user?.photoURL || "",
          addresses: Array.isArray(data.addresses) ? data.addresses : [],
        });
        if (data?.state) {
          const states = getStatesOfCountry("IN");
          const matched = states.find(
            (item) => item.name.toLowerCase() === String(data.state || "").toLowerCase(),
          );
          if (matched?.isoCode) {
            setFormData((prev) => ({ ...prev, stateCode: matched.isoCode }));
          }
        }
      } catch {
        // keep fallback local values
      }
    };
    if (user?.uid) void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const [orders, wishlist, tickets, notificationsList, myReviews] = await Promise.all([
          ordersApi.getMyOrders(),
          wishlistApi.get(),
          contentApi.getMySupportTickets(),
          contentApi.getMyNotifications(),
          contentApi.getMyReviews(),
        ]);
        if (cancelled) return;
        const safeOrders = Array.isArray(orders) ? orders : [];
        setRecentOrders(safeOrders.slice(0, 3));
        setWishlistItems(Array.isArray(wishlist?.items) ? wishlist.items.slice(0, 4) : []);
        setSupportTickets(Array.isArray(tickets) ? tickets.slice(0, 3) : []);
        setNotifications(Array.isArray(notificationsList) ? notificationsList.slice(0, 5) : []);
        setStats({
          orders: safeOrders.length,
          wishlist: Array.isArray(wishlist?.items) ? wishlist.items.length : 0,
          reviews: Array.isArray(myReviews) ? myReviews.length : 0,
        });
      } catch {
        if (!cancelled) {
          setStats({ orders: 0, wishlist: 0, reviews: 0 });
          setRecentOrders([]);
          setWishlistItems([]);
          setSupportTickets([]);
          setNotifications([]);
        }
      }
    };
    if (user?.uid) void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("edit") === "1") {
      setIsEditing(true);
    }
    if (new URLSearchParams(location.search).get("tab") === "notifications") {
      const target = document.getElementById("notifications-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value && !isValidEmail(value) ? "Enter a valid email address" : "",
      }));
    }
    if (name === "pincode") {
      setErrors((prev) => ({
        ...prev,
        pincode: value && !isValidPincode(value, formData.countryCode)
          ? getPincodeValidationMessage(formData.countryCode)
          : "",
      }));
    }
  };

  const handleSave = async () => {
    if (formData.email && !isValidEmail(formData.email)) {
      showToast("Enter a valid email address", "warning");
      return;
    }
    if (formData.phone && !isValidInternationalPhone(formData.phone, phoneMeta)) {
      showToast("Enter a valid phone number", "warning");
      return;
    }
    if (formData.altPhone && !isValidInternationalPhone(formData.altPhone, altPhoneMeta)) {
      showToast("Enter a valid alternate phone number", "warning");
      return;
    }
    if (formData.pincode && !isValidPincode(formData.pincode, formData.countryCode)) {
      showToast(getPincodeValidationMessage(formData.countryCode), "warning");
      return;
    }
    if (!formData.countryCode || !formData.stateCode || !formData.city) {
      showToast("Please select country, state and city in order", "warning");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        displayName: formData.name,
        phone: formData.phone,
        altPhone: formData.altPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        photoURL: formData.photoURL || "",
        addresses: formData.addresses || [],
        defaultLocation:
          formData.addresses.find((item) => item.isDefault)?.city || formData.city || "",
      });
      const defaultCity =
        formData.addresses.find((item) => item.isDefault)?.city || formData.city || "";
      if (defaultCity) updateLocation(defaultCity);
      showToast("Profile updated successfully", "success");
      setIsEditing(false);
    } catch (e) {
      showToast(e?.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    setAvatarUploading(true);
    try {
      const upload = await apiClient.postForm("/upload", form);
      const url = upload?.url || "";
      if (!url) throw new Error("Avatar upload failed");
      setFormData((prev) => ({ ...prev, photoURL: url }));
      await authApi.updateProfile({ photoURL: url });
      showToast("Avatar updated", "success");
    } catch (e) {
      showToast(e?.message || "Could not update avatar", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const requestDeleteOtp = async () => {
    setDeleteFlow((p) => ({ ...p, loading: true }));
    try {
      await authApi.requestDeleteAccountOTP();
      setDeleteFlow((p) => ({ ...p, otpSent: true, loading: false }));
      showToast("Deletion OTP sent to your email", "info");
    } catch (e) {
      setDeleteFlow((p) => ({ ...p, loading: false }));
      showToast(e?.message || "Failed to send OTP", "error");
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteFlow.otp) {
      showToast("Enter OTP", "warning");
      return;
    }
    setDeleteFlow((p) => ({ ...p, loading: true }));
    try {
      await authApi.confirmDeleteAccount(deleteFlow.otp, deleteFlow.reason);
      showToast("Account deleted successfully", "success");
      await logout();
    } catch (e) {
      setDeleteFlow((p) => ({ ...p, loading: false }));
      showToast(e?.message || "Could not delete account", "error");
    }
  };

  const statCards = [
    {
      label: "Orders",
      value: String(stats.orders),
      icon: Package,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Wishlist",
      value: String(stats.wishlist),
      icon: Heart,
      color: "from-pink-500 to-rose-600",
    },
    {
      label: "Reviews",
      value: String(stats.reviews),
      icon: Star,
      color: "from-yellow-400 to-orange-500",
    },
  ];

  const addAddressCard = () => {
    if (!addressDraft.addressLine1 || !addressDraft.city || !addressDraft.state) {
      showToast("Address line, city and state are required", "warning");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses.map((item) => ({
          ...item,
          isDefault: addressDraft.isDefault ? false : item.isDefault,
        })),
        {
          ...addressDraft,
          id: `${Date.now()}`,
          fullName: addressDraft.fullName || formData.name,
          phone: addressDraft.phone || formData.phone,
        },
      ],
    }));
    setAddressDraft({
      label: "home",
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phone: "",
      isDefault: false,
    });
  };

  const removeAddressCard = (id) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((item) => item.id !== id),
    }));
  };

  const makeDefaultAddress = (id) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((item) => ({
        ...item,
        isDefault: item.id === id,
      })),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-zoop-obsidian mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zoop-moss to-green-600 overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                  {formData.photoURL ? (
                    <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (formData.name || user?.displayName || user?.email || "G").charAt(0).toUpperCase()
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg disabled:opacity-60"
                >
                  <Edit width={16} height={16} className="text-gray-600" />
                </button>
              </div>
              {avatarUploading && <p className="text-xs text-gray-500 -mt-3 mb-3">Updating avatar...</p>}

              <h2 className="text-2xl font-black text-zoop-obsidian mb-1">
                {formData.name}
              </h2>
              <p className="text-gray-600 text-sm mb-6">{formData.email}</p>

              {/* Stats */}
              <div className="space-y-3">
                {statCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  const action =
                    stat.label === "Orders"
                      ? () => navigate("/history")
                      : stat.label === "Wishlist"
                        ? () => navigate("/wishlist")
                        : () => navigate("/history?status=delivered");
                  return (
                    <button
                      type="button"
                      onClick={action}
                      key={idx}
                      className={`w-full bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white hover:scale-[1.01] transition-transform`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-sm opacity-90">{stat.label}</p>
                          <p className="text-2xl font-black">{stat.value}</p>
                        </div>
                        {typeof Icon === "string" ? (
                          <span className="text-3xl">{Icon}</span>
                        ) : (
                          <Icon width={32} height={32} className="opacity-70" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-left">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Wishlist Snapshot
                </p>
                {wishlistItems.length === 0 ? (
                  <p className="text-xs text-gray-500">No wishlist items yet</p>
                ) : (
                  <div className="space-y-2">
                    {wishlistItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
                      >
                        <img
                          src={item.thumbnailUrl || item.image}
                          alt={item.title || item.name}
                          className="w-8 h-8 rounded object-cover bg-gray-100"
                        />
                        <span className="text-xs font-bold text-gray-700 truncate">
                          {item.title || item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-zoop-obsidian">
                  Personal Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                  >
                    <Edit width={16} height={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-zoop-moss hover:bg-zoop-moss/90 text-zoop-obsidian rounded-lg font-bold text-sm transition-colors"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                      {formData.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                      {formData.email}
                    </p>
                  )}
                </div>

                <div>
                  {isEditing ? (
                    <CountryPhoneField
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(phone, meta) => {
                        setPhoneMeta(meta || phoneMeta);
                        setFormData((prev) => ({ ...prev, phone }));
                        setErrors((prev) => ({
                          ...prev,
                          phone: phone && !isValidInternationalPhone(phone, meta || phoneMeta)
                            ? "Enter a valid phone number"
                            : "",
                        }));
                      }}
                      onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                      error={errors.phone}
                      defaultCountry="in"
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.phone}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {isEditing ? (
                    <CountryPhoneField
                      label="Alternate Phone"
                      value={formData.altPhone}
                      onChange={(phone, meta) => {
                        setAltPhoneMeta(meta || altPhoneMeta);
                        setFormData((prev) => ({ ...prev, altPhone: phone }));
                        setErrors((prev) => ({
                          ...prev,
                          altPhone: phone && !isValidInternationalPhone(phone, meta || altPhoneMeta)
                            ? "Enter a valid phone number"
                            : "",
                        }));
                      }}
                      onMetaChange={(meta) => setAltPhoneMeta(meta || altPhoneMeta)}
                      error={errors.altPhone}
                      defaultCountry="in"
                    />
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Alternate Phone
                      </label>
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.altPhone || "-"}
                      </p>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <CountryStateCityFieldset
                    country={formData.countryCode}
                    state={formData.stateCode}
                    city={formData.city}
                    required
                    errors={{
                      country: errors.countryCode,
                      state: errors.stateCode,
                      city: errors.city,
                    }}
                    onCountryChange={(countryCode) => {
                      const country = getCountryByCode(countryCode);
                      setFormData((prev) => ({
                        ...prev,
                        countryCode,
                        country: country?.name || "",
                        stateCode: "",
                        state: "",
                        city: "",
                      }));
                    }}
                    onStateChange={(stateCode) => {
                      const selected = getStateByCodeAndCountry(
                        stateCode,
                        formData.countryCode,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        stateCode,
                        state: selected?.name || "",
                        city: "",
                      }));
                    }}
                    onCityChange={(city) => setFormData((prev) => ({ ...prev, city }))}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        City
                      </label>
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.city || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        State
                      </label>
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.state || "-"}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Pincode
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        maxLength={10}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent ${
                          errors.pincode ? "border-red-500 bg-red-50" : "border-gray-200"
                        }`}
                      />
                      {errors.pincode && (
                        <p className="text-red-500 text-xs mt-1 font-bold">{errors.pincode}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                      {formData.pincode || "-"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Landmark
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.landmark || "-"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                        {formData.gender || "-"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                      {formData.dateOfBirth || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin width={24} height={24} className="text-zoop-moss" />
                <h3 className="text-xl font-black text-zoop-obsidian">
                  Delivery Address
                </h3>
              </div>

              <div>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl">
                    {formData.address}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin width={24} height={24} className="text-zoop-moss" />
                <h3 className="text-xl font-black text-zoop-obsidian">Saved Address Book</h3>
              </div>
              <div className="space-y-3">
                {Array.isArray(formData.addresses) && formData.addresses.length > 0 ? (
                  formData.addresses.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wider text-[#8b5e3c]">
                            {item.label} {item.isDefault ? "• Default" : ""}
                          </p>
                          <p className="mt-1 font-bold text-zoop-obsidian">
                            {item.fullName || formData.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {[item.addressLine1, item.addressLine2, item.city, item.state, item.postalCode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            {!item.isDefault && (
                              <button type="button" onClick={() => makeDefaultAddress(item.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-zoop-obsidian">
                                Make Default
                              </button>
                            )}
                            <button type="button" onClick={() => removeAddressCard(item.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No saved addresses yet.</p>
                )}
              </div>

              {isEditing && (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-4">
                  <p className="text-sm font-black text-zoop-obsidian mb-3">Add another address</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select value={addressDraft.label} onChange={(e) => setAddressDraft((prev) => ({ ...prev, label: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200">
                      <option value="home">Home</option>
                      <option value="office">Office</option>
                      <option value="friend_family">Friend & Family</option>
                    </select>
                    <input value={addressDraft.fullName} onChange={(e) => setAddressDraft((prev) => ({ ...prev, fullName: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Receiver name" />
                    <input value={addressDraft.addressLine1} onChange={(e) => setAddressDraft((prev) => ({ ...prev, addressLine1: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200 md:col-span-2" placeholder="Address line 1" />
                    <input value={addressDraft.addressLine2} onChange={(e) => setAddressDraft((prev) => ({ ...prev, addressLine2: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200 md:col-span-2" placeholder="Address line 2" />
                    <input value={addressDraft.city} onChange={(e) => setAddressDraft((prev) => ({ ...prev, city: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="City" />
                    <input value={addressDraft.state} onChange={(e) => setAddressDraft((prev) => ({ ...prev, state: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="State" />
                    <input value={addressDraft.postalCode} onChange={(e) => setAddressDraft((prev) => ({ ...prev, postalCode: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Pincode" />
                    <input value={addressDraft.phone} onChange={(e) => setAddressDraft((prev) => ({ ...prev, phone: e.target.value }))} className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Phone number" />
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <input type="checkbox" checked={addressDraft.isDefault} onChange={(e) => setAddressDraft((prev) => ({ ...prev, isDefault: e.target.checked }))} />
                    Make this the default location
                  </label>
                  <button type="button" onClick={addAddressCard} className="mt-4 rounded-xl bg-zoop-obsidian px-4 py-3 text-xs font-black uppercase text-white">
                    Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-zoop-obsidian mb-6">
                Account Actions
              </h3>

              <div className="space-y-4">
                <button
                  onClick={async () => {
                    try {
                      await sendPasswordResetEmail(auth, formData.email);
                      showToast("Password reset email sent", "success");
                    } catch (e) {
                      showToast(e?.message || "Could not send password reset email", "error");
                    }
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <span className="font-bold text-gray-900">
                    Change Password
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600">
                    →
                  </span>
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("notifications-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <span className="font-bold text-gray-900">
                    Notification Preferences
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600">
                    →
                  </span>
                </button>

                <button
                  onClick={() =>
                    setDeleteFlow({ open: true, otpSent: false, otp: "", reason: "", loading: false })
                  }
                  className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors group"
                >
                  <span className="font-bold">Delete Account</span>
                  <span className="opacity-60 group-hover:opacity-100">→</span>
                </button>
              </div>
            </div>

            {/* Support & Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-zoop-obsidian mb-6">
                Quick Links
              </h3>

              <div className="space-y-4">
                <Link
                  to="/track"
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <span className="font-bold text-gray-900">Track Order</span>
                  <span className="text-gray-400 group-hover:text-gray-600">
                    →
                  </span>
                </Link>

                <Link
                  to="/contact"
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <span className="font-bold text-gray-900">
                    Customer Support
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600">
                    →
                  </span>
                </Link>

                <Link
                  to="/seller/signup"
                  className="w-full flex items-center justify-between px-6 py-4 bg-zoop-moss/10 hover:bg-zoop-moss/20 rounded-xl transition-colors group"
                >
                  <span className="font-bold text-zoop-obsidian">
                    Become a Seller
                  </span>
                  <span className="text-zoop-obsidian group-hover:scale-105 transition-transform">
                    ⚡
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors group"
                >
                  <span className="font-bold">Logout</span>
                  <span className="opacity-60 group-hover:opacity-100">→</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-zoop-obsidian mb-4">Recent Orders</h3>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders.</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link key={order.id} to={`/track?orderId=${order.id}`} className="block p-3 rounded-xl bg-gray-50 hover:bg-gray-100">
                      <p className="text-sm font-bold text-zoop-obsidian">#{order.id}</p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">{order.status}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-zoop-obsidian mb-4">Support Updates</h3>
              {supportTickets.length === 0 ? (
                <p className="text-sm text-gray-500">No support tickets yet.</p>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-3 rounded-xl bg-gray-50">
                      <p className="text-sm font-bold text-zoop-obsidian">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">Status: {ticket.status}</p>
                      {Array.isArray(ticket.replies) && ticket.replies.length > 0 && (
                        <p className="text-xs text-green-700 mt-1">Reply: {ticket.replies[ticket.replies.length - 1].message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="notifications-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-zoop-obsidian mb-4">Notifications</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-xl border ${n.read ? "bg-gray-50 border-gray-100" : "bg-zoop-moss/10 border-zoop-moss/30"}`}>
                      <p className="text-sm font-bold text-zoop-obsidian">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                    </div>
                  ))}
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
                <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
                  <h3 className="text-lg font-black text-zoop-obsidian">Delete Account</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    We will send an OTP to your email for confirmation.
                  </p>
                  <textarea
                    value={deleteFlow.reason}
                    onChange={(e) => setDeleteFlow((p) => ({ ...p, reason: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3"
                    placeholder="Optional reason"
                  />
                  {deleteFlow.otpSent && (
                    <input
                      value={deleteFlow.otp}
                      onChange={(e) => setDeleteFlow((p) => ({ ...p, otp: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-3"
                      placeholder="Enter OTP"
                    />
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setDeleteFlow({ open: false, otpSent: false, otp: "", reason: "", loading: false })
                      }
                      className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold"
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
                        onClick={confirmDeleteAccount}
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
      </div>
    </div>
  );
};

export default Profile;
