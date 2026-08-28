import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { email } = useUser(); // Assuming email is available in UserContext
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await authAPI.getCart(email);
        setCartItems(data.cart || []); // Correctly access `cart` key
      } catch (err) {
        setError('Failed to fetch cart details');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchCartItems();
    }
  }, [email]);

  const handleRemoveItem = async (cartItemId) => {
    try {
      await authAPI.removeFromCart(email, cartItemId);
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.cart_item_id !== cartItemId)
      );
      // Also remove from selected items if present
      setSelectedItems((prevSelected) =>
        prevSelected.filter((item) => item.cart_item_id !== cartItemId)
      );
    } catch (err) {
      setError('Failed to remove item from cart');
    }
  };

  const handleSelectItem = (item) => {
    if (selectedItems.find((selected) => selected.cart_item_id === item.cart_item_id)) {
      // Deselect the item
      setSelectedItems((prevSelected) =>
        prevSelected.filter((selected) => selected.cart_item_id !== item.cart_item_id)
      );
    } else {
      // Select the item
      setSelectedItems((prevSelected) => [...prevSelected, item]);
    }
  };

  const handleCheckout = () => {
    const products = selectedItems.map((item) => ({
      productId: item.product_id,
      productName: item.name,
      quantity: item.quantity,
      selectedColor: item.color,
      selectedProvider: item.provider,
      selectedSize: item.size,
      price: item.price,
    }));

    navigate('/buy-now', { state: { products } });
  };

  const calculateTotalPrice = () => {
    return selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) return <div>Loading cart...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">My Cart</h1>
      {cartItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cartItems.map((item) => (
              <div
                key={item.cart_item_id}
                className={`p-4 border rounded shadow hover:shadow-lg transition ${
                  selectedItems.find((selected) => selected.cart_item_id === item.cart_item_id)
                    ? 'border-blue-500'
                    : ''
                }`}
                onClick={() => handleSelectItem(item)}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded"
                />
                <h2 className="text-xl font-bold mt-2">{item.name}</h2>
                <p className="text-gray-700">Color: {item.color}</p>
                <p className="text-gray-700">Size: {item.size}</p>
                <p className="text-gray-700">Provider: {item.provider}</p>
                <p className="text-gray-700">Quantity: {item.quantity}</p>
                <p className="text-gray-700 font-bold">Price: ₹{item.price}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering selection on button click
                    handleRemoveItem(item.cart_item_id);
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold">Total Price: ₹{calculateTotalPrice()}</h2>
            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
};

export default Cart;
