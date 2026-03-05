import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale } from '@/i18n/config';

/**
 * Route appelée après le retour de Google OAuth.
 * Échange le code d'autorisation contre une session Supabase et redirige vers l'app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const ref = searchParams.get('ref');
  let next = searchParams.get('next') ?? `/${defaultLocale}`;
  if (!next.startsWith('/')) {
    next = `/${defaultLocale}`;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const separator = next.includes('?') ? '&' : '?';
      const finalNext = ref ? `${next}${separator}ref=${encodeURIComponent(ref)}` : next;
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${finalNext}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${finalNext}`);
      }
      return NextResponse.redirect(`${origin}${finalNext}`);
    }
  }

  // Erreur: redirection vers la page login avec paramètre d'erreur
  const locale = next.split('/')[1] || defaultLocale;
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth_code`);
}
