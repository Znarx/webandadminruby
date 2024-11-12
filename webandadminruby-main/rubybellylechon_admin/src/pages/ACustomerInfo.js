import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function ACustomerInfo() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    customerid: '',
    name: '',
    emailaddress: '',
    address: '',
    contactNumber: '',
  });

  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const customersPerPage = 15; // Number of customers per page

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/');
        } else {
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/acustomer');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    try {
      await axios.post('/api/acustomer', newCustomer);
      await fetchCustomers();
      setNewCustomer({ customerid: '', fullname: '', emailaddress: '', address: '', contactNumber: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/acustomer/${newCustomer.customerid}`, newCustomer);
      await fetchCustomers();
      setNewCustomer({ customerid: '', fullname: '', emailaddress: '', address: '', contactNumber: '' });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/acustomer/${id}`);
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleEditClick = (customer) => {
    setNewCustomer(customer);
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
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = customers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const totalPages = Math.ceil(customers.length / customersPerPage);

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
            <button className="w-full text-left p-2 bg-red-700 rounded">Customer's Info</button>
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

      <main className="flex-1 bg-gray-200 p-6">
        <h1 className="text-2xl text-black font-bold mb-4">Customer's Info</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="table-auto w-full bg-white mb-4 text-left border-collapse">
                <thead className="sticky top-0 bg-red-700 text-white">
                  <tr>
                    <th className="p-2 border">CustomerID</th>
                    <th className="p-2 border">Full Name</th>
                    <th className="p-2 border">Email Address</th>
                    <th className="p-2 border">Address</th>
                    <th className="p-2 border">Contact Number</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((customer) => (
                    <tr key={customer.customerid}>
                      <td className="p-2 border text-black">{customer.customerid}</td>
                      <td className="p-2 border text-black">{customer.fullname}</td>
                      <td className="p-2 border text-black">{customer.emailaddress}</td>
                      <td className="p-2 border text-black">{customer.address}</td>
                      <td className="p-2 border text-black">{customer.contactNumber}</td>
                      <td className="p-2 border text-black">
                        <button
                          className="bg-blue-500 text-white p-1 mr-2 rounded"
                          onClick={() => handleEditClick(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white p-1 rounded"
                          onClick={() => handleDelete(customer.customerid)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`bg-gray-500 text-white p-2 rounded-lg ${currentPage === 1 ? 'opacity-50' : ''}`}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`bg-gray-500 text-white p-2 rounded-lg ${currentPage === totalPages ? 'opacity-50' : ''}`}
          >
            Next
          </button>
        </div>

        <h2 className="text-xl text-black font-bold mb-4 mt-6">Manage Customer</h2>
        <form className="bg-white text-black p-4 rounded-lg shadow-md space-y-4">
          <input
            type="text"
            name="customerid"
            value={newCustomer.customerid}
            onChange={handleInputChange}
            placeholder="CustomerID"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="fullname"
            value={newCustomer.fullname}
            onChange={handleInputChange}
            placeholder="Full Name"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="emailaddress"
            value={newCustomer.emailaddress}
            onChange={handleInputChange}
            placeholder="Email Address"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="address"
            value={newCustomer.address}
            onChange={handleInputChange}
            placeholder="Address"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="contactNumber"
            value={newCustomer.contactNumber}
            onChange={handleInputChange}
            placeholder="Contact Number"
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
}
