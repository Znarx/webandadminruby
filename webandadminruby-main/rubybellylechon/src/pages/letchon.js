import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaPlusCircle } from "react-icons/fa";
import LetchonModal from "../components/letchonModal"; 
import { Fragment, useState, useEffect } from "react";
import { useCart } from "../context/CartContext"; // Updated import path
import { useRouter } from 'next/router';
import axios from 'axios';

const Letchon = () => {
    const [showModal, setShowModal] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [products, setProducts] = useState([]);
    const { addToCart, cartItems } = useCart();
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/check-auth');
                if (!response.data.isAuthenticated) {
                    router.push('/login?redirect=/letchon');
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                router.push('/login?redirect=/letchon');
            }
        };

        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/aproducts');
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        checkAuth();
        fetchProducts();
    }, [router]);

    const handleOrder = (orderData) => {
        addToCart(orderData);
        
        if (orderData.name === "Lechon Belly") {
            setShowModal(false);
        } else {
            setShowModal2(false);
        }
    };

    // Calculate total items in cart
    const cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

    const lechonBelly = products.find(p => p?.name === 'Lechon Belly');
    const lechonBaboy = products.find(p => p?.name === 'Lechon Baboy');

    return (
        <Fragment>
        <div>
            <div className="w-full max-w-1xl mx-auto flex items-center justify-between border-b-2 px-2 py-7 h-16 bg-black shadow-md">
                {/* Previous header content remains the same until cart button */}
                <div className="flex items-center space-x-8">
                    <Image
                        src="/Vector.png"
                        alt="Letchon Logo"
                        width={40}
                        height={35}
                        className="object-contain"
                    />
                </div>
                {/* Navigation links remain the same */}
                <div className="flex-grow flex justify-center">
                    <div className="flex space-x-6">
                        <Link href="/letchon">
                            <button className="text-white font-bold hover:text-orange-500 transition bg-transparent border-none cursor-pointer">
                                Lechon
                            </button>
                        </Link>
                        <Link href="/viands">
                            <button className="text-white font-bold hover:text-orange-500 transition bg-transparent border-none cursor-pointer">
                                Viands
                            </button>
                        </Link>
                        <Link href="/packages">
                            <button className="text-white font-bold hover:text-orange-500 transition bg-transparent border-none cursor-pointer">
                                Packages
                            </button>
                        </Link>
                        <Link href="/aboutus">
                            <button className="text-white font-bold hover:text-orange-500 transition bg-transparent border-none cursor-pointer">
                                About Us
                            </button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center space-x-8">
                    <Link href="/profile">
                        <button className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-800 rounded">
                            <Image
                                src="/profile.png"
                                alt="Profile"
                                width={24}
                                height={24}
                                className="cursor-pointer"
                            />
                        </button>
                    </Link>
                    <Link href="/cart">
                        <div className="relative">
                            <button className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-800 rounded">
                                <Image
                                    src="/cart.png"
                                    alt="Cart"
                                    width={24}
                                    height={24}
                                    className="cursor-pointer"
                                />
                            </button>
                            {cartItemCount > 0 && (
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {cartItemCount}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </div>

            <div className="relative bg-[#f7c18e] w-full h-[85vh] flex items-center justify-center">
                <div className="absolute inset-0">
                    <Image
                        src="/hehe.png" 
                        alt="Lechon Background"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="relative flex flex-col md:flex-row items-center justify-around w-full px-4 py-6">
                    {/* Lechon Belly Card */}
                    {lechonBelly && (
                        <div className="relative bg-[#ff6b35] text-white rounded-lg shadow-lg p-6 md:p-10 mb-6 md:mb-0 md:w-[45%] translate-y-8">
                            <button className="absolute top-0 right-0 transform translate-x-4 -translate-y-4"
                                onClick={() => setShowModal(true)}>
                                <Image
                                    src={lechonBelly.imageUrl}
                                    alt={lechonBelly.name}
                                    width={210}
                                    height={200} 
                                    className="rounded-full border-4 border-white"
                                />
                            </button>
                           <div className="ml-72 mt-8 flex items-center space-x-4">  
                                <h2 className="text-3xl font-bold mb-4">{lechonBelly.name}</h2>
                                <button 
                                    className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 p-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-orange-600 focus:outline-none"
                                    onClick={() => setShowModal(true)}>
                                    <FaPlusCircle className="text-xl" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lechon Baboy Card */}
                    {lechonBaboy && (
                        <div className="left-8 relative bg-[#ff6b35] text-white rounded-lg shadow-lg p-6 md:p-10 md:mb-0 md:w-[45%] -translate-y-8">
                            <button className="absolute top-0 left-0 transform -translate-x-4 -translate-y-4"
                                onClick={() => setShowModal2(true)}>
                                <Image
                                    src={lechonBaboy.imageUrl}
                                    alt={lechonBaboy.name}
                                    width={250}
                                    height={300} 
                                    className="rounded-full border-4 border-white"
                                />
                            </button>
                           <div className="ml-72 mt-8 flex items-center space-x-4">
                                <h2 className="text-4xl font-bold mb-4">{lechonBaboy.name}</h2>
                                <button 
                                    className="absolute top-0 left-0 transform -translate-x-4 -translate-y-4 p-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-orange-600 focus:outline-none"
                                    onClick={() => setShowModal2(true)}>
                                    <FaPlusCircle className="text-xl" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="bg-black text-white py-6">
                <div className="container mx-auto flex justify-center space-x-8">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:bg-gray-900 p-2 rounded-md group cursor-pointer hover:shadow-lg">
                        <FaTwitter className="text-2xl text-gray-600 group-hover:text-white" />
                        <span className="ml-2 text-gray-600 group-hover:text-white">Twitter</span>
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:bg-gray-900 p-2 rounded-md group cursor-pointer hover:shadow-lg">
                        <FaFacebook className="text-2xl text-gray-600 group-hover:text-white" />
                        <span className="ml-2 text-gray-600 group-hover:text-white">Facebook</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:bg-gray-900 p-2 rounded-md group cursor-pointer hover:shadow-lg">
                        <FaInstagram className="text-2xl text-gray-600 group-hover:text-white" />
                        <span className="ml-2 text-gray-600 group-hover:text-white">Instagram</span>
                    </a>
                </div>
            </footer>
        </div>

        {/* Modal Components */}
        <LetchonModal 
            isVisible={showModal} 
            onClose={() => setShowModal(false)} 
            type="belly"
            handleOrder={() => lechonBelly && handleOrder(lechonBelly)}
        />

        <LetchonModal 
            isVisible={showModal2} 
            onClose={() => setShowModal2(false)} 
            type="baboy"
            handleOrder={() => lechonBaboy && handleOrder(lechonBaboy)}
        />
        </Fragment>
    );
};

export default Letchon;