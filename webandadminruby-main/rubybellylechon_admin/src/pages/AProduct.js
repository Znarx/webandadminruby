import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/router';

// Add this near the top of your AProduct.js file, after the imports
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or however you store your auth token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function AProduct() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    imageUrl: '',
    category: '',
    priceDetails: {
      weight: '',
      price: '',
      description: ''
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/');
        } else {
          fetchProducts();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/aproducts');
      console.log('Fetched products:', response.data);
  
      const productsWithPrices = await Promise.all(
        response.data.map(async (product) => {
          const priceResponse = await axios.get(`/api/aproduct-prices/${product.productid}`);
          return {
            ...product,
            priceDetails: priceResponse.data || []
          };
        })
      );
      
      // Filter out products where deleted is 1
      const filteredProducts = productsWithPrices.filter(product => product.deleted !== 1);
      console.log('Filtered products:', filteredProducts);
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('price.')) {
      const priceField = name.split('.')[1];
      setNewProduct(prev => ({
        ...prev,
        priceDetails: {
          ...prev.priceDetails,
          [priceField]: value
        }
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAdd = async () => {
    try {
      const productResponse = await axios.post('/api/aproducts', {
        name: newProduct.name,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        category: newProduct.category,
        deleted: false
      });

      if (productResponse.data.id) {
        await axios.post('/api/aproduct-prices', {
          productid: productResponse.data.id,
          weight: newProduct.priceDetails.weight,
          price: newProduct.priceDetails.price,
          description: newProduct.priceDetails.description
        });
      }

      await fetchProducts();
      setNewProduct({
        name: '',
        description: '',
        imageUrl: '',
        category: '',
        priceDetails: {
          weight: '',
          price: '',
          description: ''
        }
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!newProduct.productid) {
        console.error('No product selected for update');
        return;
      }
  
      await axios.put(`/api/aproducts/${newProduct.productid}`, {
        name: newProduct.name,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        category: newProduct.category
      });
  
      if (newProduct.priceDetails.priceid) {
        await axios.put(`/api/aproduct-prices/${newProduct.priceDetails.priceid}`, {
          weight: newProduct.priceDetails.weight,
          price: newProduct.priceDetails.price,
          description: newProduct.priceDetails.description
        });
      } else {
        await axios.post('/api/aproduct-prices', {
          productid: newProduct.productid,
          weight: newProduct.priceDetails.weight,
          price: newProduct.priceDetails.price,
          description: newProduct.priceDetails.description
        });
      }
  
      // Refresh the products list
      await fetchProducts();
      
      // Reset the form
      setNewProduct({
        name: '',
        description: '',
        imageUrl: '',
        category: '',
        priceDetails: {
          weight: '',
          price: '',
          description: ''
        }
      });
  
      // Show success message
      alert('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
    }
  };
  // In AProduct.js, update the handleDelete function:
const handleDelete = async (id) => {
  try {
    // Add confirmation dialog
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    console.log('Attempting to delete product:', id);
    
    const response = await axios.put(`/api/aproducts/${id}/soft-delete`);
    if (response.status === 200) {
      console.log('Product successfully deleted');
      // Update the local state to remove the deleted product
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.productid === id 
            ? { ...product, deleted: 1 }
            : product
        )
      );
      // Refresh the products list
      await fetchProducts();
    }
  } catch (error) {
    console.error('Error deleting product:', error.response?.data || error.message);
    alert('Error deleting product. Please try again.');
  }
};

  const handleAddPrice = async (productId) => {
    try {
      await axios.post('/api/aproduct-prices', {
        productid: productId,
        weight: newProduct.priceDetails.weight,
        price: newProduct.priceDetails.price,
        description: newProduct.priceDetails.description
      });
      await fetchProducts();
      setNewProduct({
        ...newProduct,
        priceDetails: {
          weight: '',
          price: '',
          description: ''
        }
      });
    } catch (error) {
      console.error('Error adding price:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="bg-gray-800 w-full lg:w-1/4 text-white p-4">
        <div className="flex flex-col items-center mb-4">
          <FaUserCircle className="w-16 h-16 text-white" />
          <h2 className="mt-2">Admin</h2>
        </div>
        <nav className="space-y-2">
          <Link href="/AProduct">
            <button className="w-full text-left p-2 bg-red-700 rounded">Products</button>
          </Link>
          <Link href="/AStaff">
            <button className="w-full text-left p-2">Staff</button>
          </Link>
          <Link href="/ACustomerInfo">
            <button className="w-full text-left p-2">Customer's Info</button>
          </Link>
          <Link href="/AInventory">
            <button className="w-full text-left p-2">Inventory</button>
          </Link>
          <Link href="/AOrders">
            <button className="w-full text-left p-2">Orders</button>
          </Link>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full text-left p-2 bg-red-500 text-white rounded">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-200 p-6">
        <h1 className="text-2xl text-black font-bold mb-4">Products</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="table-auto w-full bg-white mb-4 text-left border-collapse">
                <thead className="sticky top-0 bg-red-700 text-white">
                  <tr>
                    <th className="p-2 border">Product ID</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Pricing Details</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <React.Fragment key={product.productid}>
                      <tr>
                        <td className="p-2 border text-black">{product.productid}</td>
                        <td className="p-2 border text-black">{product.name}</td>
                        <td className="p-2 border text-black">{product.description}</td>
                        <td className="p-2 border text-black">{product.category}</td>
                        <td className="p-2 border text-black">
                          <button 
                            onClick={() => setExpandedProduct(expandedProduct === product.productid ? null : product.productid)}
                            className="text-blue-500 underline"
                          >
                            {product.priceDetails.length} price options
                          </button>
                        </td>
                        <td className="p-2 border text-black">
                          
                          <button
                            className="bg-red-500 text-white p-1 rounded"
                            onClick={() => handleDelete(product.productid)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedProduct === product.productid && (
                        <tr>
                          <td colSpan="6" className="p-2 border bg-gray-50">
                            <div className="grid grid-cols-3 gap-4">
                            {product.priceDetails.map((price) => (
  <div key={price.priceid} className="bg-white p-2 rounded shadow text-black">
    <p><strong>Weight:</strong> {price.weight}</p>
    <p><strong>Price:</strong> ₱{price.price}</p>
    <p><strong>Description:</strong> {price.description}</p>
    <button
      className="bg-blue-500 text-white p-1 mt-2 rounded mr-2"
      onClick={() => setNewProduct({
        ...product,
        priceDetails: price
      })}
    >
      Edit
    </button>
    {/* Add Update button */}
    <button
      className="bg-green-500 text-white p-1 mt-2 rounded"
      onClick={() => handleUpdate()}
    >
      Update
    </button>
  </div>
))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`bg-gray-500 text-white p-2 rounded-lg ${
              currentPage === 1 ? 'opacity-50' : ''
            }`}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`bg-gray-500 text-white p-2 rounded-lg ${
              currentPage === totalPages ? 'opacity-50' : ''
            }`}
          >
            Next
          </button>
        </div>

        {/* Product Form */}
        <h2 className="text-xl text-black font-bold mb-4 mt-6">
          {newProduct.productid ? 'Add Price' : 'Add New Product'}
        </h2>
        <form className="bg-white text-black p-4 rounded-lg shadow-md space-y-4">
          {!newProduct.productid && (
            <>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                placeholder="Product Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                placeholder="Description"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="imageUrl"
                value={newProduct.imageUrl}
                onChange={handleInputChange}
                placeholder="Image URL"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                placeholder="Category"
                className="w-full p-2 border rounded"
              />
            </>
          )}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Price Details</h3>
            <input
              type="text"
              name="price.weight"
              value={newProduct.priceDetails.weight}
              onChange={handleInputChange}
              placeholder="Weight"
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              name="price.price"
              value={newProduct.priceDetails.price}
              onChange={handleInputChange}
              placeholder="Price"
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              name="price.description"
              value={newProduct.priceDetails.description}
              onChange={handleInputChange}
              placeholder="Price Description"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end space-x-4">
            {newProduct.productid ? (
              <button
                type="button"
                onClick={() => handleAddPrice(newProduct.productid)}
                className="bg-green-500 text-white p-2 rounded-lg"
              >
                Add Price
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-green-500 text-white p-2 rounded-lg"
              >
                Add Product
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}