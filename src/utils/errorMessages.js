/**
 * Converts raw Firebase / API errors into short, user-friendly messages.
 * Never shows raw codes like "auth/network-request-failed" to the user.
 */
export function getFriendlyError(error) {
  if (!error) return "Something went wrong. Please try again.";

  const code = error?.code || "";
  const msg  = (error?.message || error?.toString() || "").toLowerCase();

  // ── Network / connectivity ────────────────────────────────────────
  if (
    code === "auth/network-request-failed" ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed")
  ) {
    return "No internet connection. Please check your network and try again.";
  }

  // ── Firebase Auth ─────────────────────────────────────────────────
  const firebaseMap = {
    "auth/email-already-in-use":     "This email is already registered. Please log in instead.",
    "auth/email-already-exists":     "This email is already registered. Please log in instead.",
    "auth/user-not-found":           "No account found with this email address.",
    "auth/wrong-password":           "Incorrect password. Please try again.",
    "auth/invalid-credential":       "Incorrect email or password. Please try again.",
    "auth/invalid-email":            "Please enter a valid email address.",
    "auth/weak-password":            "Password must be at least 8 characters long.",
    "auth/too-many-requests":        "Too many failed attempts. Please wait a few minutes and try again.",
    "auth/user-disabled":            "This account has been suspended. Contact support for help.",
    "auth/popup-closed-by-user":     "", // Silent — user closed it intentionally
    "auth/popup-blocked":            "Your browser blocked the sign-in popup. Please allow popups and try again.",
    "auth/cancelled-popup-request":  "",
    "auth/requires-recent-login":    "For security, please log out and log in again before making this change.",
    "auth/invalid-action-code":      "This link has expired or already been used. Please request a new one.",
    "auth/expired-action-code":      "This link has expired. Please request a new one.",
    "auth/invalid-phone-number":     "Please enter a valid mobile number with country code.",
    "auth/missing-phone-number":     "Please enter your registered mobile number.",
    "auth/captcha-check-failed":     "Phone verification could not be completed. Refresh and try again.",
    "auth/quota-exceeded":           "Too many OTP requests for this number. Please try again later.",
    "auth/code-expired":             "OTP expired. Please request a new one.",
    "auth/invalid-verification-code":"Invalid OTP. Please enter the latest code sent to you.",
    "auth/invalid-app-credential":   "Firebase phone auth is not fully configured for this domain yet.",
    "auth/operation-not-allowed":    "Phone sign-in is not enabled correctly in Firebase.",
    "auth/account-exists-with-different-credential":
      "An account with this email already exists using a different sign-in method.",
  };

  if (firebaseMap[code] !== undefined) return firebaseMap[code];

  // ── Message-based fallbacks ───────────────────────────────────────
  if (msg.includes("email-already-in-use") || msg.includes("email already"))
    return "This email is already registered. Please log in instead.";
  if (msg.includes("user-not-found") || msg.includes("user not found"))
    return "No account found with this email address.";
  if (msg.includes("wrong-password") || msg.includes("invalid credential"))
    return "Incorrect email or password. Please try again.";
  if (msg.includes("weak-password") || msg.includes("weak password"))
    return "Please choose a stronger password (at least 8 characters).";
  if (msg.includes("too-many-requests") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("api request failed") || msg.includes("api request denied"))
    return "Something went wrong on our end. Please try again shortly.";
  if (msg.includes("domain") && msg.includes("authorized"))
    return "This website domain is not authorized in Firebase Phone Authentication yet.";
  if (msg.includes("forbidden") || msg.includes("403"))
    return "You do not have permission to perform this action.";
  if (msg.includes("unauthorized") || msg.includes("401"))
    return "Please log in to continue.";
  if (msg.includes("not found") || msg.includes("404"))
    return "The requested information could not be found.";
  if (msg.includes("timeout") || msg.includes("timed out"))
    return "The request timed out. Please check your connection and try again.";
  if (msg.includes("invalid otp") || msg.includes("otp"))
    return "Invalid or expired OTP. Please try again.";

  // ── Generic fallback ──────────────────────────────────────────────
  return "Something went wrong. Please try again.";
}
