// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  PROFILE: `${API_BASE_URL}/api/profileauth`,
  CONNECTIONS: `${API_BASE_URL}/api/connections`,
  LEARNING: `${API_BASE_URL}/api/learning`,
  MESSAGES: `${API_BASE_URL}/api/messages`,
  USERS: `${API_BASE_URL}/api/auth/users`,
} as const;

export default API_BASE_URL;
