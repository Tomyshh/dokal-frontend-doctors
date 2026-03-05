import axios, { type AxiosInstance } from 'axios';
import { createClient } from '@/lib/supabase/client';
import { defaultLocale } from '@/i18n/config';

function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  const serverUrl = typeof window === 'undefined' ? process.env.BACKEND_URL : undefined;
  const url = publicUrl || serverUrl || 'http://localhost:3000';

  if (typeof window !== 'undefined' && !publicUrl) {
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

/**
 * When true, the AuthProvider has finished its initial session resolution.
 * Until then, 401 responses are treated as transient (token not yet restored
 * after a page refresh) and will NOT trigger a sign-out + redirect.
 */
let _authInitComplete = false;

export function markAuthInitComplete() {
  _authInitComplete = true;
}

export function isAuthInitComplete() {
  return _authInitComplete;
}

// Interceptor to inject Supabase JWT
api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

let handling401 = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && !handling401) {
      // During initial auth loading, tokens may not be restored yet.
      // Reject the error but don't sign out — AuthProvider will handle the state.
      if (!_authInitComplete) {
        return Promise.reject(error);
      }

      handling401 = true;
      try {
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
