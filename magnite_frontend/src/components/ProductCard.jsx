/* eslint-disable react/prop-types */
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleQuantityChange = (value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setQuantity(newValue);
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
      setQuantity(0);
    }
  };

  const handleCheckout = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
      navigate("/checkout");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h2>
        <p className="text-xl font-bold text-blue-600 mb-4">
          Ksh{product.price_per_unit.toLocaleString()}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Minus size={20} className="text-gray-600" />
          </button>

          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-16 text-center border rounded-lg mx-2 py-1"
          />

          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Plus size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
          <button
            onClick={handleCheckout}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
          >
            Checkout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
