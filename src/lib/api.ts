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
    'X-Client-App': 'crm',
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

// Avoid multiple redirects when several requests get 401 at once (e.g. profile + subscription/status)
let handling401 = false;

// Response error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && !handling401) {
      handling401 = true;
      try {
        // Clear Supabase session so the next page load won't retry with the same invalid token
        // (stops the loop: welcome → load → 401 → redirect → welcome → load → …)
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
      } finally {
        const locale = window.location.pathname.split('/')[1] || defaultLocale;
        window.location.href = `/${locale}/welcome`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
