# Numéro de rue (`street_number`) — alignement backend / BDD

Le frontend envoie la voie sans numéro dans `address_line` et le numéro dans `street_number` (inscription, PATCH profil praticien, invitation membre).

## Migration SQL

Le fichier canonique est **`dokal-backend/migrations/008_add_practitioner_street_number.sql`** — à exécuter sur la base Supabase / PostgreSQL (ou via votre pipeline de migrations).

Optionnel — rétro-remplissage si d’anciennes lignes ont encore « numéro + voie » dans `address_line` seul :

```sql
UPDATE public.practitioners
SET
  street_number = (regexp_match(trim(address_line), '^(\d+[a-zA-Z]?)'))[1],
  address_line = trim(regexp_replace(trim(address_line), '^\d+[a-zA-Z]?\s+', ''))
WHERE address_line IS NOT NULL
  AND (street_number IS NULL OR street_number = '')
  AND address_line ~ '^\d+[a-zA-Z]?\s+\S';
```

## API

- `POST /practitioners/register` : champ **`street_number`** requis (voir `openapi.yaml`).
- `PATCH` profil praticien : `street_number` optionnel, nullable.
- `GET /practitioners/me` (et détail praticien) : renvoyer `street_number`.

Les clients plus anciens peuvent encore n’envoyer que `address_line` : le backend peut accepter temporairement les deux formes ou rejeter avec une erreur de validation explicite jusqu’à migration complète.
