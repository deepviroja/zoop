import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

let recaptchaVerifier = null;

const getContainer = () => {
  let container = document.getElementById("firebase-phone-recaptcha");
  if (!container) {
    container = document.createElement("div");
    container.id = "firebase-phone-recaptcha";
    container.className = "pointer-events-none fixed bottom-0 left-0 z-[-1] opacity-0";
    document.body.appendChild(container);
  }
  return container;
};

export const resetPhoneRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

export const sendFirebasePhoneOtp = async (phoneNumber) => {
  const normalizedPhone = String(phoneNumber || "").trim().replace(/\s+/g, "");
  if (!normalizedPhone) {
    throw new Error("Phone number is required for mobile OTP");
  }
  const container = getContainer();
  if (!recaptchaVerifier) {
    // Firebase v10+ expects (container, params, auth). Older builds accepted (auth, container, params).
    try {
      recaptchaVerifier = new RecaptchaVerifier(container, { size: "invisible" }, auth);
    } catch (_) {
      recaptchaVerifier = new RecaptchaVerifier(auth, container, { size: "invisible" });
    }
    await recaptchaVerifier.render();
  }
  try {
    return await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier);
  } catch (error) {
    resetPhoneRecaptcha();
    throw error;
  }
};
