import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import { apiClient } from "../../api/client";
import { authApi } from "../../services/api";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../../utils/validation";
import { getFriendlyError } from "../../utils/errorMessages";
import { PasswordStrength } from "../../components/common/PasswordStrength";
import { OTPInput } from "../../components/auth/OTPInput";
import { Toast } from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import { Eye } from "../../assets/icons/Eye";
import { EyeOff } from "../../assets/icons/EyeOff";
import { Mail } from "../../assets/icons/Mail";
import { User } from "../../assets/icons/User";
import { Lock } from "../../assets/icons/Lock";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import CountryStateCityFieldset from "../../components/common/CountryStateCityFieldset";
import {
  hasUppercase,
  isValidInternationalPhone,
  isValidPincode,
  getPincodeValidationMessage,
} from "../../utils/liveValidation";
import Seo from "../../components/shared/Seo";
import {
  sendFirebasePhoneOtp,
  resetPhoneRecaptcha,
} from "../../utils/firebasePhoneAuth";
import {
  getCountryByCode,
  getStateByCodeAndCountry,
} from "../../utils/locationData";

const Signup = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [otpProcessing, setOtpProcessing] = useState(false); // OTP verification in-progress
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: "",
    address: "",
    countryCode: "IN",
    country: "India",
    stateCode: "",
    state: "",
    city: "",
    pincode: "",
    gender: "",
    role: "customer", // always customer on signup; sellers go through /seller/onboarding after
  });
  const [phoneMeta, setPhoneMeta] = useState({
    dialCode: "91",
    countryCode: "in",
    format: "",
  });
  const [fieldSuccess, setFieldSuccess] = useState({}); // track field-level success
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const [otpChannel, setOtpChannel] = useState("email");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);

  useEffect(() => {
    if (step !== 2) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const otpSecondsLeft = useMemo(() => {
    if (!otpExpiresAt) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(otpExpiresAt).getTime() - nowTs) / 1000),
    );
  }, [otpExpiresAt, nowTs]);

  const resendSecondsLeft = useMemo(() => {
    if (!resendAvailableAt) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(resendAvailableAt).getTime() - nowTs) / 1000),
    );
  }, [resendAvailableAt, nowTs]);

  const formatMMSS = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const validateField = (field, value, nextData = formData) => {
    if (field === "displayName") {
      if (!validateName(value)) return "Name must be at least 2 characters";
      if (!hasUppercase(value)) return "Add at least one capital letter";
      return "";
    }
    if (field === "email") {
      if (!validateEmail(value)) return "Please enter a valid email address";
      return "";
    }
    if (field === "phone") {
      if (!isValidInternationalPhone(value, nextData.phoneMeta || phoneMeta)) {
        return "Please enter a valid phone number";
      }
      return "";
    }
    if (field === "address") {
      if (!value?.trim()) return "Address is required";
      return "";
    }
    if (field === "countryCode") {
      if (!value?.trim()) return "Country is required";
      return "";
    }
    if (field === "stateCode") {
      if (!value?.trim()) return "State is required";
      return "";
    }
    if (field === "city") {
      if (!value?.trim()) return "City is required";
      return "";
    }
    if (field === "pincode") {
      if (!isValidPincode(value, nextData.countryCode)) {
        return getPincodeValidationMessage(nextData.countryCode);
      }
      return "";
    }
    if (field === "password") {
      const passwordValidation = validatePassword(value);
      return passwordValidation.valid ? "" : passwordValidation.message;
    }
    return "";
  };

  const updateFormField = (field, value, nextDataOverride = {}) => {
    const nextData = {
      ...formData,
      ...nextDataOverride,
      [field]: value,
      phoneMeta,
    };
    setFormData(nextData);
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, nextData),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const dataForValidation = { ...formData, phoneMeta };

    [
      "displayName",
      "email",
      "phone",
      "address",
      "countryCode",
      "stateCode",
      "city",
      "pincode",
      "password",
    ].forEach((field) => {
      const message = validateField(field, formData[field], dataForValidation);
      if (message) newErrors[field] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      setLoading(true);
      await signInWithPopup(auth, provider);
      await authApi.syncUser({ role: "customer", mode: "signup" });
      showToast("Account created successfully!", "success");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });
      setTimeout(() => navigate("/profile?edit=1&welcome=1"), 1500);
    } catch (error) {
      console.error("Google Signup error:", error);
      const friendly = getFriendlyError(error);
      if (friendly) setGeneralError(friendly);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSubmitStatus({ type: "", message: "" });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/signup", {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        otpChannel,
      });
      setOtpRecipient(response?.otpRecipient || formData.email);
      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(
          response?.otpRecipient || formData.phone,
          { containerId: "signup-phone-recaptcha", size: "normal" },
        );
        setPhoneConfirmation(confirmation);
        setOtpExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
      } else {
        const expiresAt =
          response?.expiresAt ||
          new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const resendAfterSec = Number(response?.resendAfterSec || 60);
        setOtpExpiresAt(expiresAt);
        setResendAvailableAt(
          new Date(Date.now() + resendAfterSec * 1000).toISOString(),
        );
      }
      showToast(
        `OTP sent to your ${otpChannel === "phone" ? "phone" : "email"}!`,
        "success",
      );
      setSubmitStatus({
        type: "success",
        message: `OTP sent. Please verify your ${otpChannel}.`,
      });
      setStep(2);
    } catch (error) {
      console.error("Signup error:", error);
      const errMsg = getFriendlyError(error);
      // For duplicate account errors, highlight the email field too
      if (
        error?.code === "auth/email-already-in-use" ||
        error?.status === 409 ||
        (error?.message || "").toLowerCase().includes("already") ||
        (error?.message || "").toLowerCase().includes("exists")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered.",
        }));
        setGeneralError(
          "This email is already registered. Please log in instead.",
        );
        setSubmitStatus({
          type: "error",
          message: "Account exists already. Use Login.",
        });
      } else {
        setGeneralError(errMsg);
        setSubmitStatus({ type: "error", message: errMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    if (loading || otpProcessing) return;
    setLoading(true);
    setOtpProcessing(true);
    setGeneralError("");
    setSubmitStatus({ type: "", message: "" });
    try {
      let response;
      if (otpChannel === "phone") {
        if (!phoneConfirmation) {
          throw new Error(
            "Mobile OTP session expired. Please request a new OTP.",
          );
        }
        const phoneResult = await phoneConfirmation.confirm(otp);
        const idToken = await phoneResult.user.getIdToken();
        response = await authApi.verifyPhoneSignup({
          email: formData.email,
          idToken,
        });
      } else {
        response = await apiClient.post("/auth/verify-otp", {
          email: formData.email.trim().toLowerCase(),
          otp,
          otpChannel,
          otpRecipient,
        });
      }

      showToast("Account created successfully! Welcome to Zoop!", "success");

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });

      // Store token
      if (response.token) {
        // Authenticate with Firebase Client SDK using the custom token
        await signOut(auth).catch(() => {});
        await signInWithCustomToken(auth, response.token);
      }

      setTimeout(() => {
        // Redirect based on the ROLE selected during form fill
        if (formData.role === "seller") {
          navigate("/seller/onboarding");
        } else {
          navigate("/profile?edit=1&welcome=1");
        }
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);
      const msg = getFriendlyError(error);
      setGeneralError(msg);
      setSubmitStatus({ type: "error", message: msg });
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setOtpProcessing(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setGeneralError("");
    setSubmitStatus({ type: "", message: "" });
    try {
      const response = await authApi.resendOTP(formData.email, otpChannel);
      setOtpRecipient(response?.otpRecipient || formData.email);
      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(
          response?.otpRecipient || formData.phone,
          { containerId: "signup-phone-recaptcha", size: "normal" },
        );
        setPhoneConfirmation(confirmation);
        setOtpExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
      } else {
        const expiresAt =
          response?.expiresAt ||
          new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const resendAfterSec = Number(response?.resendAfterSec || 60);
        setOtpExpiresAt(expiresAt);
        setResendAvailableAt(
          new Date(Date.now() + resendAfterSec * 1000).toISOString(),
        );
      }
      showToast(
        `New OTP sent to your ${otpChannel === "phone" ? "phone" : "email"}!`,
        "success",
      );
      setSubmitStatus({ type: "success", message: "A new OTP has been sent." });
    } catch (error) {
      console.error("Resend OTP error:", error);
      const msg = getFriendlyError(error);
      setGeneralError(msg);
      setSubmitStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => resetPhoneRecaptcha(), []);

  return (
    <div className="bg-gradient-to-br from-zoop-moss/20 via-white to-zoop-moss/10 p-3 sm:p-4 rounded-[1.75rem] sm:rounded-3xl">
      <Seo
        title="Sign Up | Zoop"
        description="Create your Zoop account."
        robots="noindex,nofollow"
        canonicalPath="/signup"
      />
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* OTP Processing Overlay */}
      {otpProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-xl font-black text-zoop-obsidian">
                Verifying OTP...
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Creating your account, please wait.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-[1.75rem] sm:rounded-3xl shadow-2xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block text-3xl font-black text-zoop-moss mb-4"
            >
              ZOOP<span className="text-zoop-obsidian text-xs italic">.in</span>
            </Link>
            <h1 className="text-2xl font-black text-zoop-obsidian mb-1">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 1
                ? "Join Zoop and start shopping locally"
                : `Enter the OTP sent to your ${otpChannel === "phone" ? "phone number" : "email"}`}
            </p>
          </div>

          {/* General Error */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-bold">{generalError}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    width={20}
                    height={20}
                  />
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => {
                      setFormData({ ...formData, displayName: e.target.value });
                      setGeneralError("");
                      if (e.target.value.length >= 2)
                        setFieldSuccess((s) => ({ ...s, displayName: true }));
                      else
                        setFieldSuccess((s) => ({ ...s, displayName: false }));
                      setErrors((prev) => ({
                        ...prev,
                        displayName: validateField(
                          "displayName",
                          e.target.value,
                          {
                            ...formData,
                            displayName: e.target.value,
                          },
                        ),
                      }));
                    }}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.displayName
                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : fieldSuccess.displayName
                          ? "border-zoop-moss bg-zoop-moss/5 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                          : "border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.displayName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    width={20}
                    height={20}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setGeneralError("");
                      setErrors((prev) => ({
                        ...prev,
                        email: validateField("email", e.target.value, {
                          ...formData,
                          email: e.target.value,
                        }),
                      }));
                      // Basic email format check for real-time feedback
                      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        e.target.value,
                      );
                      setFieldSuccess((s) => ({ ...s, email: isValidEmail }));
                    }}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.email
                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : fieldSuccess.email
                          ? "border-zoop-moss bg-zoop-moss/5 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                          : "border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* No role selector - signup is customer-only */}
              {/* Sellers get a separate entry point below */}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  OTP Delivery
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setOtpChannel("email")}
                    className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "email" ? "bg-white text-zoop-obsidian shadow-sm" : "text-gray-500"}`}
                  >
                    Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel("phone")}
                    className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "phone" ? "bg-white text-zoop-obsidian shadow-sm" : "text-gray-500"}`}
                  >
                    Mobile OTP
                  </button>
                </div>
                {otpChannel === "phone" && (
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Enter your mobile number in international format. Example:
                    {" "}
                    <span className="font-bold text-zoop-obsidian">
                      +91 9876543210
                    </span>
                  </p>
                )}
              </div>

              {otpChannel === "phone" && (
                <div
                  id="signup-phone-recaptcha"
                  className="overflow-hidden rounded-2xl"
                />
              )}

              <CountryPhoneField
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(value, countryData) => {
                  setGeneralError("");
                  const nextPhoneMeta = countryData || phoneMeta;
                  setPhoneMeta(nextPhoneMeta);
                  updateFormField("phone", value, { phoneMeta: nextPhoneMeta });
                }}
                onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                error={errors.phone}
                defaultCountry="in"
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setErrors((prev) => ({
                      ...prev,
                      address: validateField("address", e.target.value, {
                        ...formData,
                        address: e.target.value,
                      }),
                    }));
                  }}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                    errors.address
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.address}
                  </p>
                )}
              </div>

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
                  const nextData = {
                    ...formData,
                    phoneMeta,
                    countryCode,
                    country: country?.name || "",
                    stateCode: "",
                    state: "",
                    city: "",
                  };
                  setFormData(nextData);
                  setErrors((prev) => ({
                    ...prev,
                    countryCode: validateField(
                      "countryCode",
                      countryCode,
                      nextData,
                    ),
                    stateCode: validateField("stateCode", "", nextData),
                    city: validateField("city", "", nextData),
                  }));
                }}
                onStateChange={(stateCode) => {
                  const selectedState = getStateByCodeAndCountry(
                    stateCode,
                    formData.countryCode,
                  );
                  const nextData = {
                    ...formData,
                    phoneMeta,
                    stateCode,
                    state: selectedState?.name || "",
                    city: "",
                  };
                  setFormData(nextData);
                  setErrors((prev) => ({
                    ...prev,
                    stateCode: validateField("stateCode", stateCode, nextData),
                    city: validateField("city", "", nextData),
                  }));
                }}
                onCityChange={(city) => {
                  const nextData = { ...formData, city, phoneMeta };
                  setFormData(nextData);
                  setErrors((prev) => ({
                    ...prev,
                    city: validateField("city", city, nextData),
                  }));
                }}
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, pincode: value });
                    setErrors((prev) => ({
                      ...prev,
                      pincode: validateField("pincode", value, {
                        ...formData,
                        pincode: value,
                      }),
                    }));
                  }}
                  maxLength={10}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                    errors.pincode
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                  }`}
                />
                {errors.pincode && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.pincode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20 outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    width={20}
                    height={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setGeneralError("");
                      setErrors((prev) => ({ ...prev, password: "" }));
                      setFieldSuccess((s) => ({
                        ...s,
                        password: e.target.value.length >= 8,
                      }));
                    }}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.password
                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : fieldSuccess.password
                          ? "border-zoop-moss bg-zoop-moss/5 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                          : "border-gray-200 focus:border-zoop-moss focus:ring-2 focus:ring-zoop-moss/20"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff width={20} height={20} />
                    ) : (
                      <Eye width={20} height={20} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.password}
                  </p>
                )}
                <PasswordStrength password={formData.password} />
              </div>

              {submitStatus.message && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    submitStatus.type === "error"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-green-300 bg-green-50 text-green-700"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-white rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  submitStatus.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-zoop-obsidian hover:bg-zoop-moss hover:text-zoop-obsidian"
                }`}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 bg-gray-200 h-px w-full"></div>
                <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </button>

              {/* Login & Seller Links */}
              <p className="text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-zoop-moss font-bold hover:underline"
                >
                  Login
                </Link>
              </p>
              <p className="text-center text-sm text-gray-500 font-bold">
                Want to sell on Zoop?{" "}
                <Link
                  to="/seller/signup"
                  className="text-zoop-obsidian hover:underline"
                >
                  Create a seller account
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              {/* OTP Input */}
              <OTPInput
                length={6}
                onComplete={handleOTPComplete}
                disabled={loading}
              />

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-gray-600 mb-2">Didn't receive the code?</p>
                <p className="text-xs text-gray-500 mb-2">
                  OTP expires in {formatMMSS(otpSecondsLeft)}
                </p>
                <button
                  onClick={handleResendOTP}
                  disabled={loading || resendSecondsLeft > 0}
                  className="text-zoop-moss font-bold hover:underline disabled:opacity-50"
                >
                  {resendSecondsLeft > 0
                    ? `Resend in ${formatMMSS(resendSecondsLeft)}`
                    : "Resend OTP"}
                </button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setStep(1);
                  setGeneralError("");
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Back to Signup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
