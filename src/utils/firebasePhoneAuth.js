import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

let recaptchaVerifier = null;
let activeContainerId = "";
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const getContainer = (containerId, size) => {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }
  container.innerHTML = "";
  container.className =
    size === "invisible"
      ? "pointer-events-none fixed bottom-0 left-0 z-[-1] opacity-0"
      : "min-h-[78px] rounded-2xl border border-gray-200 bg-white/70 p-2";
  return container;
};

export const resetPhoneRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  activeContainerId = "";
  if (typeof window !== "undefined") {
    window.recaptchaVerifier = null;
    window.confirmationResult = null;
  }
};

const ensurePhoneRecaptcha = async ({
  containerId = "firebase-phone-recaptcha",
  size = "normal",
} = {}) => {
  const container = getContainer(containerId, size);
  if (!recaptchaVerifier || activeContainerId !== containerId) {
    if (recaptchaVerifier) {
      resetPhoneRecaptcha();
    }
    const recaptchaOptions = {
      size,
      callback: () => undefined,
      "expired-callback": () => resetPhoneRecaptcha(),
    };
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, container, recaptchaOptions);
    } catch (_) {
      recaptchaVerifier = new RecaptchaVerifier(container, recaptchaOptions, auth);
    }
    activeContainerId = containerId;
    if (typeof window !== "undefined") {
      window.recaptchaVerifier = recaptchaVerifier;
    }
    await recaptchaVerifier.render();
  }
  return recaptchaVerifier;
};

export const sendFirebasePhoneOtp = async (phoneNumber, recaptchaOptions = {}) => {
  const normalizedPhone = String(phoneNumber || "").trim().replace(/\s+/g, "");
  if (!normalizedPhone) {
    throw new Error("Phone number is required for mobile OTP");
  }
  if (!E164_PHONE_REGEX.test(normalizedPhone)) {
    throw new Error("Enter your mobile number in international format, for example +918320995536");
  }
  const verifier = await ensurePhoneRecaptcha(recaptchaOptions);
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      normalizedPhone,
      verifier,
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
