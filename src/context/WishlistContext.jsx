import React, { createContext, useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

const getWishlistKey = (uid) =>
  uid ? `zoop_wishlist_${uid}` : "zoop_wishlist_guest";

const loadWishlist = (uid) => {
  try {
    const saved = localStorage.getItem(getWishlistKey(uid));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(UserContext) || {};
  const uid = user?.uid || null;

  const [wishlist, setWishlist] = useState(() => loadWishlist(uid));

  // Reload wishlist when uid changes (login / logout / switch user)
  useEffect(() => {
    setWishlist(loadWishlist(uid));
  }, [uid]);

  // Persist wishlist under user-scoped key
  useEffect(() => {
    localStorage.setItem(getWishlistKey(uid), JSON.stringify(wishlist));
  }, [wishlist, uid]);

  const addToWishlist = (productId) => {
    setWishlist((prev) => {
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  const clearWishlist = () => setWishlist([]);

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlist.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
