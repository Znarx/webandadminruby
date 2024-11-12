import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function AStaff() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({
    staffid: '',
    name: '',
    position: '',
    contact: '',
  });




  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/');
        } else {
          fetchStaff();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);




  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/astaff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewStaff({ ...newStaff, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    try {
      await axios.post('/api/astaff', newStaff);
      await fetchStaff();
      setNewStaff({ staffid: '', name: '', position: '', contact: '' });
    } catch (error) {
      console.error('Error adding staff member:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/astaff/${newStaff.staffid}`, newStaff);
      await fetchStaff();
      setNewStaff({ staffid: '', name: '', position: '', contact: '' });
    } catch (error) {
      console.error('Error updating staff member:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/astaff/${id}`);
      await fetchStaff();
    } catch (error) {
      console.error('Error deleting staff member:', error);
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


  

  return (
    <div className="flex h-screen">
      <aside className="bg-gray-800 w-1/4 text-white p-4">
        <div className="flex flex-col items-center">
          <FaUserCircle className="w-16 h-16 text-white" />
          <h2 className="mt-2">Admin</h2>
        </div>
        <nav className="mt-4">
          <Link href="/AProduct"><button className="w-full text-left p-2">Products</button></Link>
          <Link href="/AStaff"><button className="w-full text-left p-2 bg-red-700 mb-2">Staff</button></Link>
          <Link href="/ACustomerInfo"><button className="w-full text-left p-2">Customer's Info</button></Link>
          <Link href="/AInventory"><button className="w-full text-left p-2">Inventory</button></Link>
          <Link href="/AOrders"><button className="w-full text-left p-2">Orders</button></Link>
        </nav>
        <div className="mt-auto">
        <button onClick={handleLogout} className="w-full text-left p-2 bg-red-500 text-white rounded">
  Logout
</button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-200 p-6 overflow-y-auto">
        <h1 className="text-2xl text-black font-bold mb-4">Staff</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full bg-white mb-4">
                <thead className="sticky top-0 bg-red-700 text-white">
                  <tr>
                    <th className="p-2">StaffID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Position</th>
                    <th className="p-2">Contact Details</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.staffid}>
                      <td className="p-2 text-black border">{member.staffid}</td>
                      <td className="p-2 text-black border">{member.name}</td>
                      <td className="p-2 text-black border">{member.position}</td>
                      <td className="p-2 text-black border">{member.contact}</td>
                      <td className="p-2 text-black border">
                        <button
                          className="bg-blue-500 text-white p-1 mr-2 rounded"
                          onClick={() => setNewStaff(member)}
                        >
                          Update
                        </button>
                        <button
                          className="bg-red-500 text-white p-1 rounded"
                          onClick={() => handleDelete(member.staffid)}
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

        <h2 className="text-xl text-black font-bold mb-4 mt-6">Manage Staff</h2>
        <form className="bg-white text-black p-4 rounded-lg shadow-md space-y-4">
          <input
            type="text"
            name="staffid"
            value={newStaff.staffid}
            onChange={handleInputChange}
            placeholder="StaffID"
            className="w-full p-2 border"
          />
          <input
            type="text"
            name="name"
            value={newStaff.name}
            onChange={handleInputChange}
            placeholder="Name"
            className="w-full p-2 border"
          />
          <input
            type="text"
            name="position"
            value={newStaff.position}
            onChange={handleInputChange}
            placeholder="Position"
            className="w-full p-2 border"
          />
          <input
            type="text"
            name="contact"
            value={newStaff.contact}
            onChange={handleInputChange}
            placeholder="Contact Details"
            className="w-full p-2 border"
          />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleUpdate}
              className="bg-blue-500 text-white p-2 rounded-lg"
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="bg-green-500 text-white p-2 rounded-lg"
            >
              Add
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}