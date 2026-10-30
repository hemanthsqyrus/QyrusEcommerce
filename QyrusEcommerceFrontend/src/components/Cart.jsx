import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { email } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setCartItems([]);
    setSavedItems([]);
    setSelectedItems([]);
    const fetchCartItems = async () => {
      setLoading(true);
      setError('');
      try {
        const [active, saved] = await Promise.all([authAPI.getCart(email), authAPI.getSavedCart(email)]);
        if (cancelled) return;
        setCartItems(active.data.cart || []);
        setSavedItems(saved.data.saved_cart || []);
      } catch {
        if (!cancelled) setError('Failed to fetch cart details. Refresh to retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (email) {
      fetchCartItems();
    }
    return () => { cancelled = true; };
  }, [email]);

  const handleMoveItem = async (action, cartItemId) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await authAPI[action](email, cartItemId);
      setCartItems(data.cart || []);
      setSavedItems(data.saved_cart || []);
      setSelectedItems((previous) => (data.cart || []).filter(item =>
        previous.some(selected => selected.cart_item_id === item.cart_item_id)));
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update cart. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await authAPI.removeFromCart(email, cartItemId);
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.cart_item_id !== cartItemId)
      );
      // Also remove from selected items if present
      setSelectedItems((prevSelected) =>
        prevSelected.filter((item) => item.cart_item_id !== cartItemId)
      );
    } catch {
      setError('Failed to remove item from cart');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectItem = (item) => {
    if (busy) return;
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

  if (!email) return <div>Please sign in to view your cart.</div>;
  if (loading) return <div>Loading cart...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">My Cart</h1>
      {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
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
                <label className="flex items-center gap-2 mb-3" onClick={event => event.stopPropagation()}>
                  <input type="checkbox" disabled={busy}
                    checked={selectedItems.some(selected => selected.cart_item_id === item.cart_item_id)}
                    onChange={() => handleSelectItem(item)} />
                  Select for checkout
                </label>
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
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering selection on button click
                    handleRemoveItem(item.cart_item_id);
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
                <button
                  disabled={busy}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMoveItem('saveCartItem', item.cart_item_id);
                  }}
                  className="mt-4 ml-2 px-4 py-2 border rounded disabled:opacity-50"
                >
                  Save for later
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold">Total Price: ₹{calculateTotalPrice()}</h2>
            <button
              onClick={handleCheckout}
              disabled={busy || selectedItems.length === 0}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
      <section className="mt-10" aria-labelledby="saved-cart-title" aria-busy={busy}>
        <h2 id="saved-cart-title" className="text-2xl font-bold mb-4">Saved for Later ({savedItems.length})</h2>
        {savedItems.length === 0 ? <p>No saved items yet.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {savedItems.map(item => (
              <div key={item.cart_item_id} className="p-4 border rounded shadow">
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded" />
                <h3 className="text-xl font-bold mt-2">{item.name}</h3>
                <p>Color: {item.color}</p>
                <p>Size: {item.size}</p>
                <p>Provider: {item.provider}</p>
                <p>Quantity: {item.quantity}</p>
                <p className="font-bold">Price: ₹{item.price}</p>
                <button disabled={busy} onClick={() => handleMoveItem('restoreCartItem', item.cart_item_id)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Move to cart</button>
                <button disabled={busy} onClick={() => handleMoveItem('removeSavedCartItem', item.cart_item_id)}
                  className="mt-4 ml-2 px-4 py-2 border rounded disabled:opacity-50">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Cart;
