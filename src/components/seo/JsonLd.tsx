import type { ReactElement } from 'react';

export function JsonLd({ data }: { data: unknown }): ReactElement {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON, not escaped text.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

