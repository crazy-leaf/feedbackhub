const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

export const authAPI = {
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
};

export const userAPI = {
  getProfile: () => apiCall('/users/profile'),
  getTeamMembers: () => apiCall('/users/team'),
  getAllUsers: () => apiCall('/users'),
};

export const feedbackAPI = {
  getFeedback: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/feedback${query ? `?${query}` : ''}`);
  },
  createFeedback: (feedback) => apiCall('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  }),
  updateFeedback: (id, feedback) => apiCall(`/feedback/${id}`, {
    method: 'PUT',
    body: JSON.stringify(feedback),
  }),
  acknowledgeFeedback: (id) => apiCall(`/feedback/${id}/acknowledge`, {
    method: 'PATCH',
  }),
  deleteFeedback: (id) => apiCall(`/feedback/${id}`, {
    method: 'DELETE',
  }),
};