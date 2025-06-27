import axios from 'axios';
const AUTH_TOKEN_KEY = 'auth_token';

// Create axios instance with default config
const axiosInstance = axios.create({
  // baseURL: 'https://e8bc3736fe28.ngrok.app/AIP_API/api/',
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string | null) => {
  authToken = token;
  // Update localStorage
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // If we have a token, add it to the headers
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors or other auth-related errors here
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      setAuthToken(null);
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 
