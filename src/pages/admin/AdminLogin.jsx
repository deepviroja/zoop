import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { apiClient } from "../../api/client";
import { Eye } from "../../assets/icons/Eye";
import { EyeOff } from "../../assets/icons/EyeOff";
import { Mail } from "../../assets/icons/Mail";
import { Lock } from "../../assets/icons/Lock";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const errs = {};
    if (!formData.email) errs.email = "Email is required";
    if (!formData.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setLoading(true);
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Force token refresh to get latest claims
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const role = idTokenResult.claims.role;

      // Sync with backend to get role assignment
      let syncedRole = role;
      try {
        const syncResponse = await apiClient.post("/auth/sync", {});
        syncedRole = syncResponse?.user?.role || role;
      } catch (err) {
        console.warn(
          "Admin sync failed, proceeding with Firebase role...",
          err,
        );
      }

      // Check if user has admin role
      if (syncedRole !== "admin" && role !== "admin") {
        // Check Firestore as last resort
        try {
          const { db } = await import("../../firebase");
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(
            doc(db, "users", userCredential.user.uid),
          );
          if (userDoc.exists() && userDoc.data().role !== "admin") {
            await auth.signOut();
            setGeneralError("Invalid admin credentials. Access denied.");
            setLoading(false);
            return;
          }
        } catch {
          await auth.signOut();
          setGeneralError("Invalid admin credentials. Access denied.");
          setLoading(false);
          return;
        }
      }

      // Store token & user data
      localStorage.setItem("authToken", idTokenResult.token);
      localStorage.setItem(
        "zoop_user",
        JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: "admin",
          displayName: userCredential.user.displayName || "Admin",
        }),
      );

      // Force full page reload to re-init auth state
      window.location.href = "/admin";
    } catch (error) {
      console.error("Admin login error:", error);
      const code = error?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-email"
      ) {
        setGeneralError("Invalid admin credentials. Access denied.");
      } else if (
        code === "auth/network-request-failed" ||
        (error?.message || "").toLowerCase().includes("network")
      ) {
        setGeneralError("No internet connection. Please check your network.");
      } else if (code === "auth/too-many-requests") {
        setGeneralError("Too many failed attempts. Please wait a few minutes.");
      } else {
        setGeneralError("Invalid admin credentials. Access denied.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Admin Access
            </h1>
            <p className="text-gray-600">
              Restricted area — Authorized personnel only
            </p>
          </div>

          {/* General Error */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-bold">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Admin Email
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
                    setErrors({ ...errors, email: "" });
                  }}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none ${
                    errors.email
                      ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  }`}
                  placeholder="admin@zoop.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-bold">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Admin Password
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
                    setErrors({ ...errors, password: "" });
                  }}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all outline-none ${
                    errors.password
                      ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Admin Panel"
              )}
            </button>

            {/* Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 This area is restricted to administrators only
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
