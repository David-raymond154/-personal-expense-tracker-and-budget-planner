import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL });

// Attach the JWT (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the API ever returns 401, the token is missing/expired — clear it and
// bounce the user to the login page.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extract a human-friendly message from an axios error.
 */
export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error || error?.message || fallback;
}

export default client;
