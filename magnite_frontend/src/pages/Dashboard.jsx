/* eslint-disable no-unused-vars */

// pages/Dashboard.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminNavbar from "../components/AdminNavbar";
import AddProductBtn from "../components/AddProductBtn";
import {
  Package2,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Archive,
  Clock,
} from "lucide-react";

function Dashboard() {
  const { user } = useAuth();
  const [recentActivity] = useState([
    {
      id: 1,
      type: "order",
      message: "New order #1234 received",
      time: "5 minutes ago",
      status: "pending",
    },
    {
      id: 2,
      type: "stock",
      message: 'Product "Gaming Mouse" is low on stock',
      time: "2 hours ago",
      status: "warning",
    },
    {
      id: 3,
      type: "sale",
      message: "Daily sales goal reached",
      time: "4 hours ago",
      status: "success",
    },
    {
      id: 4,
      type: "order",
      message: "Order #1233 has been delivered",
      time: "5 hours ago",
      status: "success",
    },
  ]);

  const stats = [
    {
      title: "Total Sales",
      value: "$12,426",
      change: "+16%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Active Orders",
      value: "23",
      change: "+5%",
      icon: ShoppingCart,
      trend: "up",
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "-2",
      icon: Archive,
      trend: "down",
    },
    {
      title: "Total Products",
      value: "142",
      change: "+12",
      icon: Package2,
      trend: "up",
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4" />;
      case "stock":
        return <AlertCircle className="w-4 h-4" />;
      case "sale":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "warning":
        return "bg-red-50 text-red-700";
      case "success":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, Admin
              </h1>
              <p className="text-gray-600 mt-1">
                Here&apos;s what&apos;s happening with your store today.
              </p>
            </div>
            <AddProductBtn />
          </div>

          {/* Stats Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    from last week
                  </span>
                </div>
              </div>
            ))}
          </div> */}

          {/* Recent Activity */}
          {/* <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(
                      activity.status
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      activity.status
                    )}`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
