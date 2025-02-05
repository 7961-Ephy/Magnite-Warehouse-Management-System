import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Home,
  LogOut,
  LogIn,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { getCartItemsCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
            >
              MagNite
            </Link>
          </div>

          {/* Middle Section - Navigation Links */}
          <div className="flex justify-center flex-1 px-2 max-w-2xl mx-auto">
            <div className="flex space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>

              <Link
                to="/orders"
                className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <Package className="w-4 h-4 mr-2" />
                Orders
              </Link>

              <Link
                to="/cart"
                className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {user && !user.is_superuser && (
                  <span className="ml-2 bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {getCartItemsCount()}
                  </span>
                )}
              </Link>

              {user && user.is_superuser && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right Section - Auth Controls */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="inline-flex items-center p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <UserCircle className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
