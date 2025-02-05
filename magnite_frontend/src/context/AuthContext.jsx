/* eslint-disable react/prop-types */
// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem("access_token");
    const userInfoString = localStorage.getItem("user_info");

    if (token && userInfoString) {
      // Set user from local storage if token exists
      try {
        const userInfo = JSON.parse(userInfoString);
        setUser(userInfo);
      } catch (error) {
        // If parsing fails, clear local storage
        console.error("Failed to parse user info:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      const {
        access_token,
        refresh_token,
        is_superuser,
        user: userDetails,
      } = data;

      // Store tokens in local storage
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Store user info in local storage
      localStorage.setItem(
        "user_info",
        JSON.stringify({
          ...userDetails,
          is_superuser,
        })
      );

      // Set user in context
      setUser({
        ...userDetails,
        is_superuser,
      });

      return { is_superuser, userDetails };
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    // Get refresh token for logout
    const refresh_token = localStorage.getItem("refresh_token");

    try {
      // Call logout endpoint
      await fetch("http://localhost:8000/api/accounts/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      });
    } catch (error) {
      console.error("Logout error", error);
    }

    // Clear local storage and user state
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isSuperuser: user?.is_superuser || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
