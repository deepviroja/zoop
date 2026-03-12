import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { authApi } from "../../services/api";
import { validateEmail } from "../../utils/validation";
import { getFriendlyError } from "../../utils/errorMessages";
import { useUser } from "../../context/UserContext";
import { Eye } from "../../assets/icons/Eye";
import { EyeOff } from "../../assets/icons/EyeOff";
import { Mail } from "../../assets/icons/Mail";
import { Lock } from "../../assets/icons/Lock";
import Loader from "../../components/ui/Loader";
import { OTPInput } from "../../components/auth/OTPInput";
import Seo from "../../components/shared/Seo";
import {
  sendFirebasePhoneOtp,
  resetPhoneRecaptcha,
} from "../../utils/firebasePhoneAuth";
import CountryPhoneField from "../../components/common/CountryPhoneField";
import { isValidInternationalPhone } from "../../utils/liveValidation";
import { useSiteConfig } from "../../context/SiteConfigContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();
  const { brandName, replaceBrandText } = useSiteConfig();

  // Where to redirect after login (support ?redirect= param)
  const from = new URLSearchParams(location.search).get("redirect") || "/";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [loginMode, setLoginMode] = useState("password");
  const [otpStep, setOtpStep] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
  const [otpChannel, setOtpChannel] = useState("email");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneMeta, setPhoneMeta] = useState({
    dialCode: "91",
    countryCode: "in",
    format: "",
  });

  useEffect(() => {
    if (!(loginMode === "otp" && otpStep)) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [loginMode, otpStep]);

  useEffect(() => {
    const notice = sessionStorage.getItem("zoop_auth_notice");
    if (!notice) return;
    setGeneralError(notice);
    sessionStorage.removeItem("zoop_auth_notice");
  }, []);

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

  const getPostLoginPath = useCallback((nextUser) => {
    if (!nextUser) return from;
    if (nextUser.role === "seller") return "/seller/dashboard";
    if (nextUser.role === "admin") return "/admin";
    if (nextUser.profileNeedsSetup && nextUser.role === "seller") {
      return nextUser.profileSetupRoute || "/complete-profile";
    }
    return from;
  }, [from]);

  // ✅ React to user state changes — navigate AFTER UserProvider sets user
  useEffect(() => {
    if (!isLoading && user) {
      navigate(getPostLoginPath(user), { replace: true });
    }
  }, [user, isLoading, navigate, from, getPostLoginPath]);

  const validateForm = () => {
    const newErrors = {};
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    setGeneralError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Ensure API calls use the freshly-issued token for this signed-in user.
        try {
          const token = await auth.currentUser?.getIdToken(true);
          if (token) localStorage.setItem("authToken", token);
        } catch (e) {
          console.error("Token fetch error", e);
        }
      // Sync user with backend to assign role if new
      try {
        await authApi.syncUser({ mode: "login" });
      } catch (error) {
        await signOut(auth).catch(() => {});
        throw error;
      }
      setRedirecting(true);
      setSuccessMsg("Login successful! Redirecting...");
      // Navigation handled by useEffect watching user
    } catch (error) {
      console.error("Google Login error:", error);
      const friendly = getFriendlyError(error);
      if (friendly) setGeneralError(friendly);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMsg("");
    if (loginMode !== "password") return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setRedirecting(true);
      setSuccessMsg("Login successful! Redirecting...");
      // Navigation handled by useEffect watching user
    } catch (error) {
      console.error("Login error:", error);
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const validateOtpEntry = () => {
    const nextErrors = {};
    if (!validateEmail(formData.email)) {
      nextErrors.email = "Please enter your account email address";
    }
    if (otpChannel === "phone") {
      if (!phoneValue) {
        nextErrors.phone = "Please enter your registered mobile number";
      } else if (!isValidInternationalPhone(phoneValue, phoneMeta)) {
        nextErrors.phone = "Please enter a valid mobile number";
      }
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleRequestOTP = async () => {
    setGeneralError("");
    setSuccessMsg("");
    if (!validateOtpEntry()) {
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.requestLoginOTP(
        formData.email,
        otpChannel,
      );
      setOtpRecipient(response?.otpRecipient || formData.email);
      if (
        otpChannel === "phone" &&
        phoneValue &&
        response?.otpRecipient &&
        response.otpRecipient !== phoneValue
      ) {
        throw new Error(
          "This mobile number does not match the selected account.",
        );
      }
      if (otpChannel === "phone") {
        resetPhoneRecaptcha();
        const confirmation = await sendFirebasePhoneOtp(
          response?.otpRecipient || phoneValue,
          { containerId: "login-phone-recaptcha", size: "invisible" },
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
      setOtpStep(true);
      setSuccessMsg(
        `OTP sent to your ${otpChannel === "phone" ? "mobile" : "email"}`,
      );
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    if (loading) return;
    setGeneralError("");
    setLoading(true);
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
        response = await authApi.verifyPhoneLogin({
          email: formData.email,
          idToken,
        });
      } else {
        response = await authApi.verifyLoginOTP({
          email: formData.email,
          otp,
          otpChannel,
          otpRecipient,
        });
      }
      if (response?.token) {
        await signOut(auth).catch(() => {});
        await signInWithCustomToken(auth, response.token);
      }
      setRedirecting(true);
      setSuccessMsg("Login successful! Redirecting...");
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => resetPhoneRecaptcha(), []);

  const handleForgotPassword = async () => {
    setGeneralError("");
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter your registered email first",
      }));
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccessMsg(`Password reset link sent to ${formData.email}`);
    } catch (error) {
      setGeneralError(getFriendlyError(error));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <Seo
        title="Login | Zoop"
        description={replaceBrandText("Access your Zoop account.")}
        robots="noindex,nofollow"
        canonicalPath="/login"
      />
      {redirecting && <Loader fullScreen />}
      <div className="min-h-screen bg-gradient-to-br from-zoop-moss/20 via-white to-zoop-moss/10 dark:from-zoop-obsidian dark:via-black dark:to-zoop-ink p-3 sm:p-4 rounded-[1.75rem] sm:rounded-3xl flex items-center justify-center transition-colors duration-500">
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-zoop-obsidian/80 backdrop-blur-xl border border-white dark:border-white/10 rounded-[1.75rem] sm:rounded-3xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-5 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Link
                to="/"
                className="inline-block text-3xl font-black text-zoop-moss mb-4 transition-transform hover:scale-105"
              >
                {brandName}
                <span className="text-zoop-obsidian dark:text-white text-xs italic ml-1">.in</span>
              </Link>
              <h1 className="text-3xl font-black text-zoop-obsidian dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Login to continue shopping locally
              </p>
            </div>

            {/* Success */}
            {successMsg && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-600 dark:text-green-400 text-sm font-bold text-center">
                  {successMsg}
                </p>
              </div>
            )}

            {/* Error */}
            {generalError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm font-bold">{generalError}</p>
              </div>
            )}

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 transition-all shadow-sm mb-6 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="no-dark-svg">
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
              Continue with Google
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 h-px w-full top-1/2" />
              <span className="relative bg-white dark:bg-[#1a1a1a] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {replaceBrandText("Or login with Zoop")}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("password");
                    setOtpStep(false);
                    setGeneralError("");
                  }}
                  className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    loginMode === "password"
                      ? "bg-white dark:bg-white/10 text-zoop-obsidian dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("otp");
                    setGeneralError("");
                  }}
                  className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    loginMode === "otp"
                      ? "bg-white dark:bg-white/10 text-zoop-obsidian dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  OTP Login
                </button>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zoop-obsidian/60 dark:text-gray-400"
                    width={18}
                    height={18}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setGeneralError("");
                    }}
                    disabled={loading}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 dark:bg-transparent ${errors.email ? "border-red-500" : loading ? "border-zoop-moss bg-zoop-moss/5 animate-pulse" : "border-gray-200 dark:border-white/10"} focus:border-zoop-moss focus:ring-4 focus:ring-zoop-moss/10 transition-all outline-none dark:text-white text-zoop-obsidian font-bold`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              {loginMode === "password" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zoop-obsidian/60 dark:text-gray-400"
                      width={18}
                      height={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setGeneralError("");
                      }}
                      disabled={loading}
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 dark:bg-transparent ${errors.password ? "border-red-500" : loading ? "border-zoop-moss bg-zoop-moss/5 animate-pulse" : "border-gray-200 dark:border-white/10"} focus:border-zoop-moss focus:ring-4 focus:ring-zoop-moss/10 transition-all outline-none dark:text-white text-zoop-obsidian font-bold`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff width={18} height={18} />
                      ) : (
                        <Eye width={18} height={18} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {errors.password}
                    </p>
                  )}
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={sendingReset}
                      className="text-xs font-bold text-zoop-moss hover:underline disabled:opacity-60"
                    >
                      {sendingReset ? "Sending..." : "Forgot Password?"}
                    </button>
                  </div>
                </div>
              )}

              {loginMode === "otp" && (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
                  <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-white dark:bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpChannel("email");
                        setOtpStep(false);
                        setPhoneConfirmation(null);
                        setErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "email" ? "bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      Email OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpChannel("phone");
                        setOtpStep(false);
                      }}
                      className={`rounded-lg py-2 text-xs font-black uppercase ${otpChannel === "phone" ? "bg-zoop-obsidian dark:bg-zoop-moss text-white dark:text-zoop-obsidian" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      Mobile OTP
                    </button>
                  </div>
                  {otpChannel === "phone" && (
                    <div className="mb-3">
                      <CountryPhoneField
                        label="Registered Mobile Number"
                        value={phoneValue}
                        onChange={(value, countryData) => {
                          setPhoneValue(value);
                          setPhoneMeta(countryData || phoneMeta);
                          const isValid = value && isValidInternationalPhone(value, countryData || phoneMeta);
                          setErrors((prev) => ({
                            ...prev,
                            phone: value && !isValid ? "Please enter a valid mobile number" : "",
                          }));
                          setGeneralError("");
                        }}
                        onMetaChange={(meta) => setPhoneMeta(meta || phoneMeta)}
                        error={errors.phone}
                        defaultCountry="in"
                      />
                    </div>
                  )}
                  {otpStep ? (
                    <>
                      <p className="text-sm font-bold text-zoop-obsidian dark:text-white mb-3">
                        Enter the OTP sent to your{" "}
                        {otpChannel === "phone" ? "phone number" : "email"}
                      </p>
                      <OTPInput
                        length={6}
                        onComplete={handleVerifyOTP}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        OTP expires in {formatMMSS(otpSecondsLeft)}
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={loading || resendSecondsLeft > 0}
                        className="mt-3 text-zoop-moss text-sm font-bold hover:underline disabled:opacity-60"
                      >
                        {resendSecondsLeft > 0
                          ? `Resend in ${formatMMSS(resendSecondsLeft)}`
                          : "Resend OTP"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose where the OTP should be delivered, then send it.
                      </p>
                      {otpChannel === "phone" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Use the email of the same account and its registered mobile number.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              {loginMode === "password" ? (
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    generalError
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-zoop-obsidian hover:bg-zoop-moss hover:text-zoop-obsidian dark:bg-zoop-moss dark:text-zoop-obsidian dark:hover:bg-white"
                  }`}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={loading}
                  className={`w-full py-3.5 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    generalError
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-zoop-obsidian hover:bg-zoop-moss hover:text-zoop-obsidian dark:bg-zoop-moss dark:text-zoop-obsidian dark:hover:bg-white"
                  }`}
                >
                  {loading
                    ? "Sending OTP..."
                    : otpStep
                      ? "Resend / Continue"
                      : "Send OTP"}
                </button>
              )}

              <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-zoop-moss font-bold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
