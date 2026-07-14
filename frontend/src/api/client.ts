import axios, { AxiosError } from 'axios';

// In development Vite proxies /api → localhost:5000.
// In production (Netlify) VITE_API_URL must be set to the deployed backend URL,
// e.g. https://your-backend.railway.app
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const client = axios.create({
  baseURL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pc_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiErrorShape {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorShape>;
    return axiosErr.response?.data?.message || axiosErr.message || 'Something went wrong.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

export default client;
