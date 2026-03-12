import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { useUser } from "../../context/UserContext";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import { Check } from "../../assets/icons/Check";
import { useToast } from "../../context/ToastContext";
import { authApi, contentApi, ordersApi } from "../../services/api";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import CountryStateCityFieldset from "../../components/common/CountryStateCityFieldset";
import { useSiteConfig } from "../../context/SiteConfigContext";
import {
  isValidEmail,
  isValidInternationalPhone,
  isValidPincode,
  getPincodeValidationMessage,
} from "../../utils/liveValidation";
import { getCountryByCode, getStateByCodeAndCountry, getStatesOfCountry } from "../../utils/locationData";
import { formatInrWithSymbol } from "../../utils/currency";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, location } = useUser();
  const { showToast } = useToast();
  const { brandName } = useSiteConfig();
  const brandSlug = String(brandName || "order")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const brandOrderPrefix =
    String(brandName || "order")
      .trim()
      .replace(/[^a-z0-9]+/gi, "")
      .toUpperCase() || "ORDER";

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [formData, setFormData] = useState({
    fullName: user?.displayName || user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    countryCode: "IN",
    country: "India",
    stateCode: "",
    city: location || "",
    state: "",
    pincode: "",
    landmark: "",
    paymentMethod: "", // cod, upi, card, netbanking
    saveAddress: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [phoneMeta, setPhoneMeta] = useState({ dialCode: "91", countryCode: "in", format: "" });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [blockedItems, setBlockedItems] = useState([]);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [offers, setOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");

  React.useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        if (cancelled) return;
        setFormData((prev) => ({
          ...prev,
          fullName: profile.displayName || profile.name || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          address: profile.address || prev.address,
          city: profile.city || prev.city,
          state: profile.state || prev.state,
          pincode: profile.pincode || prev.pincode,
          landmark: profile.landmark || prev.landmark,
        }));
        if (profile?.state) {
          const states = getStatesOfCountry("IN");
          const matchedState = states.find(
            (item) => item.name.toLowerCase() === String(profile.state || "").toLowerCase(),
          );
          if (matchedState?.isoCode) {
            setFormData((prev) => ({ ...prev, stateCode: matchedState.isoCode }));
          }
        }
      } catch {
        // Keep local fallback values
      }
    };
    if (user?.uid) void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  React.useEffect(() => {
    let cancelled = false;
    contentApi
      .getOffers()
      .then((items) => {
        if (!cancelled) setOffers(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      showToast("Your cart is empty!", "error");
      navigate("/cart");
    }
  }, [cartItems, orderPlaced, navigate]);

  React.useEffect(() => {
    return () => {
      ordersApi.releaseCheckout().catch(() => {});
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    if (name === "email") {
      setFormErrors((prev) => ({
        ...prev,
        email:
          nextValue && !isValidEmail(nextValue) ? "Please enter a valid email address" : "",
      }));
    }
    if (name === "fullName") {
      setFormErrors((prev) => ({
        ...prev,
        fullName: nextValue?.trim() ? "" : "Full name is required",
      }));
    }
    if (name === "address") {
      setFormErrors((prev) => ({
        ...prev,
        address: nextValue?.trim() ? "" : "Address is required",
      }));
    }
    if (name === "pincode") {
      setFormErrors((prev) => ({
        ...prev,
        pincode: isValidPincode(nextValue, formData.countryCode)
          ? ""
          : getPincodeValidationMessage(formData.countryCode),
      }));
    }
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      const required = ["fullName", "phone", "address", "city", "pincode"];
      const missing = required.filter((field) => !formData[field]?.trim());

      if (missing.length > 0) {
        return {
          valid: false,
          message: `Please fill in: ${missing.join(", ")}`,
        };
      }
      if (!isValidInternationalPhone(formData.phone, phoneMeta)) {
        return {
          valid: false,
          message: "Please enter a valid phone number",
        };
      }
      if (!formData.countryCode || !formData.stateCode || !formData.city) {
        return {
          valid: false,
          message: "Please select country, state and city in order",
        };
      }
      if (!isValidPincode(formData.pincode, formData.countryCode)) {
        return {
          valid: false,
          message: getPincodeValidationMessage(formData.countryCode),
        };
      }
      return { valid: true };
    }
    if (currentStep === 2) {
      if (!formData.paymentMethod) {
        return { valid: false, message: "Please select a payment method" };
      }
      return { valid: true };
    }
    return { valid: true };
  };

  const handleNext = () => {
    const validation = validateStep(step);
    if (validation.valid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showToast(
        validation.message || "Please fill all required fields",
        "error",
      );
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelCheckout = async () => {
    await ordersApi.releaseCheckout().catch(() => {});
    showToast("Checkout cancelled. Reserved items are released.", "info");
    navigate("/cart");
  };

  // Calculate totals
  const subtotal = getCartTotal();
  const shipping = cartItems.some((item) => item.type === "National") ? 150 : 0;
  const tax = Math.round(subtotal * 0.05);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) || null;
  const selectedOfferDiscount = React.useMemo(() => {
    if (!selectedOffer) return 0;
    if (subtotal < Number(selectedOffer.minOrderAmount || 0)) return 0;
    const baseAmount = selectedOffer.scope === "shipping" ? shipping : subtotal;
    const rawDiscount =
      selectedOffer.discountType === "flat"
        ? Number(selectedOffer.discountValue || 0)
        : Math.round((baseAmount * Number(selectedOffer.discountValue || 0)) / 100);
    const capped = selectedOffer.maxDiscountAmount
      ? Math.min(rawDiscount, Number(selectedOffer.maxDiscountAmount || 0))
      : rawDiscount;
    return Math.max(0, Math.min(baseAmount, capped));
  }, [selectedOffer, shipping, subtotal]);
  const currentTotal = Math.max(0, subtotal + shipping + tax - selectedOfferDiscount);

  const handlePlaceOrder = async () => {
    const validation = validateStep(2);
    if (!validation.valid) {
      showToast(validation.message || "Please complete payment selection", "error");
      return;
    }
    setPlacingOrder(true);
    try {
      const normalizedItems = cartItems.map((item) => ({
        productId: item.id,
        quantity: Number(item.quantity) || 1,
      }));
      const basePayload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: Number(item.quantity) || 1,
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.pincode,
          country: formData.country || "India",
          fullName: formData.fullName,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod || "cod",
        appliedOffer: selectedOffer
          ? {
              id: selectedOffer.id,
              code: selectedOffer.code || "",
              title: selectedOffer.title,
              discountAmount: selectedOfferDiscount,
              scope: selectedOffer.scope || "order",
            }
          : undefined,
      };

      let response;
      if (formData.paymentMethod === "cod") {
        response = await ordersApi.create(basePayload);
      } else {
        const sdkLoaded = await loadRazorpayCheckoutScript();
        if (!sdkLoaded || !window.Razorpay) {
          throw new Error("Could not load Razorpay checkout. Please try again.");
        }

        const paymentOrderResponse = await ordersApi.createRazorpayOrder({
          items: normalizedItems,
          receipt: `${brandSlug || "order"}_${Date.now().toString().slice(-10)}`,
          notes: {
            customer_uid: user?.uid || "guest",
            customer_email: formData.email || "",
          },
          appliedOffer: selectedOffer
            ? {
                id: selectedOffer.id,
                code: selectedOffer.code || "",
                title: selectedOffer.title,
                discountAmount: selectedOfferDiscount,
                scope: selectedOffer.scope || "order",
              }
            : undefined,
        });
        const razorpayOrder = paymentOrderResponse?.order;
        if (!razorpayOrder?.id) {
          throw new Error("Could not initialize payment. Please retry.");
        }

        const keyId =
          paymentOrderResponse?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!keyId) {
          throw new Error("Razorpay key is not configured in frontend env.");
        }
        const backendMode = String(paymentOrderResponse?.keyId || "").startsWith("rzp_live_")
          ? "live"
          : String(paymentOrderResponse?.keyId || "").startsWith("rzp_test_")
            ? "test"
            : "";
        const frontendMode = String(import.meta.env.VITE_RAZORPAY_KEY_ID || "").startsWith("rzp_live_")
          ? "live"
          : String(import.meta.env.VITE_RAZORPAY_KEY_ID || "").startsWith("rzp_test_")
            ? "test"
            : "";
        if (backendMode && frontendMode && backendMode !== frontendMode) {
          throw new Error(
            `Razorpay mode mismatch detected. Backend is using ${backendMode} keys while frontend is using ${frontendMode} keys.`,
          );
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency || "INR",
            name: brandName,
            description: `${brandName} Order Payment`,
            order_id: razorpayOrder.id,
            prefill: {
              name: formData.fullName,
              email: formData.email,
              contact: formData.phone,
            },
            notes: razorpayOrder.notes || {},
            theme: { color: "#6b8f5b" },
            handler: (payment) => resolve(payment),
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled by user")),
            },
          });
          rzp.on("payment.failed", (resp) => {
            const reason =
              resp?.error?.description ||
              resp?.error?.reason ||
              "Payment failed";
            reject(new Error(reason));
          });
          rzp.open();
        });

        await ordersApi.verifyRazorpayPayment({
          razorpayOrderId: paymentResult.razorpay_order_id,
          razorpayPaymentId: paymentResult.razorpay_payment_id,
          razorpaySignature: paymentResult.razorpay_signature,
        });

        response = await ordersApi.create({
          ...basePayload,
          paymentDetails: {
            provider: "razorpay",
            razorpayOrderId: paymentResult.razorpay_order_id,
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            razorpaySignature: paymentResult.razorpay_signature,
          },
        });
      }

      const createdOrder = response?.order || {};
      setFinalTotal(createdOrder.totalAmount || currentTotal);
      setOrderId(
        createdOrder.id || `${brandOrderPrefix}${Date.now().toString().slice(-8)}`,
      );
      setOrderPlaced(true);
      clearCart();
      await ordersApi.releaseCheckout().catch(() => {});
      setTimeout(() => {
        navigate("/history");
      }, 2500);
    } catch (e) {
      const maybeBlocked = e?.data?.blockedItems || e?.blockedItems;
      if (Array.isArray(maybeBlocked) && maybeBlocked.length) {
        setBlockedItems(maybeBlocked);
        setShowBlockedPopup(true);
      } else if (Array.isArray(e?.missingFields) || Array.isArray(e?.data?.missingFields)) {
        const missing = e?.missingFields || e?.data?.missingFields;
        showToast(
          `Please complete profile fields before ordering: ${missing.join(", ")}`,
          "warning",
        );
        navigate("/profile");
      } else {
        showToast(e?.message || "Could not place order. Please try again.", "error");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-zoop-canvas flex items-center justify-center p-4">
        <div className="bg-white dark:glass-card rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check width={40} height={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-900 text-zoop-obsidian dark:text-white mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your order. We'll send you a confirmation email
            shortly.
          </p>
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order ID</span>
              <span className="font-black text-zoop-obsidian dark:text-white">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
              <span className="text-2xl font-900 text-zoop-moss">
                {formatInrWithSymbol(finalTotal, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to home page...
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-zoop-obsidian text-white px-8 py-3 rounded-xl font-black hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zoop-canvas py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Progress Steps */}
        <div className="bg-white dark:glass-card rounded-2xl p-6 mb-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: "Address" },
              { num: 2, label: "Payment" },
              { num: 3, label: "Review" },
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                      step >= s.num
                        ? "bg-zoop-moss text-zoop-obsidian dark:text-white"
                        : "bg-gray-200 dark:bg-white/20 text-gray-400"
                    }`}
                  >
                    {step > s.num ? <Check width={20} height={20} /> : s.num}
                  </div>
                  <span
                    className={`mt-2 text-xs md:text-sm font-bold ${
                      step >= s.num ? "text-zoop-obsidian dark:text-white" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 md:mx-4 rounded transition-all ${
                      step > s.num ? "bg-zoop-moss" : "bg-gray-200 dark:bg-white/20"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:glass-card rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {/* Step 1: Delivery Address */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-900 text-zoop-obsidian dark:text-white mb-6">
                    Delivery Address
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-zoop-moss"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <CountryPhoneField
                          label="Phone Number"
                          required
                          value={formData.phone}
                          onChange={(phone, meta) => {
                            setPhoneMeta(meta || phoneMeta);
                            setFormData((prev) => ({ ...prev, phone }));
                            setFormErrors((prev) => ({
                              ...prev,
                              phone: isValidInternationalPhone(phone, meta || phoneMeta)
                                ? ""
                                : "Please enter a valid phone number",
                            }));
                          }}
                          onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                          error={formErrors.phone}
                          defaultCountry="in"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zoop-moss ${
                            formErrors.email ? "border-red-500 bg-red-50" : "border-gray-200 dark:border-white/10"
                          }`}
                          placeholder="john@example.com"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.email}</p>
                        )}
                      </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zoop-moss ${
                          formErrors.address ? "border-red-500 bg-red-50" : "border-gray-200 dark:border-white/10"
                        }`}
                        placeholder="House No, Building Name, Street, Area"
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.address}</p>
                      )}
                    </div>

                    <CountryStateCityFieldset
                      country={formData.countryCode}
                      state={formData.stateCode}
                      city={formData.city}
                      required
                      errors={{
                        country: formErrors.countryCode,
                        state: formErrors.stateCode,
                        city: formErrors.city,
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
                        setFormErrors((prev) => ({
                          ...prev,
                          countryCode: countryCode ? "" : "Country is required",
                          stateCode: "State is required",
                          city: "City is required",
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
                        setFormErrors((prev) => ({
                          ...prev,
                          stateCode: stateCode ? "" : "State is required",
                          city: "City is required",
                        }));
                      }}
                      onCityChange={(city) => {
                        setFormData((prev) => ({ ...prev, city }));
                        setFormErrors((prev) => ({
                          ...prev,
                          city: city ? "" : "City is required",
                        }));
                      }}
                    />

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        maxLength="10"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zoop-moss ${
                          formErrors.pincode ? "border-red-500 bg-red-50" : "border-gray-200 dark:border-white/10"
                        }`}
                        placeholder="395003"
                      />
                      {formErrors.pincode && (
                        <p className="text-red-500 text-xs mt-1 font-bold">{formErrors.pincode}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-zoop-moss"
                        placeholder="Near City Mall"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="saveAddress"
                        checked={formData.saveAddress}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Save this address for future orders
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-900 text-zoop-obsidian dark:text-white mb-6">
                    Payment Method
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        id: "cod",
                        label: "Cash on Delivery",
                        desc: "Pay when you receive",
                      },
                      {
                        id: "upi",
                        label: "UPI Payment",
                        desc: "Google Pay, PhonePe, Paytm",
                      },
                      {
                        id: "card",
                        label: "Credit/Debit Card",
                        desc: "Visa, Mastercard, RuPay",
                      },
                      {
                        id: "netbanking",
                        label: "Net Banking",
                        desc: "All major banks",
                      },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.paymentMethod === method.id
                            ? "border-zoop-moss bg-zoop-moss/10"
                            : "border-gray-200 dark:border-white/10 hover:border-zoop-moss/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-zoop-obsidian dark:text-white">
                            {method.label}
                          </p>
                          <p className="text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-900 text-zoop-obsidian dark:text-white mb-6">
                    Review Your Order
                  </h2>
                  {/* Delivery Address Summary */}
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-zoop-obsidian dark:text-white">
                        Delivery Address
                      </h3>
                      <button
                        onClick={() => setStep(1)}
                        className="text-sm text-zoop-moss font-bold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {formData.fullName}
                      <br />
                      {formData.address}
                      <br />
                      {formData.city}, {formData.state} - {formData.pincode}
                      <br />
                      Phone: {formData.phone}
                    </p>
                  </div>

                  {/* Payment Method Summary */}
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-zoop-obsidian dark:text-white">
                        Payment Method
                      </h3>
                      <button
                        onClick={() => setStep(2)}
                        className="text-sm text-zoop-moss font-bold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {!formData.paymentMethod && "Not selected yet"}
                      {formData.paymentMethod === "cod" && "Cash on Delivery"}
                      {formData.paymentMethod === "upi" && "UPI Payment"}
                      {formData.paymentMethod === "card" && "Credit/Debit Card"}
                      {formData.paymentMethod === "netbanking" && "Net Banking"}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={handleCancelCheckout}
                  className="px-5 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                >
                  Cancel Checkout
                </button>
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 border-2 border-gray-200 dark:border-white/10 rounded-xl font-bold hover:border-zoop-obsidian transition-all"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-xl font-black hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight width={20} height={20} />
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="flex-1 py-3 bg-zoop-obsidian text-white rounded-xl font-black hover:bg-zoop-moss hover:text-zoop-obsidian transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {placingOrder ? "Placing Order..." : "Place Order"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
              <h3 className="font-900 text-lg text-zoop-obsidian dark:text-white mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-bold">
                    {formatInrWithSymbol(subtotal, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-bold">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatInrWithSymbol(shipping, {
                        maximumFractionDigits: 0,
                      })
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax (5%)</span>
                  <span className="font-bold">
                    {formatInrWithSymbol(tax, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                {selectedOfferDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>{selectedOffer?.title || "Offer"} discount</span>
                    <span className="font-bold">
                      -{formatInrWithSymbol(selectedOfferDiscount, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zoop-obsidian dark:text-white">Offers & Coupons</p>
                    <p className="text-xs text-gray-500">Choose any active order or shipping discount.</p>
                  </div>
                  {selectedOfferId && (
                    <button
                      type="button"
                      onClick={() => setSelectedOfferId("")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {offers.length === 0 ? (
                    <p className="text-xs text-gray-500">No offers available right now.</p>
                  ) : (
                    offers.map((offer) => {
                      const disabled = subtotal < Number(offer.minOrderAmount || 0);
                      return (
                        <label
                          key={offer.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 ${
                            selectedOfferId === offer.id
                              ? "border-zoop-moss bg-zoop-moss/10"
                              : "border-gray-200 dark:border-white/10 bg-white dark:glass-card"
                          } ${disabled ? "opacity-50" : ""}`}
                        >
                          <input
                            type="radio"
                            name="selectedOffer"
                            checked={selectedOfferId === offer.id}
                            disabled={disabled}
                            onChange={() => setSelectedOfferId(offer.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-black text-zoop-obsidian dark:text-white">
                              {offer.title} {offer.code ? `(${offer.code})` : ""}
                            </p>
                            <p className="text-xs text-gray-500">{offer.description}</p>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#8b5e3c]">
                              {offer.discountType === "flat"
                                ? `Flat ${formatInrWithSymbol(offer.discountValue, {
                                    maximumFractionDigits: 0,
                                  })}`
                                : `${offer.discountValue}% off`} on {offer.scope || "order"}
                              {offer.minOrderAmount
                                ? ` • Min ${formatInrWithSymbol(offer.minOrderAmount, {
                                    maximumFractionDigits: 0,
                                  })}`
                                : ""}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-2xl font-900 text-zoop-obsidian dark:text-white">
                  {formatInrWithSymbol(currentTotal, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>

              {/* Added Order Items to Sidebar for re-verification */}
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                <h3 className="text-sm font-black text-zoop-obsidian dark:text-white uppercase tracking-widest mb-4">
                  Items Details ({cartItems.length})
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                      className="flex gap-4 group"
                    >
                      <div className="w-16 h-16 shrink-0 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10">
                        <img
                          src={
                            item.thumbnailUrl ||
                            item.image ||
                            "/brand-mark.svg"
                          }
                          alt={item.title || item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-zoop-obsidian dark:text-white truncate">
                          {item.title || item.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.brand} • Qty: {item.quantity}
                        </p>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-[10px] text-gray-400">
                            {item.selectedSize && `Size: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && " • "}
                            {item.selectedColor &&
                              `Color: ${item.selectedColor}`}
                          </p>
                        )}
                        <p className="font-black text-xs text-zoop-obsidian dark:text-white mt-1">
                          {formatInrWithSymbol(
                            Number(item.price || 0) * Number(item.quantity || 0),
                            { maximumFractionDigits: 0 },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {step === 3 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                  <p className="text-xs text-gray-500 text-center">
                    By placing this order, you agree to our Terms & Conditions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showBlockedPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlockedPopup(false)} />
          <div className="relative bg-white dark:glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
            <h4 className="text-lg font-900 text-zoop-obsidian dark:text-white mb-3">Checkout Unavailable</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Some items are currently being purchased by another user.
            </p>
            {blockedItems.length > 0 && (
              <ul className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
                {blockedItems.map((b) => (
                  <li key={b.productId}>
                    Product {cartItems.find((c) => c.id === b.productId)?.title || b.productId} available qty: {b.availableQty}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowBlockedPopup(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBlockedPopup(false);
                  setBlockedItems([]);
                  navigate("/products");
                }}
                className="flex-1 py-2.5 bg-zoop-obsidian text-white rounded-lg font-bold"
              >
                Shop Another
              </button>
              <button
                type="button"
                disabled={notifySubmitting}
                onClick={async () => {
                  setNotifySubmitting(true);
                  try {
                    await Promise.all(
                      blockedItems.map((item) => contentApi.subscribeStockAlert(item.productId)),
                    );
                    showToast("We will notify you when these items are back in stock.", "success");
                    setShowBlockedPopup(false);
                    setBlockedItems([]);
                  } catch (e) {
                    showToast(e?.message || "Could not set availability alerts", "error");
                  } finally {
                    setNotifySubmitting(false);
                  }
                }}
                className="flex-1 py-2.5 bg-zoop-moss text-zoop-obsidian dark:text-white rounded-lg font-bold disabled:opacity-60"
              >
                {notifySubmitting ? "Please wait..." : "Notify Me"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
