/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const CheckoutButton = ({ onClick, className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    navigate("/checkout");
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full ${className}`}
    >
      <ShoppingBag size={18} />
      <span>Checkout</span>
    </button>
  );
};

export default CheckoutButton;
