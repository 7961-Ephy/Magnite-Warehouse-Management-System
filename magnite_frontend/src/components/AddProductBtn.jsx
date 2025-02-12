/* eslint-disable react/prop-types */
import { useState } from "react";
import { Plus } from "lucide-react";
import AddProduct from "./AddProduct";

const AddProductBtn = ({ onProductAdded }) => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleProductAdded = () => {
    onProductAdded?.();
  };

  return (
    <>
      <button
        onClick={() => setShowAddProduct(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Product
      </button>

      {showAddProduct && (
        <AddProduct
          onClose={() => setShowAddProduct(false)}
          onSuccess={handleProductAdded}
        />
      )}
    </>
  );
};

export default AddProductBtn;
