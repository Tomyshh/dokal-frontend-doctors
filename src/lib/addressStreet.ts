/**
 * Extrait un numéro de rue (éventuellement suffixe lettre) depuis une ligne d'adresse saisie,
 * pour le déplacer vers un champ dédié (voie seule dans le champ « adresse »).
 *
 * Préfère un numéro en tête (ex. "136 Sderot Chicago"), sinon en fin (ex. "Sderot Chicago 12").
 */
/** Numéro en tête seulement si un nom de voie suit (évite d'avaliser « 136 » pendant la frappe). */
const LEADING_NUMBER = /^(\d+[a-zA-Z\u0590-\u05FF]?)\s+(.+)$/;

const TRAILING_NUMBER = /^(.+?)[\s,.;/\-–—]+(\d+[a-zA-Z\u0590-\u05FF]?)$/;

export function extractStreetNumberFromLine(raw: string): {
  streetLine: string;
  streetNumber: string;
} {
  const lead = raw.match(LEADING_NUMBER);
  if (lead) {
    const rest = lead[2].trim();
    if (rest.length > 0) {
      return { streetNumber: lead[1].trim(), streetLine: rest };
    }
  }

  const s = raw.trim();
  if (!s) return { streetLine: '', streetNumber: '' };

  const trail = s.match(TRAILING_NUMBER);
  if (trail) {
    const rest = trail[1].trim();
    const num = trail[2].trim();
    if (rest.length > 0) {
      return { streetNumber: num, streetLine: rest };
    }
  }

  return { streetLine: s, streetNumber: '' };
}

/** Données existantes : adresse complète dans un seul champ (sans street_number séparé). */
export function hasStreetNumberInCombinedLine(address: string | null | undefined): boolean {
  const s = (address || '').trim();
  if (!s) return false;
  const { streetNumber } = extractStreetNumberFromLine(s);
  return streetNumber.length > 0;
}
