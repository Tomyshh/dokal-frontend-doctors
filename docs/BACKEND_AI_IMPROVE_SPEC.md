# Spécification backend : Amélioration About et Education par IA

Le frontend appelle deux endpoints pour générer du contenu (About et Education) via OpenAI. Le backend doit les implémenter.

---

## 1. Améliorer la section "About"

### Endpoint
```
POST /api/v1/crm/profile/about/improve
```

### Authentification
- Bearer JWT (même que les autres routes CRM)
- Réservé aux praticiens connectés

### Body (JSON)
```json
{
  "current_text": "Texte actuel optionnel ou null"
}
```

- `current_text` : string | null — Texte existant saisi par le praticien. Si fourni, l’IA peut l’enrichir ou le reformuler. Si null/vide, l’IA génère un texte from scratch.

### Réponse (200)
```json
{
  "generated": "Dr. Dupont est médecin généraliste avec 15 ans d'expérience..."
}
```

### Logique côté backend
- Utiliser `OPENAI_API_KEY` pour appeler l’API OpenAI (GPT-4 ou GPT-3.5).
- Récupérer le profil du praticien (GET practitioners/me ou équivalent) pour le contexte : prénom, nom, spécialité, etc.
- Prompt suggéré :
  - Si `current_text` fourni : « Améliore et enrichis ce texte de présentation pour un profil de praticien médical : [current_text]. Contexte : Dr [prénom] [nom], [spécialité]. »
  - Si vide : « Génère une courte présentation professionnelle (2–4 phrases) pour un praticien médical : Dr [prénom] [nom], [spécialité]. Ton professionnel, rassurant. »

### Erreurs
- 401 : non authentifié
- 403 : non autorisé (ex. patient)
- 500 : erreur OpenAI ou interne

---

## 2. Améliorer la section "Education"

### Endpoint
```
POST /api/v1/crm/profile/education/improve
```

### Authentification
- Bearer JWT (même que les autres routes CRM)
- Réservé aux praticiens connectés

### Body (JSON)
```json
{
  "current_text": "Texte actuel optionnel ou null"
}
```

- `current_text` : string | null — Texte existant. Si fourni, l’IA peut le compléter ou le reformuler. Si null/vide, génération from scratch.

### Réponse (200)
```json
{
  "generated": "MD, Université de Paris, 2010. Spécialisation en médecine interne, 2015. Formation continue en échocardiographie."
}
```

### Logique côté backend
- Utiliser `OPENAI_API_KEY`.
- Récupérer le profil du praticien pour le contexte (prénom, nom, spécialité, pays/région si disponible).
- Prompt suggéré :
  - Si `current_text` fourni : « Améliore et structure ce texte de formation/éducation pour un profil de praticien médical : [current_text]. »
  - Si vide : « Génère une liste concise de formation/éducation typique pour un praticien médical [spécialité]. Format : diplômes, années, spécialisations. 2–4 lignes. »

### Erreurs
- 401 : non authentifié
- 403 : non autorisé
- 500 : erreur OpenAI ou interne

---

## Résumé pour le backend

| Route | Méthode | Body | Réponse |
|-------|---------|------|---------|
| `/api/v1/crm/profile/about/improve` | POST | `{ current_text?: string \| null }` | `{ generated: string }` |
| `/api/v1/crm/profile/education/improve` | POST | `{ current_text?: string \| null }` | `{ generated: string }` |

- Variable d’environnement : `OPENAI_API_KEY`
- Authentification : Bearer JWT (session praticien CRM)
