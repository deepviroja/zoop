
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAY5yTsMRrGetXHKbjw4WZxvGBEyf_VBBI",
  authDomain: "zoop-88df6.firebaseapp.com",
  projectId: "zoop-88df6",
  storageBucket: "zoop-88df6.firebasestorage.app",
  messagingSenderId: "225057326778",
  appId: "1:225057326778:web:7192696ba95a2d6e182483",
  measurementId: "G-Z7QVL5CL3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
