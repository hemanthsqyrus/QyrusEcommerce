// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';


const Header = () => {
  // const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token')); // Check if user is logged in
  const { isLoggedIn, logout } = useUser();

  const [categories, setCategories] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(''); // Track hovered category
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Track if the dropdown is open
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [isaccountdropdownopen, setAccountDropdownOpen] = useState(false);


   // Update login status when the component renders or localStorage changes
  //  useEffect(() => {
  //   const checkLoginStatus = () => {
  //     setIsLoggedIn(!!localStorage.getItem('token'));
  //   };

  //   checkLoginStatus();

  //   // Optional: Listen for changes to localStorage if needed
  //   window.addEventListener('storage', checkLoginStatus);
  //   return () => {
  //     window.removeEventListener('storage', checkLoginStatus);
  //   };
  // }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const { data } = await authAPI.getCategories(); // Fetch categories
      setCategories(data.categories || {}); // Set the fetched categories
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category}&subcategory=none`);
  };
  
  const handleSubcategoryClick = (category, subcategory) => {
    navigate(`/products?category=${category}&subcategory=${subcategory}`);
  };
  

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent default form submission
    const trimmedSearch = search.trim();
    if (!trimmedSearch) {
      console.warn('Search query is empty');
      return;
    }

    const params = new URLSearchParams({
      search: trimmedSearch,
      page: '1',
      page_size: '15',
      sort_by: 'name',
      sort_order: 'asc',
    });
    navigate(`/products?${params.toString()}`);
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <button onClick={() => navigate('/products')} className="text-xl font-bold">
          Qart
        </button>

        {/* Search Bar */}

        <form
        onSubmit={handleSearch}
        className="flex items-center space-x-4 bg-gray-100 p-2 rounded shadow relative md:w-1/2" // Full width
        >
        {/* Categories Dropdown */}
        <div className="relative">
            <button
            onClick={toggleDropdown} // Toggle dropdown visibility
            className="px-4 py-2 bg-white text-black rounded-l border border-gray-300"
            >
            Categories
            </button>

            {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 bg-white text-black shadow-lg rounded z-50">
                {Object.keys(categories).map((category) => (
                <div
                    key={category}
                    className="relative group"
                    onMouseEnter={() => setHoveredCategory(category)} // Show subcategories
                    onMouseLeave={() => setHoveredCategory('')} // Hide subcategories
                >
                    <button
                    onClick={() => handleCategoryClick(category)}
                    className="block px-4 py-2 hover:bg-gray-200 w-full text-left"
                    >
                    {category}
                    </button>
                    {hoveredCategory === category && categories[category]?.length > 0 && (
                    <div className="absolute left-full top-0 bg-white text-black shadow-lg rounded z-10">
                        {categories[category].map((subcategory) => (
                        <button
                            key={subcategory}
                            onClick={() => handleSubcategoryClick(category, subcategory)}
                            className="block px-4 py-2 hover:bg-gray-200 w-full text-left"
                        >
                            {subcategory}
                        </button>
                        ))}
                    </div>
                    )}
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Search Input */}
        <input
            type="text"
            placeholder="Search products..."
            className="p-2 border rounded flex-grow text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '300px' }}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
          >
            Search
          </button>
        </form>


        {/* Login Button */}
        <nav className="flex space-x-6 items-center">
        {!isLoggedIn ? (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100"
          >
            Login
          </button>): (
            <>
              {/* Cart Icon */}
              <Link to="/cart" className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {/* <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {cartItemCount || 0}
            </span> */}

              </Link>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2" onClick={() => setAccountDropdownOpen((prev) => !prev)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
                {isaccountdropdownopen && (
                <div className="absolute right-0 mt-2 bg-white text-black shadow-lg rounded w-48 z-50">
                  <ul className="py-2">
                    <li>
                      <Link to="/account" className="block px-4 py-2 hover:bg-gray-200">
                        Account
                      </Link>
                    </li>
                    <li>
                      <Link to="/wishlist" className="block px-4 py-2 hover:bg-gray-200">
                        Wishlist
                      </Link>
                    </li>
                    <li>
                      <Link to="/my-orders" className="block px-4 py-2 hover:bg-gray-200">
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" className="block px-4 py-2 hover:bg-gray-200">
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link to="/my-address" className="block px-4 py-2 hover:bg-gray-200">
                        My Address
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
