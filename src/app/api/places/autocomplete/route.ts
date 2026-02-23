import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Places Autocomplete - nécessite GOOGLE_API_KEY dans .env.local
 * (ou la même variable sur le serveur Next.js en production)
 */
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input');
  if (!input || input.trim().length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Places autocomplete not configured' },
      { status: 503 }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('components', 'country:il');
    url.searchParams.set('types', 'address');

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      status: string;
      predictions?: Array<{ place_id: string; description: string }>;
      error_message?: string;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Autocomplete error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Autocomplete failed' },
        { status: 502 }
      );
    }

    const predictions = (data.predictions ?? []).map((p) => ({
      place_id: p.place_id,
      description: p.description,
    }));

    return NextResponse.json({ predictions });
  } catch (err) {
    console.error('Places autocomplete error:', err);
    return NextResponse.json(
      { error: 'Autocomplete request failed' },
      { status: 500 }
    );
  }
}
