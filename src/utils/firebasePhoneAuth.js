import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

let recaptchaVerifier = null;
let activeContainerId = "";
const OWNED_CONTAINER_ATTR = "data-firebase-phone-recaptcha";
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const applyContainerStyles = (container, size) => {
  container.className =
    size === "invisible"
      ? "pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      : "min-h-[78px] rounded-2xl border border-gray-200 bg-white/70 p-2";
};

const getContainer = (containerId, size) => {
  if (typeof document === "undefined") {
    throw new Error("Phone authentication can only run in the browser");
  }

  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.setAttribute(OWNED_CONTAINER_ATTR, "true");
    document.body.appendChild(container);
  }

  applyContainerStyles(container, size);
  return container;
};

const removeOwnedContainer = (containerId) => {
  if (!containerId || typeof document === "undefined") return;
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.getAttribute(OWNED_CONTAINER_ATTR) === "true") {
    container.remove();
    return;
  }

  container.innerHTML = "";
};

const toFirebasePhoneAuthError = (error) => {
  const message = (() => {
    switch (error?.code) {
      case "auth/invalid-phone-number":
        return "Enter a valid mobile number in international format, for example +919876543210.";
      case "auth/too-many-requests":
      case "auth/quota-exceeded":
        return "SMS quota is temporarily exhausted. Please wait and try again later.";
      case "auth/network-request-failed":
        return "Network request failed while sending OTP. Check your connection and retry.";
      default:
        return error?.message || "Could not send OTP. Please try again.";
    }
  })();

  const nextError = new Error(message);
  nextError.code = error?.code || "";
  nextError.cause = error;
  return nextError;
};

export const normalizePhoneForFirebaseOtp = (phoneNumber) => {
  const rawPhone = String(phoneNumber || "").trim();
  if (!rawPhone) return "";

  const compact = rawPhone.replace(/[\s()-]/g, "");
  if (compact.startsWith("00")) {
    return `+${compact.slice(2).replace(/\D/g, "")}`;
  }
  if (compact.startsWith("+")) {
    return `+${compact.slice(1).replace(/\D/g, "")}`;
  }
  return compact.replace(/\D/g, "");
};

export const resetPhoneRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors from an already-destroyed widget.
    }
    recaptchaVerifier = null;
  }

  removeOwnedContainer(activeContainerId);
  activeContainerId = "";

  if (typeof window !== "undefined") {
    window.recaptchaVerifier = null;
    window.confirmationResult = null;
  }
};

const ensurePhoneRecaptcha = async ({
  containerId = "firebase-phone-recaptcha",
  size = "invisible",
} = {}) => {
  if (recaptchaVerifier && activeContainerId === containerId) {
    return recaptchaVerifier;
  }

  if (recaptchaVerifier) {
    resetPhoneRecaptcha();
  }

  const container = getContainer(containerId, size);
  recaptchaVerifier = new RecaptchaVerifier(auth, container, {
    size,
    callback: () => undefined,
    "expired-callback": () => resetPhoneRecaptcha(),
  });
  activeContainerId = containerId;

  if (typeof window !== "undefined") {
    window.recaptchaVerifier = recaptchaVerifier;
  }

  await recaptchaVerifier.render();
  return recaptchaVerifier;
};

export const sendFirebasePhoneOtp = async (phoneNumber, recaptchaOptions = {}) => {
  const normalizedPhone = normalizePhoneForFirebaseOtp(phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Phone number is required for mobile OTP");
  }

  if (!E164_PHONE_REGEX.test(normalizedPhone)) {
    throw new Error(
      "Enter your mobile number in international format, for example +919876543210",
    );
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
    throw toFirebasePhoneAuthError(error);
  }
};
