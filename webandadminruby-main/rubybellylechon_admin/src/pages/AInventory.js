import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

const AInventory = () => {
  const router = useRouter();
  const [supplies, setSupplies] = useState([]);
  const [newSupply, setNewSupply] = useState({
    id: '',
    quantity: '',
    supplierId: '',
    remainingStock: '',
    dateAdded: '',
    status: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const suppliesPerPage = 15;

  // Check authentication and fetch supplies on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/');
        } else {
          fetchSupplies();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch all inventory items from the server
  const fetchSupplies = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setSupplies(response.data);
    } catch (error) {
      console.error('Error fetching supplies:', error);
    }
  };

  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupply((prevSupply) => ({
      ...prevSupply,
      [name]: value,
    }));
  };

  // Add a new supply
  const handleAdd = async () => {
    try {
      await axios.post('/api/inventory', newSupply);
      fetchSupplies();
      resetForm();
    } catch (error) {
      console.error('Error adding supply:', error);
    }
  };

  // Update an existing supply
  const handleUpdate = async () => {
    try {
      await axios.put(`/api/inventory/${newSupply.id}`, newSupply);
      fetchSupplies();
      resetForm();
    } catch (error) {
      console.error('Error updating supply:', error);
    }
  };

  // Delete a supply
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/inventory/${id}`);
      fetchSupplies();
    } catch (error) {
      console.error('Error deleting supply:', error);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setNewSupply({
      id: '',
      quantity: '',
      supplierId: '',
      remainingStock: '',
      dateAdded: '',
      status: '',
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Pagination logic
  const indexOfLastSupply = currentPage * suppliesPerPage;
  const indexOfFirstSupply = indexOfLastSupply - suppliesPerPage;
  const currentSupplies = supplies.slice(indexOfFirstSupply, indexOfLastSupply);
  const totalPages = Math.ceil(supplies.length / suppliesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <aside className="bg-gray-800 w-full lg:w-1/4 text-white p-4">
        <div className="flex flex-col items-center mb-4">
          <FaUserCircle className="w-16 h-16 text-white" />
          <h2 className="mt-2">Admin</h2>
        </div>
        <nav className="space-y-2">
          <Link href="/AProduct">
            <button className="w-full text-left p-2">Products</button>
          </Link>
          <Link href="/AStaff">
            <button className="w-full text-left p-2">Staff</button>
          </Link>
          <Link href="/ACustomerInfo">
            <button className="w-full text-left p-2">Customer's Info</button>
          </Link>
          <Link href="/AInventory">
            <button className="w-full text-left p-2 bg-red-700">Inventory</button>
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

      <main className="flex-1 bg-gray-200 p-6">
        <h1 className="text-2xl text-black font-bold mb-4">Inventory</h1>
        <table className="table-auto w-full bg-white mb-4 text-left border-collapse">
          <thead className="sticky top-0 bg-red-700 text-white">
            <tr>
              <th className="p-2 border">ProductID</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">SupplierID</th>
              <th className="p-2 border">RemainingStock</th>
              <th className="p-2 border">DateAdded</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSupplies.map((supply) => (
              <tr key={supply._id}>
                <td className="p-2 border text-black">{supply.id}</td>
                <td className="p-2 border text-black">{supply.quantity}</td>
                <td className="p-2 border text-black">{supply.supplierId}</td>
                <td className="p-2 border text-black">{supply.remainingStock}</td>
                <td className="p-2 border text-black">{supply.dateAdded}</td>
                <td className="p-2 border text-black">{supply.status}</td>
                <td className="p-2 border text-black">
                  <button className="bg-blue-500 text-white p-1 mr-2" onClick={() => setNewSupply(supply)}>Edit</button>
                  <button className="bg-red-500 text-white p-1" onClick={() => handleDelete(supply._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
          <button onClick={handlePreviousPage} disabled={currentPage === 1} className={`bg-gray-500 text-white p-2 rounded-lg ${currentPage === 1 ? 'opacity-50' : ''}`}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages} className={`bg-gray-500 text-white p-2 rounded-lg ${currentPage === totalPages ? 'opacity-50' : ''}`}>
            Next
          </button>
        </div>

        <h2 className="text-xl text-black font-bold mb-4 mt-6">Manage Supplies</h2>
        <form className="bg-white text-black p-4 rounded-lg shadow-md space-y-4">
          <input
            type="text"
            name="id"
            value={newSupply.id}
            onChange={handleInputChange}
            placeholder="ProductID"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="quantity"
            value={newSupply.quantity}
            onChange={handleInputChange}
            placeholder="Quantity"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="supplierId"
            value={newSupply.supplierId}
            onChange={handleInputChange}
            placeholder="SupplierID"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="remainingStock"
            value={newSupply.remainingStock}
            onChange={handleInputChange}
            placeholder="Remaining Stock"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="dateAdded"
            value={newSupply.dateAdded}
            onChange={handleInputChange}
            placeholder="Date Added"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="status"
            value={newSupply.status}
            onChange={handleInputChange}
            placeholder="Status"
            className="w-full p-2 border rounded"
          />
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={handleUpdate} className="bg-blue-500 text-white p-2 rounded-lg">
              Update
            </button>
            <button type="button" onClick={handleAdd} className="bg-green-500 text-white p-2 rounded-lg">
              Add
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AInventory;
