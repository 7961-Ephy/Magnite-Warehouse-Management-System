// src/pages/Profile.jsx
import { useAuth } from "../context/AuthContext";
import { User, Mail, BookUser, UserCircle, Phone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const phoneNumber = user?.contact_info?.additional_contact || "Not provided";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 relative">
        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <UserCircle className="w-6 h-6 mr-2" />
          Profile
        </h1>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 mr-2" />
              <h2 className="text-sm font-medium">Username</h2>
            </div>
            <p className="text-lg mt-1">{user?.username}</p>
          </div>

          <div className="border-b pb-4">
            <div className="flex items-center text-gray-700">
              <Mail className="w-5 h-5 mr-2" />
              <h2 className="text-sm font-medium">Email</h2>
            </div>
            <p className="text-lg mt-1">{user?.email}</p>
          </div>

          <div className="border-b pb-4">
            <div className="flex items-center text-gray-700">
              <BookUser className="w-5 h-5 mr-2" />
              <h2 className="text-sm font-medium">Full Name</h2>
            </div>
            <p className="text-lg mt-1">{user?.name || "Not provided"}</p>
          </div>

          <div className="border-b pb-4">
            <div className="flex items-center text-gray-700">
              <UserCircle className="w-5 h-5 mr-2" />
              <h2 className="text-sm font-medium">Role</h2>
            </div>
            <p className="text-lg mt-1 capitalize">{user?.role}</p>
          </div>

          <div className="border-b pb-4">
            <div className="flex items-center text-gray-700">
              <Phone className="w-5 h-5 mr-2" />
              <h2 className="text-sm font-medium">Contact Information</h2>
            </div>
            <p className="text-lg mt-1">{phoneNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
