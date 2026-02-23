import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function getComponent(components: AddressComponent[], type: string): string {
  const c = components.find((x) => x.types.includes(type));
  return c?.long_name ?? '';
}

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('place_id');
  if (!placeId?.trim()) {
    return NextResponse.json(
      { error: 'place_id is required' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Places geocode not configured' },
      { status: 503 }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set(
      'fields',
      'address_components,formatted_address,geometry'
    );

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      status: string;
      result?: {
        address_components: AddressComponent[];
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      };
      error_message?: string;
    };

    if (data.status !== 'OK' || !data.result) {
      console.error('Google Place Details error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Place details failed' },
        { status: 502 }
      );
    }

    const { address_components, formatted_address, geometry } = data.result;
    const streetNumber = getComponent(address_components, 'street_number');
    const route = getComponent(address_components, 'route');
    const locality = getComponent(address_components, 'locality');
    const postalCode = getComponent(address_components, 'postal_code');
    const sublocality = getComponent(address_components, 'sublocality');

    const addressLine = [streetNumber, route].filter(Boolean).join(' ') || formatted_address;
    const city = locality || sublocality || '';
    const zipCode = postalCode || '';
    const { lat, lng } = geometry.location;

    return NextResponse.json({
      address_line: addressLine,
      zip_code: zipCode,
      city,
      latitude: lat,
      longitude: lng,
      formatted_address: formatted_address,
    });
  } catch (err) {
    console.error('Places geocode error:', err);
    return NextResponse.json(
      { error: 'Geocode request failed' },
      { status: 500 }
    );
  }
}
