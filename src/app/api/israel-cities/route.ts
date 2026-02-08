import { NextResponse } from 'next/server';

type RawCity = {
  id?: number | string;
  name?: string;
  eng_name?: string;
  engName?: string;
  english_name?: string;
  semel_yeshuv?: number | string;
};

function stripNonJsonPrefix(text: string) {
  const idx = text.indexOf('[');
  if (idx === -1) return text;
  return text.slice(idx);
}

function sanitizeNonStandardJson(text: string) {
  // Some sources escape apostrophes as \', which is invalid in strict JSON.
  return text.replace(/\\'/g, "'");
}

function humanizeEnglishName(s: string) {
  const trimmed = (s || '').trim();
  if (!trimmed) return '';
  // Commonly uppercase in sources. Convert to a readable form while keeping apostrophes.
  return trimmed
    .split(' ')
    .filter(Boolean)
    .map((token) =>
      token
        .split('-')
        .map((part) => {
          if (!part) return part;
          const lower = part.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('-')
    )
    .join(' ');
}

function cleanCityName(s: string) {
  let out = (s || '').trim();
  if (!out) return '';

  // Remove parenthetical content in both normal "(...)" and reversed ")...(" forms
  // (the reversed form appears in some RTL-exported datasets).
  for (let i = 0; i < 5; i++) {
    const prev = out;
    out = out.replace(/\s*\([^()]*\)\s*/g, ' ');
    out = out.replace(/\s*\)[^()]*\(\s*/g, ' ');
    if (out === prev) break;
  }

  // Remove any remaining parentheses characters and normalize spaces.
  out = out.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}

export async function GET() {
  const url = 'https://raw.githubusercontent.com/AmitMatat/israel-cities-json/master/city_list.json';

  const res = await fetch(url, {
    // Cache on the server (Next) for 30 days.
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to load cities list' },
      { status: 502 }
    );
  }

  const text = await res.text();
  const jsonText = sanitizeNonStandardJson(stripNonJsonPrefix(text));

  let raw: RawCity[];
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse cities list' },
      { status: 502 }
    );
  }

  const cities = raw
    .map((c) => {
      const idRaw = c.id ?? c.semel_yeshuv;
      const id = typeof idRaw === 'string' ? Number(idRaw) : idRaw ?? 0;
      const he = cleanCityName((c.name || '').trim());
      const enRaw = (c.eng_name ?? c.engName ?? c.english_name ?? '').trim();
      const en = cleanCityName(humanizeEnglishName(enRaw));
      return { id, he, en };
    })
    .filter((c) => Number.isFinite(c.id) && c.id > 0 && (c.he || c.en));

  return NextResponse.json(cities, {
    headers: {
      // Browser cache 1 day; CDN/server cache 30 days (when applicable).
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000',
    },
  });
}

