// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock_quantity: "",
    price_per_unit: "",
    reorder_threshold: "",
    reorder_quantity: "",
    image: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          "http://localhost:8000/api/accounts/categories/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Could not load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Handle file input separately
    if (name === "image") {
      setFormData((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("category_id", formData.category); // Changed from category to category_id
    formDataToSubmit.append("stock_quantity", formData.stock_quantity);
    formDataToSubmit.append("price_per_unit", formData.price_per_unit);
    formDataToSubmit.append("reorder_threshold", formData.reorder_threshold);
    formDataToSubmit.append("reorder_quantity", formData.reorder_quantity);

    if (formData.image) {
      formDataToSubmit.append("image", formData.image);
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        "http://localhost:8000/api/accounts/products/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSubmit,
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Product creation failed");
        } else {
          const textError = await response.text();
          console.error("Server error response:", textError);
          throw new Error("Server error occurred");
        }
      }

      const responseData = await response.json();
      setSuccess("Product added successfully!");

      // Reset form
      setFormData({
        name: "",
        category: "",
        stock_quantity: "",
        price_per_unit: "",
        reorder_threshold: "",
        reorder_quantity: "",
        image: null,
      });

      if (e.target.image) {
        e.target.image.value = "";
      }
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Add New Product</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select a Category</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="stock_quantity"
                className="block text-gray-700 mb-2"
              >
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label
                htmlFor="price_per_unit"
                className="block text-gray-700 mb-2"
              >
                Price per Unit
              </label>
              <input
                type="number"
                id="price_per_unit"
                name="price_per_unit"
                step="0.01"
                value={formData.price_per_unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label
                htmlFor="reorder_threshold"
                className="block text-gray-700 mb-2"
              >
                Reorder Threshold
              </label>
              <input
                type="number"
                id="reorder_threshold"
                name="reorder_threshold"
                value={formData.reorder_threshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label
                htmlFor="reorder_quantity"
                className="block text-gray-700 mb-2"
              >
                Reorder Quantity
              </label>
              <input
                type="number"
                id="reorder_quantity"
                name="reorder_quantity"
                value={formData.reorder_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-gray-700 mb-2">
                Product Image (Optional)
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Add Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
