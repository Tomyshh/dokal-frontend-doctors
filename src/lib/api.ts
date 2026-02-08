import axios, { type AxiosInstance } from 'axios';
import { createClient } from '@/lib/supabase/client';

function getApiBaseUrl(): string {
  // In the browser, only NEXT_PUBLIC_* env vars are available.
  // BACKEND_URL is server-only (not exposed to the client bundle).
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  const serverUrl = typeof window === 'undefined' ? process.env.BACKEND_URL : undefined;
  const url = publicUrl || serverUrl || 'http://localhost:3000';

  if (typeof window !== 'undefined' && !publicUrl) {
    // Avoid silently calling the frontend origin in production.
    // eslint-disable-next-line no-console
    console.warn(
      'NEXT_PUBLIC_API_URL non défini. Le frontend utilisera une valeur par défaut. ' +
        'Recommandé: définir NEXT_PUBLIC_API_URL (ex: https://dokal-backend.onrender.com).'
    );
  }

  return url.replace(/\/+$/, '');
}

const API_URL = getApiBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Supabase JWT
api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to landing page
      if (typeof window !== 'undefined') {
        const locale = window.location.pathname.split('/')[1] || 'fr';
        window.location.href = `/${locale}/welcome`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
