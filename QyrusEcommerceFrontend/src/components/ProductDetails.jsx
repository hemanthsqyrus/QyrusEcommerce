import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from '../context/UserContext';



const ProductDetails = () => {
  const { productId } = useParams(); // Get product ID from the URL
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const navigate = useNavigate();
  const { email, isLoggedIn } = useUser();
  
  const location = useLocation();
  const [compareList, setCompareList] = useState([]);
  

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      const { data } = await authAPI.getProductDetails(productId);
      setProduct(data);

      // Set default selections
      if (data.colors?.length > 0) setSelectedColor(data.colors[0].hex);
      if (data.providers?.length > 0) setSelectedProvider(data.providers[0]);
      if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    }
  };

    // Add to Cart handler
    const handleAddToCart = async () => {
      
      if (!email) {
        toast.error('You need to log in to add items to the cart.');
        return;
      }
  
      try {
        await authAPI.addToCart(email, productId, selectedColor, selectedProvider, selectedSize, quantity);
        toast.success('Added to cart successfully!');
      } catch (err) {
        console.error('Failed to add to cart:', err);
        toast.error('Failed to add to cart. Please try again.');
      }
    };

    // Handle product comparison
  const handleCompare = () => {
    let updatedCompareList = [...compareList];

    // Check if product is already in comparison
    if (updatedCompareList.some(item => item.id === product.id)) {
      updatedCompareList = updatedCompareList.filter(item => item.id !== product.id);
    } else {
      updatedCompareList.push(product);
    }

    if (updatedCompareList.length > 3) {
      toast.error("You can compare up to 3 products.");
      return;
    }

    setCompareList(updatedCompareList);
    localStorage.setItem('compareProducts', JSON.stringify(updatedCompareList));
    toast.success("Product added for comparison!");
  };

  useEffect(() => {
    fetchProductDetails();
    const storedCompareList = JSON.parse(localStorage.getItem('compareProducts')) || [];
    setCompareList(storedCompareList);
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">

      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Back Button */}
      <button
        onClick={() => {
          if (location.state?.previousPath) {
            navigate(location.state.previousPath); // Go to the tracked previous path
          } else {
            navigate('/products'); // Fallback to products page
          }
        }}
        className="mb-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        Back
      </button>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
        {/* fav button */}
        
        
        {/* Product Image */}
        <div className="relative flex-1">
        {/* Favorites Icon */}
        {isLoggedIn && (
          <button
            onClick={async () => {
              try {
                await authAPI.addFavorite(email, product.id); // Call the addFavorite API
                console.log(`Product ${product.id} added to favorites`);
                toast.success("Added to favorites!");
              } catch (err) {
                console.error('Failed to add to favorites:', err);
                toast.error("Failed to add to favorites.");
              }
            }}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100 z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </button>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover rounded"
        />
      </div>

        {/* Product Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-700 mt-2">
            {product.category} / {product.subcategory}
          </p>
          <p className="text-xl font-bold mt-4">${product.price}</p>

          {/* Description */}
          <div className="mt-4">
            <h2 className="font-bold">Description:</h2>
            <p className="text-gray-700 mt-2">{product.description || 'No description available'}</p>
          </div>

          {/* Rating */}
          <div className="mt-4">
            <h2 className="font-bold">Rating:</h2>
            <p className="text-yellow-500 flex items-center">
              {'★'.repeat(Math.floor(product.rating || 0))}
              {'☆'.repeat(5 - Math.floor(product.rating || 0))}
              <span className="ml-2 text-gray-600">({product.rating || 'No rating'})</span>
            </p>
          </div>

          {/* Color Selection */}
          {product.colors?.length > 0 && (
            <div className="mt-4">
              <label className="font-bold">Color:</label>
              <div className="flex space-x-2 mt-2">
                {product.colors.map((color) => (
                  <div
                    key={color.hex}
                    className={`w-8 h-8 rounded-full cursor-pointer`}
                    style={{
                      backgroundColor: color.hex,
                      border: selectedColor === color.hex ? '2px solid black' : 'none',
                    }}
                    title={color.name}
                    onClick={() => setSelectedColor(color.hex)}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="mt-4">
              <label className="font-bold">Size:</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="p-2 border rounded"
              >
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Selection */}
          {product.providers?.length > 0 && (
            <div className="mt-4">
              <label className="font-bold">Provider:</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="p-2 border rounded"
              >
                {product.providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="mt-4">
            <label className="font-bold">Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="p-2 border rounded w-16"
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex space-x-4">
          <button
              onClick={() => {
                if (!email) {
                  toast.error("You need to log in to proceed.");
                  return;
                }

                // Navigate to Buy Now (Address Selection) Page
                navigate('/buy-now', {
                  state: {
                    products: [
                      {
                        productId,
                        productName: product.name,
                        quantity,
                        selectedColor,
                        selectedProvider,
                        selectedSize,
                        price: product.price,
                      },
                    ],
                  },
                });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Buy It Now!
            </button>

            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add to Cart
            </button>
            <button
              onClick={handleCompare}
              className={`px-4 py-2 rounded ${
                compareList.some(item => item.id === product.id)
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {compareList.some(item => item.id === product.id) ? 'Remove from Compare' : 'Compare'}
            </button>
          </div>

          {/* Compare Now Button */}
          {compareList.length >= 2 && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/compare')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Compare Now ({compareList.length})
              </button>
            </div>
          )}
          
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold">Comments:</h2>
        {Array.isArray(product.comments) && product.comments.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {product.comments.map((comment, index) => (
              <li key={index} className="p-4 border rounded">
                <p className="text-gray-700">{comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mt-2">No comments available.</p>
        )}
      </div>

    </div>
  );
};

export default ProductDetails;
