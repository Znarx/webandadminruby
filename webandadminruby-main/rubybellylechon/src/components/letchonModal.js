import React, { useState, useEffect } from "react";
import Image from "next/image";
import axios from 'axios';
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext"; // Make sure the path is correct

const LetchonModal = ({ 
  isVisible, 
  onClose, 
  type
}) => {
  const [priceData, setPriceData] = useState([]);
  const [tossAnimation, setTossAnimation] = useState({ isAnimating: false, itemId: null });
  const { addToCart } = useCart();
  
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get('/api/aproduct-prices');
        console.log('Fetched price data:', response.data);
        
        const filteredPrices = response.data
          .filter(price => type === 'belly' ? price.productid === 1 : price.productid === 2)
          .map(price => ({
            priceid: price.priceid,
            productid: price.productid,
            weight: price.weight,
            price: parseFloat(price.price),
            description: price.description,
            imageUrl: price.imageUrl,
            productName: price.productName
          }));
        
        console.log('Filtered prices:', filteredPrices);
        setPriceData(filteredPrices);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isVisible) {
      fetchPrices();
    }
  }, [isVisible, type]);

  if (!isVisible) return null;

  const handleClose = (e) => {
    if (e.target.id === 'wrapper') onClose();
  };

  const handleAddToCart = (item) => {
    setTossAnimation({ isAnimating: true, itemId: item.priceid });
    
    // Pass complete item data to cart
    const orderData = {
      priceid: item.priceid,
      productid: item.productid,
      name: item.productName,
      price: item.price,
      weight: item.weight,
      description: item.description,
      imageUrl: item.imageUrl
    };

    console.log('Adding to cart:', orderData);

    setTimeout(() => {
      setTossAnimation({ isAnimating: false, itemId: null });
      addToCart(orderData);
      onClose(); // Optional: close modal after adding to cart
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-50"
      id="wrapper"
      onClick={handleClose}
    >
      <div className="w-[600px] flex flex-col">
        <button 
          className="text-white text-xl place-self-end hover:text-orange-500 px-4 py-2" 
          onClick={onClose}
        >
          X
        </button>
        <div className="p-8 bg-gray-300 rounded-lg shadow-xl relative">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {type === 'belly' ? 'Lechon Belly' : 'Lechon Baboy'}
          </h3>
          <h3 className="text-1xl font-bold text-gray-800 mb-6 text-center">Price List</h3>

          <div className="flex flex-col items-center p-2 bg-gray-200">
            <table className="table-auto border-collapse w-full text-left text-gray-700 rounded-lg overflow-hidden shadow-md">
              <thead>
                <tr className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
                  <th className="py-3 px-6 border-b">Weight</th>
                  <th className="py-3 px-6 border-b">Description</th>
                  <th className="py-3 px-6 border-b">Price</th>
                  <th className="py-3 px-6 border-b">Order</th>
                </tr>
              </thead>
              <tbody>
                {priceData.map((item) => (
                  <tr key={item.priceid} className="hover:bg-orange-50 transition duration-200">
                    <td className="py-3 px-6 border-b">{item.weight}</td>
                    <td className="py-3 px-6 border-b">{item.description}</td>
                    <td className="py-3 px-6 border-b">₱{item.price.toFixed(2)}</td>
                    <td className="py-3 px-6 border-b text-center">
                      <motion.button
                        className="bg-orange-500 hover:bg-[#f7c18e] text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                        onClick={() => handleAddToCart(item)}
                        whileTap={{ scale: 0.95 }}
                        animate={
                          tossAnimation.isAnimating && tossAnimation.itemId === item.priceid
                            ? {
                                y: [-20, -60, -20],
                                x: [0, 40, 80],
                                opacity: [1, 1, 0],
                                scale: [1, 1.2, 0.8],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                      >
                        Order
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetchonModal;