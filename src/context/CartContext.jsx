import React, { createContext, useState, useEffect, useContext } from "react";
import { showToast } from "../services/toastService";
import { UserContext } from "./UserContext";
import { apiClient } from "../api/client";

export const CartContext = createContext();

const getCartKey = (uid) => (uid ? `zoop_cart_${uid}` : "zoop_cart_guest");

const loadCart = (uid) => {
  try {
    const saved = localStorage.getItem(getCartKey(uid));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useContext(UserContext) || {};
  const uid = user?.uid || null;

  const [cartItems, setCartItems] = useState(() => loadCart(uid));
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [cartValidated, setCartValidated] = useState(false);

  // Reload cart whenever uid changes (login / logout / switch user)
  useEffect(() => {
    setCartItems(loadCart(uid));
    setCartValidated(false);
  }, [uid]);

  // Persist cart to user-scoped key
  useEffect(() => {
    localStorage.setItem(getCartKey(uid), JSON.stringify(cartItems));
  }, [cartItems, uid]);

  // Remove deleted/non-existent products from cart automatically.
  useEffect(() => {
    if (!cartItems.length || cartValidated) return;
    let cancelled = false;

    const validateCart = async () => {
      const uniqueIds = Array.from(new Set(cartItems.map((item) => item.id)));
      if (!uniqueIds.length) {
        setCartValidated(true);
        return;
      }
      const validityPairs = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            await apiClient.get(`/products/${id}`);
            return [id, true];
          } catch {
            return [id, false];
          }
        }),
      );
      if (cancelled) return;
      const validMap = new Map(validityPairs);
      const cleaned = cartItems.filter((item) => validMap.get(item.id));
      if (cleaned.length !== cartItems.length) {
        setCartItems(cleaned);
        showToast.info("Unavailable products were removed from your cart.");
      }
      setCartValidated(true);
    };

    void validateCart();
    return () => {
      cancelled = true;
    };
  }, [cartItems, cartValidated]);

  const addToCart = (
    product,
    quantity = 1,
    selectedSize = null,
    selectedColor = null,
  ) => {
    const existingItem = cartItems.find(
      (item) =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor,
    );

    const maxStock = product.stock || 999;
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + quantity > maxStock) {
      showToast.warning(`Only ${maxStock} items available in stock!`);
      return;
    }

    setCartItems((prevItems) => {
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, maxStock),
              }
            : item,
        );
      } else {
        return [
          ...prevItems,
          {
            ...product,
            quantity: Math.min(quantity, maxStock),
            selectedSize,
            selectedColor,
            addedAt: Date.now(),
          },
        ];
      }
    });

    showToast.success(existingItem ? "Cart updated!" : "Added to cart!");
    setRecentlyAdded(product.id);
    setTimeout(() => setRecentlyAdded(null), 1000);
  };

  const removeFromCart = (
    productId,
    selectedSize = null,
    selectedColor = null,
  ) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          ),
      ),
    );
  };

  const updateQuantity = (
    productId,
    quantity,
    selectedSize = null,
    selectedColor = null,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
          ? { ...item, quantity: Math.min(quantity, item.stock || 999) }
          : item,
      ),
    );
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const getCartCount = () =>
    cartItems.reduce((count, item) => count + item.quantity, 0);

  const isInCart = (productId, selectedSize = null, selectedColor = null) =>
    cartItems.some(
      (item) =>
        item.id === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor,
    );

  const getCartItemQuantity = (
    productId,
    selectedSize = null,
    selectedColor = null,
  ) => {
    const item = cartItems.find(
      (item) =>
        item.id === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor,
    );
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
    getCartItemQuantity,
    recentlyAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
