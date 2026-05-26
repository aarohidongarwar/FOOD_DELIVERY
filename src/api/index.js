import axios from 'axios';
import { getMockResponse } from './mockData';

// Toggle this to false when the real backend is ready
const USE_MOCK_FALLBACK = false;

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quickbite_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors — with mock data fallback when backend is unavailable
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';

    // If mock fallback is enabled and the request failed (network error / no backend),
    // try to return mock data instead of erroring out
    if (USE_MOCK_FALLBACK) {
      const isNetworkError = !error.response; // No response = server unreachable
      const is404or500 = error.response?.status >= 400;

      if (isNetworkError || is404or500) {
        const mockResponse = getMockResponse(requestUrl, error.config);
        if (mockResponse) {
          console.log(`🔶 [Mock] Serving mock data for: ${requestUrl}`);
          return Promise.resolve(mockResponse);
        }
      }
    }

    // Handle 401 errors globally (only when not using mock fallback)
    if (error.response?.status === 401) {
      localStorage.removeItem('quickbite_token');
      localStorage.removeItem('quickbite_user');
      // Only redirect if not already on login page or admin page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
