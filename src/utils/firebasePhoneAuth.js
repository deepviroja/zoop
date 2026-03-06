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
  if (!phoneNumber) {
    throw new Error("Phone number is required for mobile OTP");
  }
  const container = getContainer();
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: "invisible",
    });
  }
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error) {
    resetPhoneRecaptcha();
    throw error;
  }
};
