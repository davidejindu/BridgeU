// API configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://steelhacks.onrender.com';

// Debug logging
console.log('Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.MODE
});

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  PROFILE: `${API_BASE_URL}/api/profileauth`,
  CONNECTIONS: `${API_BASE_URL}/api/connections`,
  LEARNING: `${API_BASE_URL}/api/learning`,
  MESSAGES: `${API_BASE_URL}/api/messages`,
  USERS: `${API_BASE_URL}/api/auth/users`,
} as const;

// Debug logging for API endpoints
console.log('API Endpoints:', API_ENDPOINTS);

export default API_BASE_URL;
