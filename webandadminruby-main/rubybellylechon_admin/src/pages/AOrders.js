import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import OrderDetailsModal from '../components/OrderDetailsModal';

const ORDER_STATUS_OPTIONS = [
  'order_placed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const STATUS_COLORS = {
  order_placed: 'text-blue-600',
  processing: 'text-yellow-600',
  out_for_delivery: 'text-purple-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-600'
};

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/');
        } else {
          fetchOrders();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aorders');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch orders');
      }
      
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/aorders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update order');
      
      const updatedOrder = await response.json();
      setOrders(orders.map(order => 
        order.orderid === orderId ? updatedOrder : order
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDateUpdate = async (orderId, newDate) => {
    try {
      const response = await fetch(`/api/aorders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: newDate }),
      });
      
      if (!response.ok) throw new Error('Failed to update order');
      
      const updatedOrder = await response.json();
      setOrders(orders.map(order => 
        order.orderid === orderId ? updatedOrder : order
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (e, orderId) => {
    e.stopPropagation(); // Prevent event bubbling
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`/api/aorders/${orderId}/soft-delete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deleted: 1 }),
        });

        if (!response.ok) throw new Error('Failed to delete order');

        setOrders(orders.filter(order => order.orderid !== orderId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleTrackingNumberClick = (order, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOrder(order);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) return <div className="p-4">Loading orders...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="flex h-screen">
      <aside className="bg-gray-800 w-1/4 text-white p-4">
        <div className="flex flex-col items-center">
        <FaUserCircle className="w-16 h-16 text-white" />
          <h2 className="mt-2">Admin</h2>
        </div>
        <nav className="mt-4">
          <Link href="/AProduct"><button className="w-full text-left p-2">Products</button></Link>
          <Link href="/AStaff"><button className="w-full text-left p-2">Staff</button></Link>
          <Link href="/ACustomerInfo"><button className="w-full text-left p-2">Customer's Info</button></Link>
          <Link href="/AInventory"><button className="w-full text-left p-2">Inventory</button></Link>
          <Link href="/AOrders"><button className="w-full text-left p-2 bg-red-700">Orders</button></Link>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full text-left p-2">Logout</button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-200 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4 text-black">Order Management</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-red-700 text-white">
                <th className="p-2">Order ID</th>
                <th className="p-2">Tracking Number</th>
                <th className="p-2">Customer ID</th>
                <th className="p-2">Total Amount</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Payment Method</th>
                <th className="p-2">Delivery Address</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderid} className="border-b text-black">
                  <td className="p-2">{order.orderid}</td>
                  <td className="p-2">
                    <button
                      onClick={(e) => handleTrackingNumberClick(order, e)}
                      className="text-gray-600 hover:text-gray-800 hover:underline focus:outline-none"
                    >
                      {order.tracking_number}
                    </button>
                  </td>
                  <td className="p-2">{order.customerid}</td>
                  <td className="p-2">₱{order.total_amount}</td>
                  <td className="p-2">
                    <input
                      type="datetime-local"
                      defaultValue={new Date(order.date).toISOString().slice(0, 16)}
                      onChange={(e) => handleDateUpdate(order.orderid, e.target.value)}
                      className="border rounded p-1"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.orderid, e.target.value)}
                      className={`border rounded p-1 ${STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status} className={STATUS_COLORS[status]}>
                          {status.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">{order.payment_method}</td>
                  <td className="p-2">{order.delivery_address}</td>
                  <td className="p-2">
                    <button
                      onClick={(e) => handleDelete(e, order.orderid)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </main>
    </div>
  );
}