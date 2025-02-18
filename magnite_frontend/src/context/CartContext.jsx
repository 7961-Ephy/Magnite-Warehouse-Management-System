/* eslint-disable react/prop-types */
import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity) => {
    console.log("Adding to cart:", { product, quantity });
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === product.product_id
      );

      // Add logging to debug price
      console.log("Adding product with price:", product.price_per_unit);

      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                price_per_unit: product.price_per_unit, // Ensure price is updated
              }
            : item
        );
      }

      return [
        ...prevItems,
        {
          ...product,
          quantity,
          price_per_unit: product.price_per_unit, // Explicitly set price
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    console.log("Cart items for total:", cartItems);
    return cartItems.reduce(
      (total, item) => total + item.price_per_unit * item.quantity,
      0
    );
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartItemsCount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
