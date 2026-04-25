import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { email } = useUser();

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authAPI.getOrders(email);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    try {
      await authAPI.cancelOrder(orderId, email);
      toast.success("Order canceled successfully!");
      fetchOrders(); // Refresh orders after cancellation
    } catch (err) {
      console.error("Failed to cancel order:", err);
      toast.error("Failed to cancel order. Please try again.");
    }
  };

  useEffect(() => {
    if (email) {
      fetchOrders();
    }
  }, [email]);

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6 text-center">My Orders</h1>
      
      {loading ? (
        <p className="text-center">Loading orders...</p>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="p-4 border rounded-lg shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-bold mb-2">Order ID: {order.order_id}</h2>
              <p className="text-gray-700 mb-2">
                <strong>Status:</strong> {order.status}
              </p>
              <div className="text-sm text-gray-700 mb-3 space-y-1">
                <p><strong>Subtotal:</strong> ₹{order.subtotal ?? 0}</p>
                <p><strong>Tax:</strong> ₹{order.tax ?? 0}</p>
                <p><strong>Shipping:</strong> ₹{order.shipping ?? 0}</p>
                <p className="font-bold"><strong>Total:</strong> ₹{order.total ?? 0}</p>
              </div>
              <div className="text-gray-700">
                <strong>Products:</strong>
                <ul className="mt-2 space-y-2">
                  {order.products.map((product, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : null}
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm">Quantity: {product.quantity}</p>
                        <p className="text-sm">Unit Price: ₹{product.price}</p>
                        <p className="text-sm">Line Total: ₹{product.line_total ?? (product.price * product.quantity)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleCancelOrder(order.order_id)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Order
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
