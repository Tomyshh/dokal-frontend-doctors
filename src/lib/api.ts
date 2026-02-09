import axios, { type AxiosInstance } from 'axios';
import { createClient } from '@/lib/supabase/client';
import { defaultLocale } from '@/i18n/config';

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
      'NEXT_PUBLIC_API_URL is not set. The frontend will use a default value. ' +
        'Recommended: set NEXT_PUBLIC_API_URL (e.g. https://dokal-backend.onrender.com).'
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
        const locale = window.location.pathname.split('/')[1] || defaultLocale;
        window.location.href = `/${locale}/welcome`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
