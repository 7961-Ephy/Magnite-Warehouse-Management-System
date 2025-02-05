/* eslint-disable react/prop-types */
// src/components/CheckoutButton.jsx
import { ShoppingBag } from "lucide-react";

const CheckoutButton = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full ${className}`}
    >
      <ShoppingBag size={18} />
      <span>Checkout</span>
    </button>
  );
};

export default CheckoutButton;
