import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";
import { FaLock, FaUser } from "react-icons/fa";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useRouter } from 'next/router';

const Home = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const validationErrors = {};

    if (!username) {
      validationErrors.username = "Username is required";
    } else if (username.length < 4) {
      validationErrors.username = "Username must be at least 4 characters long";
    }

    if (!password) {
      validationErrors.password = "Password is required";
    } else if (password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const response = await axios.post('api/signin', { username, password });
      if (response.data.success) {
        router.push('/APin'); // Proceed to APin.js if login is successful
      } else {
        alert('Invalid username or password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during login');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        if (response.data.isAuthenticated) {
          router.push('/Apin');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
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
        <title>Ruby Belly & Lechon - Login</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col justify-center items-center w-full flex-1 px-20 text-center">
        <div className="bg-orange-900 text-white rounded-2xl shadow-2xl border-2 border-black flex justify-end items-center w-full max-w-4xl h-[30rem] relative">
          <div className="bg-orange-700 w-1/3 h-3/4 rounded-2xl shadow-md p-10 m-10">
            <div className="py-2">
              <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
              <div className="border-2 w-10 border-white inline-block mb-2"></div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col mb-4">
                <div className="flex items-center bg-gray-200 rounded-md p-2">
                  <FaUser className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                  />
                </div>
                {errors.username && <p className="text-red-500 mt-1">{errors.username}</p>}
              </div>
              <div className="flex flex-col mb-6 relative">
                <div className="flex items-center bg-gray-200 rounded-md p-2">
                  <FaLock className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 text-gray-500"
                  >
                    {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 mt-1">{errors.password}</p>}
              </div>
              <button
                type="submit"
                className="bg-white text-orange-700 font-semibold rounded-full px-4 py-2 hover:bg-orange-500 hover:text-white transition"
              >
                Log in
              </button>
            </form>
          </div>

          <div className="absolute top-4 left-4 p-2 bg-transparent rounded">
            <Image src="/Vector.png" width={24} height={24} alt="Vector Icon" />
          </div>

          <div className="absolute left-1/4 top-0 transform -translate-x-1/2 px-12 mt-24">
            <h3 className="text-5xl font-bold mb-2">Ruby</h3>
            <h1 className="text-5xl font-bold mb-2">Belly</h1>
            <h1 className="text-5xl font-bold mb-4">& Lechon</h1>
            <div className="text-center mb-4">
              <div className="border-2 w-12 border-white inline-block"></div>
            </div>
            <h1 className="text-4xl font-bold mb-10">Welcome!</h1>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
