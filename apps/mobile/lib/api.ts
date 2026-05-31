import axios from 'axios';

// Replace with your deployed backend URL (e.g. https://fitself.yourdomain.com/api)
// For local dev, use your machine's local IP (not localhost — the simulator can't reach it)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'User-Agent': 'FitSelf-Mobile/1.0',
  },
});

// Attach auth token from store on every request
api.interceptors.request.use((config) => {
  // Token management can go here once JWT is implemented
  return config;
});
