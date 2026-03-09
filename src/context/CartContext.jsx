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

const mergeCartItemWithProduct = (item, product) => {
  const stock = Number(product?.stock ?? item.stock ?? 0);
  const safeQuantity = Math.max(
    1,
    Math.min(Number(item.quantity) || 1, stock > 0 ? stock : Number(item.quantity) || 1),
  );

  return {
    ...item,
    ...product,
    name: product?.name || product?.title || item.name || item.title || "Product",
    title: product?.title || product?.name || item.title || item.name || "Product",
    image: product?.image || product?.thumbnailUrl || item.image || item.thumbnailUrl || "",
    thumbnailUrl:
      product?.thumbnailUrl || product?.image || item.thumbnailUrl || item.image || "",
    price: Number(product?.price ?? item.price ?? 0),
    stock,
    quantity: safeQuantity,
    selectedSize: item.selectedSize ?? null,
    selectedColor: item.selectedColor ?? null,
    addedAt: item.addedAt ?? Date.now(),
  };
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
            const product = await apiClient.get(`/products/${id}`);
            return [id, product];
          } catch {
            return [id, null];
          }
        }),
      );
      if (cancelled) return;
      const productMap = new Map(validityPairs);
      const removedItems = [];
      let quantityAdjusted = false;
      let pricingChanged = false;
      const refreshed = cartItems
        .filter((item) => {
          const exists = Boolean(productMap.get(item.id));
          if (!exists) removedItems.push(item.id);
          return exists;
        })
        .map((item) => {
          const nextItem = mergeCartItemWithProduct(item, productMap.get(item.id));
          if (nextItem.quantity !== item.quantity) quantityAdjusted = true;
          if (Number(nextItem.price) !== Number(item.price)) pricingChanged = true;
          return nextItem;
        });

      const hasChanged =
        removedItems.length > 0 ||
        refreshed.length !== cartItems.length ||
        refreshed.some((item, index) => {
          const prev = cartItems[index];
          return (
            item.id !== prev?.id ||
            item.price !== prev?.price ||
            item.stock !== prev?.stock ||
            item.quantity !== prev?.quantity ||
            item.title !== prev?.title ||
            item.name !== prev?.name ||
            item.image !== prev?.image ||
            item.thumbnailUrl !== prev?.thumbnailUrl ||
            item.type !== prev?.type
          );
        });

      if (hasChanged) {
        setCartItems(refreshed);
      }
      if (removedItems.length > 0) {
        showToast.info("Unavailable products were removed from your cart.");
      }
      if (quantityAdjusted) {
        showToast.info("Cart quantities were adjusted to match current stock.");
      }
      if (pricingChanged) {
        showToast.info("Cart prices were refreshed with the latest product pricing.");
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

    setCartValidated(false);
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
    setCartValidated(false);
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
    setCartValidated(false);
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

  const clearCart = () => {
    setCartValidated(false);
    setCartItems([]);
  };

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
