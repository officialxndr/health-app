import axios, { AxiosError } from 'axios';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'User-Agent': 'FitSelf-Mobile/1.0' },
});

let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

// Attach JWT to every request — lazy require avoids circular imports at module load
api.interceptors.request.use((config) => {
  try {
    const { useAuthStore } = require('../stores/authStore');
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* store not yet initialised */ }
  return config;
});

// Silent 401 → refresh → retry, then logout if refresh also fails
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`);
      const newToken: string = data.accessToken;
      const { useAuthStore } = require('../stores/authStore');
      useAuthStore.getState().setAccessToken(newToken);
      queue.forEach(({ resolve }) => resolve(newToken));
      queue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      queue.forEach(({ reject }) => reject(err));
      queue = [];
      try { require('../stores/authStore').useAuthStore.getState().logout(); } catch { /* ignore */ }
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
