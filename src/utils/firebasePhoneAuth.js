import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

let recaptchaVerifier = null;
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

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
  if (typeof window !== "undefined") {
    window.recaptchaVerifier = null;
    window.confirmationResult = null;
  }
};

export const sendFirebasePhoneOtp = async (phoneNumber) => {
  const normalizedPhone = String(phoneNumber || "").trim().replace(/\s+/g, "");
  if (!normalizedPhone) {
    throw new Error("Phone number is required for mobile OTP");
  }
  if (!E164_PHONE_REGEX.test(normalizedPhone)) {
    throw new Error("Enter your mobile number in international format, for example +918320995536");
  }
  const container = getContainer();
  if (!recaptchaVerifier) {
    const recaptchaOptions = {
      size: "invisible",
      callback: () => undefined,
      "expired-callback": () => resetPhoneRecaptcha(),
    };
    // Firebase v10+ expects (auth, container, params). Some builds still accept the older signature.
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, container, recaptchaOptions);
    } catch (_) {
      recaptchaVerifier = new RecaptchaVerifier(container, recaptchaOptions, auth);
    }
    if (typeof window !== "undefined") {
      window.recaptchaVerifier = recaptchaVerifier;
    }
    await recaptchaVerifier.render();
  }
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      normalizedPhone,
      recaptchaVerifier,
    );
    if (typeof window !== "undefined") {
      window.confirmationResult = confirmationResult;
    }
    return confirmationResult;
  } catch (error) {
    resetPhoneRecaptcha();
    throw error;
  }
};
