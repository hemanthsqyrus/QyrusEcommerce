import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useUser } from "../context/UserContext";

const createCheckoutIdempotencyKey = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [upiId, setUpiId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = useUser();
  const idempotencyKeyRef = useRef(createCheckoutIdempotencyKey());

  const { addressId, products } = location.state || {};

  const handlePayment = async () => {
    if (!email) {
      alert("Please login to continue.");
      return;
    }

    if (!addressId || !products?.length) {
      alert("Missing checkout details. Please start checkout again.");
      navigate("/cart");
      return;
    }

    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    if (paymentMethod === "UPI" && !upiId) {
      alert("Please enter your UPI ID.");
      return;
    }

    if ((paymentMethod === "Credit Card" || paymentMethod === "Debit Card") && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      alert("Please fill all card details.");
      return;
    }

    const normalizedProducts = products.map((product) => ({
      productId: Number(product.productId ?? product.product_id),
      quantity: Number(product.quantity ?? 1),
      selectedColor: product.selectedColor ?? product.color ?? "",
      selectedProvider: product.selectedProvider ?? product.provider ?? "",
      selectedSize: product.selectedSize ?? product.size ?? "",
    }));

    const invalidProduct = normalizedProducts.find((product) => !Number.isFinite(product.productId) || product.productId <= 0 || product.quantity <= 0);
    if (invalidProduct) {
      alert("Invalid product details in checkout. Please retry from cart.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        email,
        addressId,
        products: normalizedProducts,
        paymentMethod,
        idempotencyKey: idempotencyKeyRef.current,
      };

      const { data } = await authAPI.createOrder(orderData, {
        idempotencyKey: idempotencyKeyRef.current,
      });

      alert(`Order placed successfully. Total: ₹${data.total}`);
      navigate("/my-orders");
    } catch (err) {
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment</h1>
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <p className="text-sm text-gray-700">Items in this order: <strong>{products?.length || 0}</strong></p>
        <p className="text-sm text-gray-600">Final subtotal, tax, shipping, and total are computed by the server at order creation time.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Select Payment Method</h2>
        {["Credit Card", "Debit Card", "UPI", "Net Banking"].map((method) => (
          <div key={method} className="flex items-center space-x-4">
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={() => setPaymentMethod(method)}
              className="mr-2"
            />
            <label>{method}</label>
          </div>
        ))}
      </div>

      {/* Conditional Input for Payment Details */}
      {paymentMethod === "Credit Card" || paymentMethod === "Debit Card" ? (
        <div className="mt-6">
          <h3 className="font-bold">Enter Card Details</h3>
          <input
            type="text"
            placeholder="Card Number"
            value={cardDetails.number}
            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
            className="block w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Expiry Date (MM/YY)"
            value={cardDetails.expiry}
            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
            className="block w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="CVV"
            value={cardDetails.cvv}
            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
            className="block w-full p-2 border rounded mb-2"
          />
        </div>
      ) : paymentMethod === "UPI" ? (
        <div className="mt-6">
          <h3 className="font-bold">Enter UPI ID</h3>
          <input
            type="text"
            placeholder="UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="block w-full p-2 border rounded"
          />
        </div>
      ) : null}

      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
