import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEFAULT_PAGE_SIZE = 15;
const DEFAULT_SORT_BY = 'name';
const DEFAULT_SORT_ORDER = 'asc';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Men');
  const [subcategory, setSubcategory] = useState('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState('');
  const [searchSubcategoryFilter, setSearchSubcategoryFilter] = useState('');
  const { email, isLoggedIn } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    const parsedPage = Number(params.get('page'));
    const parsedPageSize = Number(params.get('page_size'));
    const search = params.get('search') || '';
    const category = params.get('category');
    const subcategory = params.get('subcategory');

    return {
      category: category || (search ? '' : 'Men'),
      subcategory: subcategory || (search ? '' : 'none'),
      search,
      page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
      pageSize: Number.isNaN(parsedPageSize) || parsedPageSize < 1 ? DEFAULT_PAGE_SIZE : parsedPageSize,
      sortBy: params.get('sort_by') || DEFAULT_SORT_BY,
      sortOrder: params.get('sort_order') || DEFAULT_SORT_ORDER,
      minPrice: params.get('min_price') || '',
      maxPrice: params.get('max_price') || '',
    };
  };

  const updateQueryParams = (updates) => {
    const params = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    navigate(`/products?${params.toString()}`);
  };

  const fetchSearchResults = async (searchParams) => {
    setLoading(true);
    setError('');

    try {
      const requestParams = {
        query: searchParams.search,
        page: searchParams.page,
        page_size: searchParams.pageSize,
        sort_by: searchParams.sortBy,
        sort_order: searchParams.sortOrder,
      };

      if (searchParams.minPrice !== '') {
        requestParams.min_price = Number(searchParams.minPrice);
      }

      if (searchParams.maxPrice !== '') {
        requestParams.max_price = Number(searchParams.maxPrice);
      }

      if (searchParams.category && searchParams.category !== 'none') {
        requestParams.category = searchParams.category;
      }

      if (searchParams.subcategory && searchParams.subcategory !== 'none') {
        requestParams.subcategory = searchParams.subcategory;
      }

      const { data } = await authAPI.searchProducts(requestParams);
      setProducts(data.products || []);
      setTotalItems(data.total_items || 0);
      setTotalPages(data.total_pages || 0);
      setPage(data.page || searchParams.page);
      setPageSize(data.page_size || searchParams.pageSize);
    } catch (err) {
      setError('Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (selectedCategory, selectedSubcategory, currentPage) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await authAPI.getProducts(selectedCategory, selectedSubcategory, currentPage);
      setProducts(data.products || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems((data.products || []).length);
      setPage(currentPage);
      setPageSize(DEFAULT_PAGE_SIZE);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = getQueryParams();
    setSearchQuery(params.search);
    setSortBy(params.sortBy);
    setSortOrder(params.sortOrder);
    setMinPrice(params.minPrice);
    setMaxPrice(params.maxPrice);

    if (params.search) {
      setSearchCategoryFilter(params.category && params.category !== 'none' ? params.category : '');
      setSearchSubcategoryFilter(params.subcategory && params.subcategory !== 'none' ? params.subcategory : '');
      fetchSearchResults(params);
      return;
    }

    setCategory(params.category || 'Men');
    setSubcategory(params.subcategory || 'none');
    fetchProducts(params.category || 'Men', params.subcategory || 'none', params.page);
  }, [location.search]);

  const handleSearchControlsSubmit = (e) => {
    e.preventDefault();
    updateQueryParams({
      search: searchQuery,
      page: 1,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      min_price: minPrice,
      max_price: maxPrice,
      category: searchCategoryFilter,
      subcategory: searchSubcategoryFilter,
    });
  };

  const resetSearchControls = () => {
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setMinPrice('');
    setMaxPrice('');
    setSearchCategoryFilter('');
    setSearchSubcategoryFilter('');
    updateQueryParams({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      sort_by: DEFAULT_SORT_BY,
      sort_order: DEFAULT_SORT_ORDER,
      min_price: null,
      max_price: null,
      category: null,
      subcategory: null,
    });
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      updateQueryParams({ page: page - 1 });
    }
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      updateQueryParams({ page: page + 1 });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {searchQuery && (
        <form onSubmit={handleSearchControlsSubmit} className="mb-6 bg-white p-4 rounded shadow-sm border border-gray-200">
          <div className="font-semibold mb-3">
            Search results for: "{searchQuery}"
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min price"
              className="p-2 border rounded"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              className="p-2 border rounded"
            />
            <input
              type="text"
              value={searchCategoryFilter}
              onChange={(e) => setSearchCategoryFilter(e.target.value)}
              placeholder="Category (optional)"
              className="p-2 border rounded"
            />
            <input
              type="text"
              value={searchSubcategoryFilter}
              onChange={(e) => setSearchSubcategoryFilter(e.target.value)}
              placeholder="Subcategory (optional)"
              className="p-2 border rounded"
            />
            <select
              value={pageSize}
              onChange={(e) => {
                const newPageSize = Number(e.target.value);
                setPageSize(newPageSize);
                updateQueryParams({ page: 1, page_size: newPageSize });
              }}
              className="p-2 border rounded"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Apply
              </button>
              <button type="button" onClick={resetSearchControls} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                Reset
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">Total items: {totalItems}</div>
        </form>
      )}

      {loading ? (
        <div className="text-center">Loading products...</div>
      ) : (
        <div>
          {!searchQuery && (
            <div className="mb-4 text-sm text-gray-600">
              Category: {category} {subcategory !== 'none' ? `/ ${subcategory}` : ''}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative bg-white p-4 rounded-lg shadow hover:shadow-lg transition z-10"
              >
                {isLoggedIn && (
                  <button
                    onClick={async () => {
                      try {
                        await authAPI.addFavorite(email, product.id);
                        toast.success('Added to favorites!');
                      } catch (err) {
                        toast.error('Failed to add to favorites.');
                      }
                    }}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </button>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded cursor-pointer"
                  onClick={() =>
                    navigate(`/product/${product.id}`, {
                      state: { previousPath: location.pathname + location.search },
                    })
                  }
                />
                <h3 className="mt-4 font-bold text-lg">{product.name}</h3>
                <p className="text-gray-700">${product.price}</p>
              </div>
            ))}
          </div>
          {!products.length && <div className="text-center mt-8 text-gray-500">No products found.</div>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-4">
          <button
            disabled={page === 1}
            onClick={goToPreviousPage}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={goToNextPage}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
