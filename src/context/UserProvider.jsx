import React, { useCallback, useEffect, useState } from "react";
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
import { buildClientProfileState } from "../utils/profileCompletion";

const DELETED_ACCOUNT_NOTICE =
  "This account has been deleted. Sign up again to create a new account or use the recovery email if available.";

export const UserProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("zoop_city") || "Surat";
  });

  // User state managed by Firebase
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserSnapshot = useCallback(
    async (
      currentUser,
      {
        suppressMissingProfileToast = false,
        suppressIncompleteProfileToast = false,
      } = {},
    ) => {
      if (!currentUser) {
        setUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("zoop_user");
        return null;
      }

      const idTokenResult = await currentUser.getIdTokenResult(true);
      const token = idTokenResult.token;
      let role = idTokenResult.claims.role;

      let verificationStatus;
      let dbProfile = {};
      let hasProfileDocument = false;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          hasProfileDocument = true;
          const data = userDoc.data();
          if (
            data?.isDeleted ||
            String(data?.status || "").toLowerCase() === "deleted" ||
            String(data?.accountState || "").toLowerCase() === "deleted"
          ) {
            sessionStorage.setItem("zoop_auth_notice", DELETED_ACCOUNT_NOTICE);
            await signOut(auth);
            setUser(null);
            localStorage.removeItem("authToken");
            localStorage.removeItem("zoop_user");
            return null;
          }
          role = role || data.role;
          verificationStatus = data.verificationStatus || undefined;
          dbProfile = data;
          const defaultAddress = Array.isArray(data.addresses)
            ? data.addresses.find((item) => item?.isDefault) || data.addresses[0]
            : null;
          const preferredCity =
            localStorage.getItem("zoop_city") ||
            data.defaultLocation ||
            defaultAddress?.city ||
            data.city;
          if (preferredCity) {
            setLocation(preferredCity);
            localStorage.setItem("zoop_city", preferredCity);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user data from Firestore", e);
      }

      if (!hasProfileDocument) {
        role = role || "customer";
        const provisionalProfile = {
          displayName:
            currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          name:
            currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          email: currentUser.email || "",
          phone: currentUser.phoneNumber || "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          photoURL: currentUser.photoURL || "",
        };
        const profileState = buildClientProfileState({
          ...provisionalProfile,
          role,
          isProfileComplete: false,
          status: "pending",
          accountState: "pending",
        });
        const provisionalUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: provisionalProfile.displayName,
          role,
          verificationStatus,
          emailVerified: currentUser.emailVerified,
          hasProfileDocument: false,
          ...provisionalProfile,
          ...profileState,
        };
        setUser(provisionalUser);
        localStorage.setItem("zoop_user", JSON.stringify(provisionalUser));
        localStorage.setItem("authToken", token);
        if (!suppressMissingProfileToast) {
          showToast.warning(
            role === "seller"
              ? "Complete your seller profile to continue."
              : "Complete your profile to continue.",
          );
        }
        return provisionalUser;
      }

      role = role || "customer";
      const profileState = buildClientProfileState({
        ...dbProfile,
        role,
      });

      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split("@")[0],
        role,
        verificationStatus,
        emailVerified: currentUser.emailVerified,
        hasProfileDocument: true,
        ...dbProfile,
        ...profileState,
      };

      setUser(userData);
      localStorage.setItem("zoop_user", JSON.stringify(userData));
      localStorage.setItem("authToken", token);

      if (
        role !== "admin" &&
        profileState.missingFields.length > 0 &&
        !suppressIncompleteProfileToast
      ) {
        showToast.warning(
          role === "seller"
            ? `Complete seller profile: ${profileState.missingFields.join(", ")}`
            : `Complete your profile: ${profileState.missingFields.join(", ")}`,
        );
      }

      return userData;
    },
    [],
  );

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      try {
        await loadUserSnapshot(currentUser);
      } catch (err) {
        console.error("Error getting user data:", err);
        await signOut(auth).catch(() => {});
        setUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("zoop_user");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [loadUserSnapshot]);

  const refreshUser = useCallback(
    async (options = {}) => {
      setIsLoading(true);
      try {
        return await loadUserSnapshot(auth.currentUser, options);
      } finally {
        setIsLoading(false);
      }
    },
    [loadUserSnapshot],
  );

  const updateLocation = (city) => {
    setLocation(city);
    localStorage.setItem("zoop_city", city);
    window.location.reload();
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
    refreshUser,
    googleSignIn,
    emailSignIn,
    emailSignUp,
    logout,
  };

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};
