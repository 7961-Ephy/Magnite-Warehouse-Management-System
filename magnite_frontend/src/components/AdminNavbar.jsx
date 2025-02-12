import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart2,
  Package2,
  ChevronLeft,
  Menu,
} from "lucide-react";

const AdminNavbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/orders", icon: ShoppingCart, label: "Orders" },
    { path: "/statistics", icon: BarChart2, label: "Statistics" },
    { path: "/products", icon: Package2, label: "Products" },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div
      className={`min-h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header/Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
          >
            MagNite
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <Menu size={20} className="text-gray-600" />
          ) : (
            <ChevronLeft size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 px-2 pt-4">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActivePath(path)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon size={20} />
            {!isCollapsed && <span className="font-medium">{label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminNavbar;
