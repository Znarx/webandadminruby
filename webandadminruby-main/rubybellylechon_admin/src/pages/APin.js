import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";
import { FaLock } from "react-icons/fa";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useRouter } from 'next/router';

const APin = () => {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pin = formData.get('pin');
  
    try {
      const response = await axios.post('/api/validate-pin', { pin });
      if (response.data.success) {
        router.push('/AProduct');
      } else {
        setError(response.data.error || 'Invalid PIN');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.error || 'Invalid PIN');
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred. Please try again.');
      }
    }
  };
  
  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (!response.data.isAuthenticated) {
          router.push('/AProduct');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/');
      }
    };
  
    checkAuth();
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen py-2"
      style={{
        backgroundImage: "url(/Login.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <Head>
        <title>Ruby Belly & Lechon - Enter Pin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col justify-center items-center w-full flex-1 px-20 text-center">
        <div className="bg-orange-900 text-white rounded-2xl shadow-2xl border-2 border-black flex justify-end items-center w-full max-w-4xl h-[30rem] relative">
          <div className="bg-orange-700 w-1/3 h-3/4 rounded-2xl shadow-md p-10 m-10">
            <div className="py-2">
              <h2 className="text-2xl font-bold text-white mb-2">Enter Pin</h2>
              <div className="border-2 w-10 border-white inline-block mb-2"></div>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Pin Field */}
              <div className="flex items-center bg-gray-200 rounded-md mb-4 p-2 relative">
                <FaLock className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type={showPin ? "text" : "password"}
                  name="pin" // Collecting the pin
                  placeholder="Pin" // Updated placeholder text
                  className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={togglePinVisibility}
                  className="absolute right-2 text-gray-500"
                >
                  {showPin ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                className="bg-white text-orange-700 font-semibold rounded-full px-4 py-2 hover:bg-orange-500 hover:text-white transition"
              >
                Submit Pin
              </button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </div>

          {/* Positioning the vector button inside the box, upper-left of "Ruby" */}
          <div className="absolute top-4 left-4 p-2 bg-transparent rounded">
        <Image src="/Vector.png" width={24} height={24} alt="Vector icon" />
      </div>

          <div className="absolute left-1/4 top-0 transform -translate-x-1/2 px-12 mt-24">
            <h3 className="text-5xl font-bold mb-2">Ruby</h3>
            <h1 className="text-5xl font-bold mb-2">Belly </h1>
            <h1 className="text-5xl font-bold mb-4">& Lechon </h1>
            <div className="text-center mb-4">
              <div className="border-2 w-12 border-white inline-block"></div>
            </div>
            <h1 className="text-4xl font-bold mb-10">Welcome! </h1>
          </div>
        </div>
      </main>
    </div>
  );
};

export default APin;