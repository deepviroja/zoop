import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAY5yTsMRrGetXHKbjw4WZxvGBEyf_VBBI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zoop-88df6.web.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zoop-88df6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zoop-88df6.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "225057326778",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:225057326778:web:7192696ba95a2d6e182483",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z7QVL5CL3M",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ─── App Check (ReCaptcha Enterprise) ─────────────────────────────────────────
// Enables App Check to protect Firebase resources from abuse.
// Required for Phone Auth to work without 401 Unauthorized errors.
// In development, set VITE_APPCHECK_DEBUG_TOKEN in .env for local testing.
if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
  // @ts-ignore — global debug token for local dev
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
}

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("Firebase App Check initialization skipped", error);
  }
}

// ─── Firebase Services ────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
