import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState('');
  const [clearingCart, setClearingCart] = useState(false);
  const { email } = useUser();
  const navigate = useNavigate();

  const fetchCartItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.getCart(email);
      setCartItems(data.cart || []);
    } catch (err) {
      setError('Failed to fetch cart details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchCartItems();
    }
  }, [email]);

  useEffect(() => {
    setSelectedItemIds((prevIds) =>
      prevIds.filter((id) => cartItems.some((item) => item.cart_item_id === id))
    );
  }, [cartItems]);

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedItemIds.includes(item.cart_item_id)),
    [cartItems, selectedItemIds]
  );

  const handleRemoveItem = async (cartItemId) => {
    setError('');
    try {
      const { data } = await authAPI.removeFromCart(email, cartItemId);
      if (Array.isArray(data?.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems((prevItems) =>
          prevItems.filter((item) => item.cart_item_id !== cartItemId)
        );
      }
      setSelectedItemIds((prevIds) => prevIds.filter((id) => id !== cartItemId));
    } catch (err) {
      setError('Failed to remove item from cart');
    }
  };

  const handleSelectItem = (cartItemId) => {
    setSelectedItemIds((prevIds) =>
      prevIds.includes(cartItemId)
        ? prevIds.filter((id) => id !== cartItemId)
        : [...prevIds, cartItemId]
    );
  };

  const handleQuantityChange = async (cartItemId, nextQuantity) => {
    if (nextQuantity < 1) return;

    setUpdatingItemId(cartItemId);
    setError('');
    try {
      const { data } = await authAPI.updateCartItemQuantity(email, cartItemId, nextQuantity);
      if (Array.isArray(data?.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.cart_item_id === cartItemId ? { ...item, quantity: nextQuantity } : item
          )
        );
      }
    } catch (err) {
      setError('Failed to update quantity');
    } finally {
      setUpdatingItemId('');
    }
  };

  const handleClearCart = async () => {
    setClearingCart(true);
    setError('');
    try {
      await authAPI.clearCart(email);
      setCartItems([]);
      setSelectedItemIds([]);
    } catch (err) {
      setError('Failed to clear cart');
    } finally {
      setClearingCart(false);
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
    return selectedItems.reduce(
      (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  };

  if (loading) return <div>Loading cart...</div>;

  return (
    <div className="container mx-auto p-6">
      {error ? <div className="mb-4 text-red-500">{error}</div> : null}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Cart</h1>
        <button
          onClick={handleClearCart}
          disabled={cartItems.length === 0 || clearingCart}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {clearingCart ? 'Clearing...' : 'Clear Cart'}
        </button>
      </div>

      {cartItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cartItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.cart_item_id);
              const isUpdatingThisItem = updatingItemId === item.cart_item_id;

              return (
                <div
                  key={item.cart_item_id}
                  className={`rounded border p-4 shadow transition hover:shadow-lg ${
                    isSelected ? 'border-blue-500' : ''
                  }`}
                  onClick={() => handleSelectItem(item.cart_item_id)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-40 w-full rounded object-cover"
                  />
                  <h2 className="mt-2 text-xl font-bold">{item.name}</h2>
                  <p className="text-gray-700">Color: {item.color}</p>
                  <p className="text-gray-700">Size: {item.size}</p>
                  <p className="text-gray-700">Provider: {item.provider}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-gray-700">Quantity:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.cart_item_id, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1 || isUpdatingThisItem}
                      className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.cart_item_id, item.quantity + 1);
                      }}
                      disabled={isUpdatingThisItem}
                      className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <p className="mt-2 font-bold text-gray-700">Price: ₹{item.price}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.cart_item_id);
                    }}
                    className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold">Total Price: ₹{calculateTotalPrice()}</h2>
            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="mt-4 rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
