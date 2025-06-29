import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { apiService } from "../services/apiService";

import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const navigate = useNavigate();


  const verifySession = useCallback(async () => {

    if (!loading) setLoading(true);

    setError(null);

    try {
      const currentUser = await apiService.verifyToken();

      setUser(currentUser);
    } catch (err) {
      console.warn(
        "No active session or token invalid, navigating to login:",
        err.message
      );

      setUser(null);


      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, loading]);


  useEffect(() => {


    if (user === null && loading) {
      verifySession();
    }
  }, [user, loading, verifySession]);

  const login = async (email, password) => {
    setLoading(true);

    setError(null);

    try {
      const loggedInUser = await apiService.login(email, password);

      setUser(loggedInUser);

      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);

      const errorMessage =
        err.message || "Login failed. Please check your credentials.";

      setError(errorMessage);

      setUser(null);

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    setError(null);

    try {
      await apiService.logout();

      setUser(null);

      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);

      setError(err.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };




  const getTeamMembers = async (managerId) => {



    try {
      const teamMembers = await apiService.getTeamMembersForManager(managerId);

      return teamMembers;
    } catch (err) {
      console.error("Failed to fetch team members:", err);

      throw err;
    }
  };

  const getFeedback = async (params = {}) => {
    try {
      const fetchedFeedback = await apiService.getFeedback(params);

      return fetchedFeedback;
    } catch (err) {
      console.error("Failed to fetch feedback:", err);

      throw err;
    }
  };

  const createFeedback = async (feedbackData) => {
    try {
      const newFeedback = await apiService.createFeedback(feedbackData);

      return newFeedback;
    } catch (err) {
      console.error("Failed to create feedback:", err);

      throw err;
    }
  };

  const updateFeedback = async (feedbackId, updates) => {
    try {
      const updated = await apiService.updateFeedback(feedbackId, updates);

      return updated;
    } catch (err) {
      console.error("Failed to update feedback:", err);

      throw err;
    }
  };

  const acknowledgeFeedback = async (feedbackId) => {
    try {
      const acknowledged = await apiService.acknowledgeFeedback(feedbackId);

      return acknowledged;
    } catch (err) {
      console.error("Failed to acknowledge feedback:", err);

      throw err;
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      await apiService.deleteFeedback(feedbackId);

      return true;
    } catch (err) {
      console.error("Failed to delete feedback:", err);

      throw err;
    }
  };

  const getDashboardStats = async (userId, role) => {
    try {
      const stats = await apiService.getDashboardStats(userId, role);

      return stats;
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);

      throw err;
    }
  };

  const getRecentFeedback = async (userId, role, limit = 5) => {
    try {
      const recent = await apiService.getRecentFeedback(userId, role, limit);

      return recent;
    } catch (err) {
      console.error("Failed to fetch recent feedback:", err);

      throw err;
    }
  };

  const getUserById = async (userId) => {
    try {
      const fetchedUser = await apiService.getUserById(userId);

      return fetchedUser;
    } catch (err) {
      console.error("Failed to fetch user by ID:", err);

      throw err;
    }
  };

  const value = {
    user,

    loading,

    error,

    login,

    logout,

    isAuthenticated: !!user,

    role: user?.role,

    getTeamMembers,

    getFeedback,

    createFeedback,

    updateFeedback,

    acknowledgeFeedback,

    deleteFeedback,

    getDashboardStats,

    getRecentFeedback,

    getUserById,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
