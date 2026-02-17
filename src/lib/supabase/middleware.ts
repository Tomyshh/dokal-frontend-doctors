import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    // Ne pas faire crasher tout le site (incl. routes publiques) si l'env est manquante.
    // En prod, une config incorrecte provoquerait sinon une "server-side exception" dès le middleware.
    // eslint-disable-next-line no-console
    console.warn(
      'Supabase env manquante: NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. ' +
        "Le middleware continue sans session (routes protégées traiteront l'utilisateur comme non connecté)."
    );
    return { user: null, supabaseResponse };
  }

  let user: unknown = null;
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Token/refresh token invalide (ex: refresh_token_not_found) → on considère l'utilisateur comme non connecté.
      // eslint-disable-next-line no-console
      console.warn('Supabase getUser() error in middleware:', error);
      user = null;
    } else {
      user = data.user ?? null;
    }
  } catch (err) {
    // Sécurité: aucune exception middleware ne doit casser le rendu d'une page publique.
    // eslint-disable-next-line no-console
    console.warn('Supabase middleware unexpected error:', err);
    user = null;
  }

  return { user: user as any, supabaseResponse };
}
