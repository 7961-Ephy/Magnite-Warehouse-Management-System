import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import CheckoutButton from "../components/CheckoutButton";
import { useCart } from "../context/CartContext";

function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/accounts/products/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
        // Initialize quantities
        const initialQuantities = {};
        data.forEach((product) => {
          initialQuantities[product.product_id] = 0;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Could not load products.");
      }
    };

    fetchProducts();
  }, []);

  const handleQuantityChange = (productId, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({
      ...prev,
      [productId]: newValue,
    }));
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product.product_id] || 0;
    if (quantity > 0) {
      addToCart(product, quantity);
      // Reset quantity after adding to cart
      setQuantities((prev) => ({
        ...prev,
        [product.product_id]: 0,
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to MagNite
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our wide range of quality products at competitive prices.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
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
                    onClick={() =>
                      handleQuantityChange(
                        product.product_id,
                        quantities[product.product_id] - 1
                      )
                    }
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={20} className="text-gray-600" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={quantities[product.product_id] || 0}
                    onChange={(e) =>
                      handleQuantityChange(product.product_id, e.target.value)
                    }
                    className="w-16 text-center border rounded-lg mx-2 py-1"
                  />

                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.product_id,
                        quantities[product.product_id] + 1
                      )
                    }
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={20} className="text-gray-600" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                  <CheckoutButton
                    onClick={() =>
                      console.log(`Checkout product ${product.product_id}`)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
