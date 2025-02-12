/* eslint-disable react/prop-types */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product, quantity) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === product.product_id
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { ...product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + item.price_per_unit * item.quantity,
      0
    );
  }, [cartItems]);

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Memoize the context value
  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      getCartItemsCount,
      clearCart,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartTotal,
      getCartItemsCount,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
