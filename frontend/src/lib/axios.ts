import axios from 'axios';
const AUTH_TOKEN_KEY = 'auth_token';

const axiosInstance = axios.create({
  // baseURL: 'https://e8bc3736fe28.ngrok.app/AIP_API/api/',
  baseURL: 'http://127.0.0.1:8000/api/FastApiService',
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 
