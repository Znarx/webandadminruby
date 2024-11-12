import React, { useState, useEffect } from "react"; // Added useEffect
import { useCart } from '@/context/CartContext';
import { useRouter } from "next/router";
import axios from 'axios'; // Added axios import

export default function Billing() {
  const { cartItems, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("Gcash");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const router = useRouter();

  // Add authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/login?redirect=/payment'); // Changed to /payment instead of /cart
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login?redirect=/payment'); // Changed to /payment instead of /cart
      }
    };

    checkAuth();
  }, [router]);

  const deliveryFee = 50;
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
  const total = subtotal + deliveryFee;

  const handlePayment = async () => {
    try {
      // First get the customer ID from the session
      const authResponse = await axios.get('/api/check-auth');
      console.log('Auth response:', authResponse.data); // Add this to debug
      
      if (!authResponse.data.customerid) {
        throw new Error('No customer ID found - please log in again');
      }
  
      const customerid = authResponse.data.customerid;
      console.log('Customer ID:', customerid); // Add this to debug
  
      // Create the order
      const orderData = {
        customerid: customerid, // Make sure customerid is explicitly set
        items: cartItems.map(item => ({
          priceid: item.priceid,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total,
        payment_method: paymentMethod,
        delivery_address: customerAddress,
        delivery_fee: deliveryFee
      };
  
      console.log('Order data being sent:', orderData); // Add this to debug
  
      const response = await axios.put('/api/orders', orderData);
  
if (response.data.orderids) {  // Note: now checking for orderids (plural)
  clearCart();
  router.push({
    pathname: "/order-record",
    query: { 
      orderids: response.data.orderids.join(','),  // Join multiple order IDs
      tracking_number: response.data.tracking_number,
      customerName, 
      customerAddress, 
      customerPhone, 
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      paymentMethod
    },
  });
}
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message); // Enhanced error logging
      alert(error.response?.data?.error || 'There was an error processing your order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Information */}
          <div className="border p-6 rounded-lg shadow-sm bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Delivery Information</h2>
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Full Name" 
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                  required
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={customerAddress} 
                  onChange={(e) => setCustomerAddress(e.target.value)} 
                  placeholder="Delivery Address" 
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                  required
                />
              </div>
              <div className="relative">
                <input 
                  type="tel" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  placeholder="Phone Number" 
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border p-6 rounded-lg shadow-sm bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Order Summary</h2>
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li key={item.id} className="flex justify-between text-gray-600">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>₱{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mt-6 border-t border-gray-300 pt-4">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Payment Method</h2>
          <div className="flex flex-col md:flex-row md:space-x-6">
            <label className="flex items-center mb-4">
              <input
                type="radio"
                id="cod"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="mr-2"
              />
              <span className="text-gray-600">Cash on Delivery</span>
            </label>
            <label className="flex items-center mb-4">
              <input
                type="radio"
                id="gcash"
                name="paymentMethod"
                value="Gcash"
                checked={paymentMethod === "Gcash"}
                onChange={() => setPaymentMethod("Gcash")}
                className="mr-2"
              />
              <span className="text-gray-600">Gcash</span>
            </label>
          </div>
        </div>

        {/* Confirm Payment Button */}
        <button
          onClick={handlePayment}
          className="w-full bg-red-500 text-white py-3 rounded-md shadow-md hover:bg-red-600 transition duration-200 text-lg font-semibold mt-6"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}