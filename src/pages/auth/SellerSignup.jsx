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
import {
  hasUppercase,
  isValidInternationalPhone,
} from "../../utils/liveValidation";
import Seo from "../../components/shared/Seo";
import {
  sendFirebasePhoneOtp,
  resetPhoneRecaptcha,
} from "../../utils/firebasePhoneAuth";

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
  const [phoneMeta, setPhoneMeta] = useState({
    dialCode: "91",
    countryCode: "in",
    format: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
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
      const message = validateField(field, formData[field], formData);
      if (message) newErrors[field] = message;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormField = (field, value) => {
    const nextData = { ...formData, [field]: value, phoneMeta };
    setFormData(nextData);
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, nextData),
    }));
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      setLoading(true);
      await signInWithPopup(auth, provider);
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (token) localStorage.setItem("authToken", token);
      } catch (e) {
        console.error("Failed to get ID token after Google signup:", e);
      }

      let syncedUser = {};
      try {
        const syncResponse = await authApi.syncUser({ role: "seller", mode: "signup" });
        syncedUser = syncResponse?.data?.user || {};
      } catch (e) {
        console.error("Seller user sync error after Google signup:", e);
      }
      const sellerPath = syncedUser?.verificationStatus === "approved" ? "/seller/dashboard" : (syncedUser?.verificationStatus === "pending" || syncedUser?.verificationStatus === "rejected") ? "/seller/waiting" : "/seller/onboarding";

      showToast("Seller account ready. Continue setup.", "success");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });
      setTimeout(() => navigate(sellerPath), 1200);
    } catch (error) {
      console.error("Google error:", error);
      setGeneralError(getFriendlyError(error));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/signup", {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        otpChannel,
      });
      setOtpRecipient(response?.data?.otpRecipient || formData.email);
      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(response?.data?.otpRecipient || formData.phone);
        setPhoneConfirmation(confirmation);
        setOtpExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
      } else {
        const expiresAt = response?.data?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const resendAfterSec = Number(response?.data?.resendAfterSec || 60);
        setOtpExpiresAt(expiresAt);
        setResendAvailableAt(new Date(Date.now() + resendAfterSec * 1000).toISOString());
      }
      showToast(`OTP sent to your ${otpChannel}!`, "success");
      setStep(2);
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    if (loading) return;
    setGeneralError("");
    setLoading(true);
    try {
      let response;
      if (otpChannel === "phone") {
        if (!phoneConfirmation) throw new Error("Session expired.");
        const phoneResult = await phoneConfirmation.confirm(otp);
        const idToken = await phoneResult.user.getIdToken();
        response = await authApi.verifyPhoneSignup({ email: formData.email, idToken });
      } else {
        response = await apiClient.post("/auth/verify-otp", {
          email: formData.email.trim().toLowerCase(),
          otp,
          otpChannel,
          otpRecipient,
        });
      }
      showToast("Verified! Onboarding...", "success");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#000000"],
      });
      if (response.data?.token) {
        await signOut(auth).catch(() => {});
        await signInWithCustomToken(auth, response.data.token);
      }
      setTimeout(() => navigate("/seller/onboarding"), 1500);
    } catch (error) {
      setGeneralError(getFriendlyError(error));
      showToast(getFriendlyError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setGeneralError("");
    try {
      const response = await authApi.resendOTP(formData.email, otpChannel);
      setOtpRecipient(response?.data?.otpRecipient || formData.email);
      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(response?.data?.otpRecipient || formData.phone);
        setPhoneConfirmation(confirmation);
        setOtpExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
      } else {
        const expiresAt = response?.data?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const resendAfterSec = Number(response?.data?.resendAfterSec || 60);
        setOtpExpiresAt(expiresAt);
        setResendAvailableAt(new Date(Date.now() + resendAfterSec * 1000).toISOString());
      }
      showToast(`New OTP sent to your ${otpChannel}!`, "success");
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => resetPhoneRecaptcha(), []);

  return (
    <>
      <Seo title="Seller Signup | Zoop" description="Create your Zoop seller account." robots="noindex,nofollow" canonicalPath="/seller/signup" />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="min-h-screen bg-gradient-to-br from-zoop-moss/20 via-white to-zoop-moss/10 dark:from-zoop-obsidian dark:via-black dark:to-zoop-ink p-3 sm:p-4 flex items-center justify-center transition-colors duration-500">
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-zoop-obsidian/80 backdrop-blur-xl border border-white dark:border-white/10 rounded-[1.75rem] sm:rounded-3xl shadow-2xl p-5 sm:p-8">
            <div className="text-center mb-8">
              <Link to="/" className="inline-block text-3xl font-black text-zoop-moss mb-4 transition-transform hover:scale-105">
                ZOOP<span className="text-zoop-obsidian dark:text-white text-xs italic ml-1">.in</span>
              </Link>
              <h1 className="text-2xl font-black text-zoop-obsidian dark:text-white mb-1">
                {step === 1 ? "Seller Signup" : "Verify Account"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Start selling locally on Zoop
              </p>
            </div>

            {generalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm font-bold">{generalError}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width={18} height={18} />
                    <input type="text" value={formData.displayName} onChange={(e) => updateFormField("displayName", e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white ${errors.displayName ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`}
                      placeholder="John Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width={18} height={18} />
                    <input type="email" value={formData.email} onChange={(e) => updateFormField("email", e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white ${errors.email ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`}
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">OTP Delivery</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 dark:bg-white/5 p-1">
                    <button type="button" onClick={() => setOtpChannel("email")} className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "email" ? "bg-white dark:bg-white/10 text-zoop-obsidian dark:text-white" : "text-gray-500"}`}>Email</button>
                    <button type="button" onClick={() => setOtpChannel("phone")} className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "phone" ? "bg-white dark:bg-white/10 text-zoop-obsidian dark:text-white" : "text-gray-500"}`}>Mobile</button>
                  </div>
                </div>

                <CountryPhoneField label="Phone Number" required value={formData.phone} defaultCountry="in"
                  onChange={(val, meta) => { setPhoneMeta(meta); updateFormField("phone", val); }}
                  error={errors.phone} />

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width={18} height={18} />
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateFormField("password", e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white ${errors.password ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian rounded-xl font-black text-lg hover:opacity-90 transition-all">
                  {loading ? "Creating..." : "Create Seller Account"}
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 h-px w-full" />
                  <span className="relative bg-white dark:bg-[#1a1a1a] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
                </div>

                <button type="button" onClick={handleGoogleSignup} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-100 dark:border-white/10 rounded-xl font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="no-dark-svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Signup with Google
                </button>

                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  Already a seller? <Link to="/login?redirect=/seller/dashboard" className="text-zoop-moss font-bold hover:underline">Login</Link>
                </p>
              </form>
            ) : (
              <div className="space-y-6">
                <OTPInput length={6} onComplete={handleOTPComplete} disabled={loading} />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-4">Expires in {formatMMSS(otpSecondsLeft)}</p>
                  <button onClick={handleResendOTP} disabled={loading || resendSecondsLeft > 0} className="text-zoop-moss font-bold hover:underline disabled:opacity-50">
                    {resendSecondsLeft > 0 ? `Resend in ${formatMMSS(resendSecondsLeft)}` : "Resend OTP"}
                  </button>
                </div>
                <button onClick={() => setStep(1)} className="w-full py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold">Back</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SellerSignup;
