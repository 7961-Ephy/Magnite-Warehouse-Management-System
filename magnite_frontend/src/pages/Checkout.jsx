/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  "pk_test_51Oy7iWC3Xe9wU4qj8wDElT6IIwMcNEJsWl4v5b7Vu0LGzPsBdWfdyu7NpzdWQn4FDb0fnsjbryTBipdZxJ0KHUuD006Y3kl9tW"
);

// Separate component for the payment form
const PaymentForm = ({ clientSecret, clearCart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (paymentSuccess) {
      // Wait for 2 seconds before redirecting
      const timer = setTimeout(() => {
        clearCart();
        navigate("/orders");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, clearCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (paymentError) {
      setError(paymentError.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setPaymentSuccess(true);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Payment successful! Redirecting to your orders...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createOrder = async () => {
      try {
        // Create order first
        const orderResponse = await fetch(
          "http://localhost:8000/api/accounts/orders/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              items: cartItems.map((item) => ({
                product: item.product_id,
                quantity: item.quantity,
                price: item.price_per_unit,
              })),
              total_price: getCartTotal(),
            }),
          }
        );

        if (!orderResponse.ok) {
          throw new Error("Failed to create order");
        }

        const order = await orderResponse.json();

        // Create payment intent
        const paymentResponse = await fetch(
          "http://localhost:8000/api/accounts/create-payment-intent/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              order_id: order.id,
            }),
          }
        );

        if (!paymentResponse.ok) {
          throw new Error("Failed to create payment intent");
        }

        const { clientSecret } = await paymentResponse.json();
        setClientSecret(clientSecret);
      } catch (err) {
        setError(err.message);
      }
    };

    if (cartItems.length > 0) {
      createOrder();
    }
  }, [cartItems, getCartTotal]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.product_id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  Ksh{(item.price_per_unit * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold">
                <p>Total</p>
                <p>Ksh{getCartTotal().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} clearCart={clearCart} />
            </Elements>
          ) : (
            <div className="text-center py-4">Loading payment form...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
