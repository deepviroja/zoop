
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAY5yTsMRrGetXHKbjw4WZxvGBEyf_VBBI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zoop-88df6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zoop-88df6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zoop-88df6.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "225057326778",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:225057326778:web:7192696ba95a2d6e182483",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z7QVL5CL3M",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
