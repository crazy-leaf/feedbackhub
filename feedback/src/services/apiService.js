const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  _getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        ...this._getAuthHeaders(),
        ...options.headers,
      },
      ...options,
      credentials: "include",
    };

    if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }


    

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.warn("Authentication error (401).");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }


  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async verifyToken() {
    return this.request("/auth/verify", {
      method: "GET",
    });
  }

  async getMyProfile() {
    return this.request("/auth/me", {
      method: "GET",
    });
  }


  async getTeamMembersForManager(managerId) {
    return this.request(`/users/team/${managerId}`, { method: 'GET' });
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`, { method: 'GET' });
  }


 async getFeedback(params = {}) {

    const queryString = new URLSearchParams(params).toString();
    return this.request(`/feedback${queryString ? `?${queryString}` : ""}`, { method: 'GET' });
  }

  async getFeedbackById(feedbackId) {
    return this.request(`/feedback/${feedbackId}`, { method: 'GET' });
  }

  async createFeedback(feedbackData) {
    return this.request("/feedback", {
      method: "POST",
      body: feedbackData,
    });
  }

  async updateFeedback(feedbackId, updates) {
    return this.request(`/feedback/${feedbackId}`, {
      method: "PUT",
      body: updates,
    });
  }

  async acknowledgeFeedback(feedbackId) {
    return this.request(`/feedback/${feedbackId}/acknowledge`, {
      method: "PATCH",
    });
  }

  async deleteFeedback(feedbackId) {
    return this.request(`/feedback/${feedbackId}`, {
      method: "DELETE",
    });
  }


  async getDashboardStats(userId, role) {
    const queryString = new URLSearchParams({ user_id: userId, role: role }).toString();
    return this.request(`/dashboard/stats?${queryString}`, { method: 'GET' });
  }

  async getRecentFeedback(userId, role, limit = 5) {
    const queryString = new URLSearchParams({ user_id: userId, role: role, limit: limit }).toString();
    return this.request(`/dashboard/recent?${queryString}`, { method: 'GET' });
  }
}

export const apiService = new ApiService();