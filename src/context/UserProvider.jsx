import React, { useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { showToast } from "../services/toastService";

const getMissingCustomerFields = (profile = {}) => {
  const missing = [];
  if (!(profile.displayName || profile.name)) missing.push("name");
  if (!profile.email) missing.push("email");
  if (!profile.phone) missing.push("phone");
  if (!profile.address) missing.push("address");
  if (!profile.city) missing.push("city");
  if (!profile.state) missing.push("state");
  if (!profile.pincode) missing.push("pincode");
  return missing;
};

const getMissingSellerFields = (profile = {}) => {
  const required = [
    "businessName",
    "businessType",
    "panNumber",
    "phone",
    "address",
    "bankName",
    "accountNumber",
    "ifscCode",
    "panCardUrl",
    "cancelledChequeUrl",
  ];
  return required.filter((field) => !profile?.[field]);
};

export const UserProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("zoop_city") || "Surat";
  });

  // User state managed by Firebase
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        try {
          // FORCE token refresh to get the latest custom claims (roles)
          // This fixes the issue where new admins/sellers get redirected to Home
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const token = idTokenResult.token;

          // Get custom claims for role
          let role = idTokenResult.claims.role;

          // Fallback to Firestore if claim is missing (e.g. manual admin creation)
          // Get extra data from Firestore
          let verificationStatus = "none";
          let dbProfile = {};
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              role = role || data.role;
              verificationStatus = data.verificationStatus || "none";
              dbProfile = data;
            }
          } catch (e) {
            console.warn("Failed to fetch user data from Firestore", e);
          }

          role = role || "customer";
          const missingFields =
            role === "seller"
              ? getMissingSellerFields(dbProfile)
              : getMissingCustomerFields(dbProfile);

          // Merge firebase user with role
          const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName:
              currentUser.displayName || currentUser.email?.split("@")[0],
            role: role,
            verificationStatus: verificationStatus,
            emailVerified: currentUser.emailVerified,
            ...dbProfile,
            profileMissingFields: missingFields,
          };

          setUser(userData);
          localStorage.setItem("zoop_user", JSON.stringify(userData));
          localStorage.setItem("authToken", token);

          if (role !== "admin" && missingFields.length > 0) {
            showToast.warning(
              role === "seller"
                ? `Complete seller profile: ${missingFields.join(", ")}`
                : `Complete your profile: ${missingFields.join(", ")}`,
            );
          }
        } catch (err) {
          console.error("Error getting user data:", err);
          // Fallback
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName:
              currentUser.displayName || currentUser.email?.split("@")[0],
            role: "customer",
            profileMissingFields: getMissingCustomerFields(),
          });
        }
      } else {
        setUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("zoop_user");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateLocation = (city) => {
    setLocation(city);
    localStorage.setItem("zoop_city", city);
  };

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const emailSignIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const emailSignUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.removeItem("authToken");
      localStorage.removeItem("zoop_user");
      // Refresh page to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  const values = {
    location,
    updateLocation,
    isLoading,
    setIsLoading, // Expose if needed for other loading states
    user,
    googleSignIn,
    emailSignIn,
    emailSignUp,
    logout,
  };

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};
