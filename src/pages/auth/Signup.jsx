import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { authApi } from "../../services/api";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../../utils/validation";
import { getFriendlyError } from "../../utils/errorMessages";
import { PasswordStrength } from "../../components/common/PasswordStrength";
import { OTPInput } from "../../components/auth/OTPInput";
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
import { useSiteConfig } from "../../context/SiteConfigContext";

const Signup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { brandName, replaceBrandText } = useSiteConfig();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
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
    role: "customer",
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
        return "Please enter a valid phone number";
      }
      return "";
    }
    if (field === "address") if (!value?.trim()) return "Address is required";
    if (field === "countryCode") if (!value?.trim()) return "Country is required";
    if (field === "stateCode") if (!value?.trim()) return "State is required";
    if (field === "city") if (!value?.trim()) return "City is required";
    if (field === "pincode") {
      if (!isValidPincode(value, nextData.countryCode)) {
        return getPincodeValidationMessage(nextData.countryCode);
      }
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
    };
    setFormData(nextData);

    const error = validateField(field, value, nextData);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleGoogleSignup = async () => {
    setGeneralError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (token) localStorage.setItem("authToken", token);
      } catch (e) {
        console.error("Failed to get or store auth token after Google signup:", e);
      }
      try {
        await authApi.syncUser({ role: "customer", mode: "signup" });
      } catch (e) {
        console.error("User sync error after Google signup:", e);
      }
      showToast("Account created successfully!", "success");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#b7e84b", "#ffffff", "#121212"],
      });
      navigate("/");
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    const newErrors = {};
    Object.keys(formData).forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGeneralError("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.requestSignupOTP(formData, otpChannel);
      setOtpRecipient(response?.otpRecipient || formData.email);

      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(
          response?.otpRecipient || formData.phone,
          { containerId: "signup-phone-recaptcha", size: "invisible" },
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
      setStep(2);
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    setLoading(true);
    setGeneralError("");
    try {
      let response;
      if (otpChannel === "phone") {
        if (!phoneConfirmation) {
          throw new Error("Phone session expired. Please resend OTP.");
        }
        const phoneResult = await phoneConfirmation.confirm(otp);
        const idToken = await phoneResult.user.getIdToken();
        response = await authApi.verifySignupOTP({
          ...formData,
          idToken,
          otpChannel,
        });
      } else {
        response = await authApi.verifySignupOTP({
          ...formData,
          otp,
          otpChannel,
          otpRecipient,
        });
      }

      if (response?.user) {
        showToast("Welcome to Zoop!", "success");
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#b7e84b", "#ffffff", "#121212"],
        });
        navigate("/");
      }
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setResendAvailableAt("");
    void handleSubmit({ preventDefault: () => {} });
  };

  useEffect(() => () => resetPhoneRecaptcha(), []);

  return (
    <>
      <Seo
        title="Sign Up | Zoop"
        description={replaceBrandText("Create your Zoop account.")}
        robots="noindex,nofollow"
        canonicalPath="/signup"
      />
      <div className="min-h-screen bg-gradient-to-br from-zoop-moss/20 via-white to-zoop-moss/10 dark:from-zoop-obsidian dark:via-black dark:to-zoop-ink p-3 sm:p-4 md:p-8 flex items-center justify-center transition-colors duration-500">
        <div className="w-full max-w-2xl">
          <div className="bg-white/90 dark:bg-zoop-obsidian/80 backdrop-blur-xl border border-white dark:border-white/10 rounded-[2rem] sm:rounded-3xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-6 sm:p-10 relative overflow-hidden">
            <div className="text-center mb-10">
              <Link to="/" className="inline-block text-3xl font-black text-zoop-moss mb-4 transition-transform hover:scale-105">
                {brandName}<span className="text-zoop-obsidian dark:text-white text-xs italic ml-1">.in</span>
              </Link>
              <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white mb-2">
                {step === 1 ? "Create Account" : "Verify OTP"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {step === 1 ? replaceBrandText("Join Zoop and start shopping locally") : `Enter the OTP sent to your ${otpChannel}`}
              </p>
            </div>

            {generalError && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm font-bold text-center">{generalError}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zoop-obsidian/60 dark:text-gray-400"
                        width={18}
                        height={18}
                      />
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => updateFormField("displayName", e.target.value)}
                        disabled={loading}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white text-zoop-obsidian font-bold ${
                          errors.displayName
                            ? "border-red-500"
                            : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:ring-4 focus:ring-zoop-moss/10"
                        }`}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zoop-obsidian/60 dark:text-gray-400"
                        width={18}
                        height={18}
                      />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormField("email", e.target.value)}
                        disabled={loading}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white text-zoop-obsidian font-bold ${
                          errors.email
                            ? "border-red-500"
                            : "border-gray-100 dark:border-white/10 focus:border-zoop-moss focus:ring-4 focus:ring-zoop-moss/10"
                        }`}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">OTP Delivery preference</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 dark:bg-white/5 p-1">
                    <button type="button" onClick={() => setOtpChannel("email")} className={`rounded-lg py-2.5 text-xs font-black uppercase transition-all ${otpChannel === "email" ? "bg-white dark:bg-white/10 shadow-sm text-zoop-obsidian dark:text-white" : "text-gray-500 hover:text-gray-700"}`}>Email OTP</button>
                    <button type="button" onClick={() => setOtpChannel("phone")} className={`rounded-lg py-2.5 text-xs font-black uppercase transition-all ${otpChannel === "phone" ? "bg-white dark:bg-white/10 shadow-sm text-zoop-obsidian dark:text-white" : "text-gray-500 hover:text-gray-700"}`}>Mobile OTP</button>
                  </div>
                </div>

                <CountryPhoneField label="Active Mobile Number" required value={formData.phone} defaultCountry="in"
                  onChange={(val, meta) => { setPhoneMeta(meta); updateFormField("phone", val, { phoneMeta: meta }); }}
                  error={errors.phone} />

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                  <textarea value={formData.address} onChange={(e) => updateFormField("address", e.target.value)} rows={2}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white text-zoop-obsidian font-bold ${errors.address ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`} 
                    placeholder="House no, Street name, Locality" />
                </div>

                <CountryStateCityFieldset country={formData.countryCode} state={formData.stateCode} city={formData.city} required
                  onCountryChange={(cc) => {
                    const country = getCountryByCode(cc);
                    updateFormField("countryCode", cc, { country: country?.name || "", stateCode: "", state: "", city: "" });
                  }}
                  onStateChange={(sc) => {
                    const state = getStateByCodeAndCountry(sc, formData.countryCode);
                    updateFormField("stateCode", sc, { state: state?.name || "", city: "" });
                  }}
                  onCityChange={(c) => updateFormField("city", c)}
                  errors={{ country: errors.countryCode, state: errors.stateCode, city: errors.city }} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pincode</label>
                    <input type="text" value={formData.pincode} onChange={(e) => updateFormField("pincode", e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white text-zoop-obsidian font-bold ${errors.pincode ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`} 
                      placeholder="110001" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                    <select value={formData.gender} onChange={(e) => updateFormField("gender", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-white/5 transition-all outline-none dark:text-white border-gray-100 dark:border-white/10 focus:border-zoop-moss text-zoop-obsidian font-bold pr-10 appearance-none">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zoop-obsidian/60 dark:text-gray-400" width={18} height={18} />
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateFormField("password", e.target.value)}
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 dark:bg-transparent transition-all outline-none dark:text-white text-zoop-obsidian font-bold ${errors.password ? "border-red-500" : "border-gray-100 dark:border-white/10 focus:border-zoop-moss"}`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>

                <div id="signup-phone-recaptcha"></div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian rounded-xl font-black text-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-zoop-moss/10">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 h-px w-full" />
                  <span className="relative bg-white dark:bg-[#1a1a1a] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                </div>

                <button type="button" onClick={handleGoogleSignup} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-100 dark:border-white/10 rounded-xl font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-zoop-obsidian">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="no-dark-svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google Account
                </button>

                <p className="text-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Already have an account? <Link to="/login" className="text-zoop-moss font-bold hover:underline">Login here</Link>
                </p>
              </form>
            ) : (
              <div className="space-y-8 py-4">
                <OTPInput length={6} onComplete={handleOTPComplete} disabled={loading} />
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-zoop-obsidian dark:text-white">Verification Code Sent</p>
                  <p className="text-xs text-gray-500">Expires in {formatMMSS(otpSecondsLeft)}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleResendOTP} disabled={loading || resendSecondsLeft > 0} className="w-full py-3.5 bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50">
                    {resendSecondsLeft > 0 ? `Resend in ${formatMMSS(resendSecondsLeft)}` : "Resend code"}
                  </button>
                  <button onClick={() => setStep(1)} className="w-full py-3.5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl font-bold text-sm border border-gray-100 dark:border-white/10">
                    Back to Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
