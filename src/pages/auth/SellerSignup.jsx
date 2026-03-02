import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
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
import { hasUppercase, isValidInternationalPhone } from "../../utils/liveValidation";

const SellerSignup = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: "",
    role: "seller",
  });
  const [phoneMeta, setPhoneMeta] = useState({ dialCode: "91", countryCode: "in", format: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    if (step !== 2) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const otpSecondsLeft = useMemo(() => {
    if (!otpExpiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - nowTs) / 1000));
  }, [otpExpiresAt, nowTs]);

  const resendSecondsLeft = useMemo(() => {
    if (!resendAvailableAt) return 0;
    return Math.max(0, Math.ceil((new Date(resendAvailableAt).getTime() - nowTs) / 1000));
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
        return "Please enter a valid phone number for selected country";
      }
      return "";
    }
    if (field === "password") {
      const passwordValidation = validatePassword(value);
      return passwordValidation.valid ? "" : passwordValidation.message;
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    ["displayName", "email", "phone", "password"].forEach((field) => {
      const message = validateField(field, nextValue(field, formData), formData);
      if (message) newErrors[field] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextValue = (field, data) => data?.[field] || "";

  const updateFormField = (field, value) => {
    const nextData = { ...formData, [field]: value, phoneMeta };
    setFormData(nextData);
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value, nextData) }));
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      setLoading(true);
      await signInWithPopup(auth, provider);

      // Register as seller then go to onboarding
      await apiClient.post("/auth/sync", { role: "seller" });

      showToast(
        "Seller account created! Let's finish your profile.",
        "success",
      );
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });

      setTimeout(() => navigate("/seller/onboarding"), 1500);
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
      const response = await apiClient.post("/auth/signup", formData);
      const expiresAt =
        response?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const resendAfterSec = Number(response?.resendAfterSec || 60);
      setOtpExpiresAt(expiresAt);
      setResendAvailableAt(new Date(Date.now() + resendAfterSec * 1000).toISOString());
      showToast("OTP sent to your email!", "success");
      setSubmitStatus({ type: "success", message: "OTP sent. Enter OTP to continue." });
      setStep(2);
    } catch (error) {
      console.error("Signup error:", error);
      const msg = getFriendlyError(error);
      setGeneralError(msg);
      setSubmitStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    setLoading(true);
    setGeneralError("");
    try {
      const response = await apiClient.post("/auth/verify-otp", {
        email: formData.email,
        otp,
      });

      showToast("Email verified! Setting up your seller profile...", "success");

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });

      if (response.token) {
        localStorage.setItem("authToken", response.token);
        await signInWithCustomToken(auth, response.token);
      }

      setTimeout(() => {
        navigate("/seller/onboarding");
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);
      const msg = getFriendlyError(error);
      setGeneralError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setGeneralError("");
    setSubmitStatus({ type: "", message: "" });
    try {
      const response = await authApi.resendOTP(formData.email);
      const expiresAt =
        response?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const resendAfterSec = Number(response?.resendAfterSec || 60);
      setOtpExpiresAt(expiresAt);
      setResendAvailableAt(new Date(Date.now() + resendAfterSec * 1000).toISOString());
      showToast("New OTP sent to your email!", "success");
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

  return (
    <div className="min-h-screen rounded-3xl bg-gradient-to-br from-zoop-white to-zoop-copper flex items-center justify-center p-4">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-zoop-copper">
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block text-3xl font-black text-zoop-copper mb-4"
            >
              ZOOP
              <span className="text-zoop-obsidian text-xs italic">.seller</span>
            </Link>
            <h1 className="text-2xl font-black text-zoop-obsidian mb-1">
              {step === 1 ? "Become a Seller" : "Verify Email"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 1
                ? "Reach thousands of customers today"
                : `Enter the OTP sent to ${formData.email}`}
            </p>
          </div>

          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-bold">{generalError}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => updateFormField("displayName", e.target.value)}
                    disabled={loading}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.displayName ? "border-red-500" : loading ? "border-zoop-copper bg-zoop-copper/5 animate-pulse" : "border-gray-200"} focus:border-zoop-copper outline-none`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Work Email
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
                    onChange={(e) => updateFormField("email", e.target.value)}
                    disabled={loading}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.email ? "border-red-500" : loading ? "border-zoop-copper bg-zoop-copper/5 animate-pulse" : "border-gray-200"} focus:border-zoop-copper outline-none`}
                    placeholder="business@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>

              <CountryPhoneField
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(value, countryData) => {
                  const nextPhoneMeta = countryData || phoneMeta;
                  setPhoneMeta(nextPhoneMeta);
                  const nextData = { ...formData, phoneMeta: nextPhoneMeta };
                  setFormData((prev) => ({ ...prev, phone: value, phoneMeta: nextPhoneMeta }));
                  setErrors((prev) => ({
                    ...prev,
                    phone: validateField("phone", value, nextData),
                  }));
                }}
                onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                error={errors.phone}
                disabled={loading}
                defaultCountry="in"
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Choose Password
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
                    onChange={(e) => updateFormField("password", e.target.value)}
                    disabled={loading}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${errors.password ? "border-red-500" : loading ? "border-zoop-copper bg-zoop-copper/5 animate-pulse" : "border-gray-200"} focus:border-zoop-copper outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff width={20} height={20} />
                    ) : (
                      <Eye width={20} height={20} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-bold">{errors.password}</p>
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                  submitStatus.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-zoop-copper hover:bg-zoop-obsidian"
                }`}
              >
                {loading ? "Processing..." : "Continue to Setup"}
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
                Signup as Seller with Google
              </button>

              <p className="text-center text-gray-600 text-sm">
                Already a seller?{" "}
                <Link
                  to="/login"
                  className="text-zoop-copper font-bold hover:underline"
                >
                  Login here
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <OTPInput
                length={6}
                onComplete={handleOTPComplete}
                disabled={loading}
              />
              <button
                onClick={handleResendOTP}
                disabled={loading || resendSecondsLeft > 0}
                className="text-zoop-copper font-bold hover:underline"
              >
                {resendSecondsLeft > 0
                  ? `Resend in ${formatMMSS(resendSecondsLeft)}`
                  : "Resend OTP"}
              </button>
              <p className="text-xs text-gray-500">
                OTP expires in {formatMMSS(otpSecondsLeft)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSignup;
