# Dokal Backend - Documentation API pour le Frontend

> Ce document decrit l'integralite de l'API REST backend de Dokal.
> Le frontend (Flutter mobile + CRM web) doit s'y referer pour toute integration.
>
> **Repo GitHub** : https://github.com/Tomyshh/dokal-backend
> **Base URL** : `http://localhost:3000` (dev) / a definir en production
> **Prefixe API** : `/api/v1`

---

## Table des matieres

1. [Architecture generale](#1-architecture-generale)
2. [Authentification](#2-authentification)
3. [Format des reponses et erreurs](#3-format-des-reponses-et-erreurs)
4. [Profil utilisateur](#4-profil-utilisateur)
5. [Proches (Relatives)](#5-proches-relatives)
6. [Praticiens](#6-praticiens)
7. [Rendez-vous (Appointments)](#7-rendez-vous-appointments)
8. [Messagerie](#8-messagerie)
9. [Profil sante](#9-profil-sante)
10. [Notifications](#10-notifications)
11. [Parametres utilisateur](#11-parametres-utilisateur)
12. [Paiements (PayMe)](#12-paiements-payme)
13. [Avis (Reviews)](#13-avis-reviews)
14. [CRM Praticien](#14-crm-praticien)
15. [WebSocket (temps reel)](#15-websocket-temps-reel)
16. [Enums et types de reference](#16-enums-et-types-de-reference)

---

## 1. Architecture generale

```
Flutter App (Patient)  ─┐
                        ├──> Backend Express (Node.js) ──> Supabase PostgreSQL
CRM Web (Praticien)   ─┘         + Socket.io               + Supabase Storage
                                 + PayMe Israel             + Supabase Auth
```

### Repartition des responsabilites

| Composant | Qui gere |
|-----------|----------|
| **Authentification** (inscription, connexion, reset password) | **Frontend** via Supabase Auth SDK directement |
| **Toute la logique metier** (RDV, messagerie, recherche, CRM...) | **Backend Express** (ce serveur) |
| **Base de donnees** | Supabase PostgreSQL (le backend y accede via `@supabase/supabase-js` avec la `service_role_key`) |
| **Stockage fichiers** (avatars, pieces jointes) | Supabase Storage (via le backend) |
| **Paiements** | PayMe Israel (via le backend) |
| **Temps reel** (messages, notifications, presence) | Socket.io sur le backend |

### Stack technique

- Node.js 20+ / TypeScript
- Express.js
- `@supabase/supabase-js` (service_role pour les operations server-side)
- Socket.io (WebSocket)
- Zod (validation des inputs)
- Winston (logs)
- node-cron (rappels RDV quotidiens)

---

## 2. Authentification

### Cote frontend

L'authentification est geree **directement par le frontend** via Supabase Auth :

```dart
// Flutter
await Supabase.initialize(
  url: 'NEXT_PUBLIC_SUPABASE_URL',
  anonKey: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
);

// Inscription
await supabase.auth.signUp(email: email, password: password, data: {
  'first_name': firstName,
  'last_name': lastName,
});

// Connexion
await supabase.auth.signInWithPassword(email: email, password: password);

// Token pour les appels API
final token = supabase.auth.currentSession?.accessToken;
```

### Cote backend (comment appeler l'API)

Pour chaque requete authentifiee, le frontend doit envoyer le **JWT Supabase** dans le header :

```
Authorization: Bearer <supabase_access_token>
```

Le backend verifie ce token aupres de Supabase, recupere l'`id` et le `role` de l'utilisateur, puis autorise ou refuse l'acces.

### Roles

| Role | Description |
|------|-------------|
| `patient` | Utilisateur standard (app mobile) |
| `practitioner` | Medecin/praticien (app mobile + CRM web) |
| `admin` | Administrateur (acces complet) |

---

## 3. Format des reponses et erreurs

### Succes

Les reponses renvoient directement les donnees JSON :

```json
{ "id": "uuid", "first_name": "David", ... }
```

Ou un tableau :

```json
[{ "id": "uuid", ... }, { "id": "uuid", ... }]
```

### Erreurs

Toutes les erreurs suivent ce format :

```json
{
  "error": {
    "code": "bad_request",
    "message": "Description de l'erreur",
    "details": {}
  }
}
```

| Code HTTP | `error.code` | Description |
|-----------|-------------|-------------|
| 400 | `bad_request` | Donnees invalides |
| 400 | `validation_error` | Echec de validation Zod (champs invalides) |
| 401 | `unauthorized` | Token manquant ou invalide |
| 403 | `forbidden` | Acces refuse (mauvais role) |
| 404 | `not_found` | Ressource introuvable |
| 429 | (rate limit) | Trop de requetes (100/min) |
| 500 | `internal_error` | Erreur serveur |

### Erreur de validation (exemple)

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation error",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email"]
      }
    }
  }
}
```

---

## 4. Profil utilisateur

> **Base** : `/api/v1/profile`
> **Auth requise** : Oui

### `GET /api/v1/profile` — Mon profil

**Reponse :**
```json
{
  "id": "uuid",
  "first_name": "David",
  "last_name": "Cohen",
  "email": "david@example.com",
  "phone": "+972-50-1234567",
  "date_of_birth": "1990-05-15",
  "sex": "male",
  "city": "Tel Aviv",
  "avatar_url": "https://...supabase.co/storage/...",
  "role": "patient",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### `PATCH /api/v1/profile` — Mettre a jour

**Body :**
```json
{
  "first_name": "David",
  "last_name": "Cohen",
  "phone": "+972-50-1234567",
  "city": "Tel Aviv",
  "date_of_birth": "1990-05-15",
  "sex": "male"
}
```

> Tous les champs sont optionnels. `sex` : `"male"` | `"female"` | `"other"`.

**Reponse :** Le profil mis a jour (meme format que GET).

### `POST /api/v1/profile/avatar` — Upload avatar

**Body :** `multipart/form-data` avec un champ `avatar` (fichier image, max 5 MB)

**Reponse :** Le profil mis a jour avec le nouveau `avatar_url`.

---

## 5. Proches (Relatives)

> **Base** : `/api/v1/relatives`
> **Auth requise** : Oui

### `GET /api/v1/relatives` — Lister mes proches

**Reponse :**
```json
[
  {
    "id": "uuid",
    "first_name": "Sarah",
    "last_name": "Cohen",
    "relation": "child",
    "date_of_birth": "2018-03-20"
  }
]
```

### `POST /api/v1/relatives` — Ajouter un proche

**Body :**
```json
{
  "first_name": "Sarah",
  "last_name": "Cohen",
  "relation": "child",
  "date_of_birth": "2018-03-20"
}
```

> `relation` : `"child"` | `"parent"` | `"spouse"` | `"sibling"` | `"other"`

**Reponse :** `201` + le proche cree.

### `DELETE /api/v1/relatives/:id` — Supprimer

**Reponse :** `204` (pas de body).

---

## 6. Praticiens

> **Base** : `/api/v1/practitioners`
> **Auth requise** : Non (routes publiques)

### `GET /api/v1/practitioners/search` — Recherche

**Query params :**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Recherche textuelle (ville, description) |
| `specialty` | uuid | Filtrer par ID de specialite |
| `city` | string | Filtrer par ville |
| `lat` | number | Latitude (pour calcul distance cote client) |
| `lng` | number | Longitude |
| `limit` | number | Max resultats (defaut: 50, max: 100) |

**Exemple :** `GET /api/v1/practitioners/search?q=Tel+Aviv&limit=20`

**Reponse :**
```json
[
  {
    "id": "uuid",
    "address_line": "123 Dizengoff",
    "city": "Tel Aviv",
    "sector": "Clalit",
    "latitude": 32.07,
    "longitude": 34.77,
    "about": "Specialiste en...",
    "languages": ["Francais", "Hebreu"],
    "education": "...",
    "years_of_experience": 15,
    "is_accepting_new_patients": true,
    "profiles": {
      "first_name": "Yossi",
      "last_name": "Levi",
      "avatar_url": "https://..."
    },
    "specialties": {
      "name": "Cardiology",
      "name_fr": "Cardiologie",
      "name_he": "קרדיולוגיה"
    }
  }
]
```

### `GET /api/v1/practitioners/:id` — Profil complet

Retourne le praticien + ses instructions + motifs + creneaux 14 jours + derniers avis.

**Reponse :**
```json
{
  "id": "uuid",
  "address_line": "...",
  "city": "...",
  "phone": "+972-...",
  "email": "dr@clinic.com",
  "consultation_duration_minutes": 30,
  "profiles": { "first_name": "...", "last_name": "...", "avatar_url": "..." },
  "specialties": { "name": "...", "name_fr": "...", "name_he": "..." },
  "instructions": [
    { "id": "uuid", "title": "Documents a apporter", "content": "...", "sort_order": 0 }
  ],
  "reasons": [
    { "id": "uuid", "label": "Follow-up", "label_fr": "Suivi / controle", "label_he": "..." }
  ],
  "slots": [
    { "slot_date": "2026-02-10", "slot_start": "09:00:00", "slot_end": "09:30:00" },
    { "slot_date": "2026-02-10", "slot_start": "09:30:00", "slot_end": "10:00:00" }
  ],
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excellent praticien",
      "practitioner_reply": "Merci !",
      "created_at": "2026-01-15T10:00:00Z",
      "profiles": { "first_name": "David", "last_name": "C." }
    }
  ]
}
```

### `GET /api/v1/practitioners/:id/slots?from=YYYY-MM-DD&to=YYYY-MM-DD`

Retourne les creneaux disponibles dans la plage de dates.

**Reponse :**
```json
[
  { "slot_date": "2026-02-10", "slot_start": "09:00:00", "slot_end": "09:30:00" },
  { "slot_date": "2026-02-10", "slot_start": "09:30:00", "slot_end": "10:00:00" }
]
```

**Logique :**
1. Charge le planning hebdomadaire (`practitioner_weekly_schedule`)
2. Applique les exceptions (`practitioner_schedule_overrides`) : jours fermes, horaires speciaux
3. Genere les slots selon `slot_duration_minutes`
4. Exclut les creneaux deja reserves (statut `pending` ou `confirmed`)

### `GET /api/v1/practitioners/:id/reviews?limit=20&offset=0`

Avis pagines d'un praticien.

**Reponse :**
```json
{
  "reviews": [{ "id": "uuid", "rating": 5, "comment": "...", ... }],
  "total": 42
}
```

---

## 7. Rendez-vous (Appointments)

> **Base** : `/api/v1/appointments`
> **Auth requise** : Oui

### `POST /api/v1/appointments` — Creer un RDV (booking)

**Body :**
```json
{
  "practitioner_id": "uuid",
  "relative_id": "uuid ou null",
  "reason_id": "uuid ou null",
  "appointment_date": "2026-02-10",
  "start_time": "11:00:00",
  "end_time": "11:30:00",
  "patient_address_line": "123 Rue Jaffa",
  "patient_zip_code": "62000",
  "patient_city": "Tel Aviv",
  "visited_before": false
}
```

**Reponse :** `201`
```json
{ "id": "uuid-du-rdv-cree" }
```

**Effets automatiques (cote serveur) :**
- Verifie que le creneau n'est pas deja pris
- Le statut initial est `pending`
- Cree une notification `appointment_request` pour le praticien
- Cree automatiquement une conversation patient/praticien (si elle n'existe pas)

### `GET /api/v1/appointments/upcoming` — RDV a venir

Retourne les RDV futurs du patient (statut `pending` ou `confirmed`), tries par date.

**Reponse :**
```json
[
  {
    "id": "uuid",
    "appointment_date": "2026-02-10",
    "start_time": "11:00:00",
    "end_time": "11:30:00",
    "status": "confirmed",
    "visited_before": false,
    "patient_address_line": "...",
    "practitioners": {
      "id": "uuid",
      "profiles": { "first_name": "Yossi", "last_name": "Levi", "avatar_url": "..." },
      "specialties": { "name": "Cardiology", "name_fr": "Cardiologie" }
    },
    "appointment_reasons": { "label": "Follow-up", "label_fr": "Suivi" },
    "relatives": null
  }
]
```

### `GET /api/v1/appointments/past` — RDV passes

Meme format. Tries par date decroissante. Max 50 resultats.

### `GET /api/v1/appointments/:id` — Detail d'un RDV

Meme format que la liste + champ `appointment_questionnaires` si existant.

### `PATCH /api/v1/appointments/:id/cancel` — Annuler (patient)

**Body :**
```json
{ "cancellation_reason": "Raison optionnelle" }
```

**Reponse :** `204`

**Effets automatiques :**
- Le statut passe a `cancelled_by_patient`
- Notification envoyee au praticien et au patient

---

## 8. Messagerie

> **Base** : `/api/v1/conversations`
> **Auth requise** : Oui

### `GET /api/v1/conversations` — Lister les conversations

Retourne les conversations de l'utilisateur connecte (patient ou praticien).

**Reponse :**
```json
[
  {
    "id": "uuid",
    "last_message_at": "2026-02-08T14:30:00Z",
    "practitioners": {
      "id": "uuid",
      "profiles": { "first_name": "Yossi", "last_name": "Levi", "avatar_url": "..." }
    },
    "last_message": { "content": "Bonjour, ...", "created_at": "...", "message_type": "text" },
    "unread_count": 2
  }
]
```

### `GET /api/v1/conversations/:id/messages?limit=50&before=ISO_TIMESTAMP`

Messages d'une conversation (ordre chronologique). Pagination par curseur `before`.

**Reponse :**
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "content": "Bonjour docteur",
    "message_type": "text",
    "is_read": true,
    "created_at": "2026-02-08T14:00:00Z"
  }
]
```

### `POST /api/v1/conversations/:id/messages` — Envoyer un message

**Body :**
```json
{
  "content": "Bonjour, j'ai une question...",
  "message_type": "text"
}
```

> `message_type` : `"text"` | `"image"` | `"file"` (defaut: `"text"`)

**Reponse :** `201` + le message cree.

**Effets automatiques :**
- Met a jour `conversations.last_message_at`
- Cree une notification `new_message` pour le destinataire

### `PATCH /api/v1/conversations/:id/read` — Marquer les messages comme lus

**Reponse :** `204`

---

## 9. Profil sante

> **Base** : `/api/v1/health`
> **Auth requise** : Oui

### `GET /api/v1/health/profile` — Recuperer le profil sante

**Reponse :**
```json
{
  "user_id": "uuid",
  "teudat_zehut": "123456789",
  "date_of_birth": "1990-05-15",
  "sex": "male",
  "blood_type": "O+",
  "kupat_holim": "Clalit",
  "kupat_member_id": "12345",
  "family_doctor_name": "Dr. Cohen",
  "emergency_contact_name": "Rachel Cohen",
  "emergency_contact_phone": "+972-50-1111111"
}
```

> Le `teudat_zehut` est stocke chiffre (AES-256-GCM) en base et dechiffre par le backend avant renvoi.

### `PUT /api/v1/health/profile` — Creer/mettre a jour

**Body :**
```json
{
  "teudat_zehut": "123456789",
  "date_of_birth": "1990-05-15",
  "sex": "male",
  "blood_type": "O+",
  "kupat_holim": "Clalit",
  "kupat_member_id": "12345",
  "family_doctor_name": "Dr. Cohen",
  "emergency_contact_name": "Rachel",
  "emergency_contact_phone": "+972-50-1111111"
}
```

### Listes sante

Les 4 tables (conditions, medications, allergies, vaccinations) utilisent le meme pattern :

#### `GET /api/v1/health/:table`

> `:table` = `conditions` | `medications` | `allergies` | `vaccinations`

**Reponse :**
```json
[
  { "id": "uuid", "name": "Diabete de type 2", "severity": "moderate", ... }
]
```

#### `POST /api/v1/health/:table` — Ajouter

**Body :**
```json
{
  "name": "Diabete de type 2",
  "severity": "moderate",
  "diagnosed_on": "2020-01-15",
  "notes": "Sous traitement"
}
```

> Champs disponibles selon le type : `name` (obligatoire), `reaction`, `severity`, `dosage`, `frequency`, `diagnosed_on`, `started_on`, `ended_on`, `dose`, `vaccinated_on`, `notes`.

**Reponse :** `201` + `{ "id": "uuid", "name": "..." }`

#### `DELETE /api/v1/health/:table/:id` — Supprimer

**Reponse :** `204`

---

## 10. Notifications

> **Base** : `/api/v1/notifications`
> **Auth requise** : Oui

### `GET /api/v1/notifications` — Lister (max 50)

**Reponse :**
```json
[
  {
    "id": "uuid",
    "type": "appointment_confirmed",
    "title": "RDV confirme",
    "body": "Votre rendez-vous a ete confirme par le praticien.",
    "data": { "appointment_id": "uuid" },
    "is_read": false,
    "created_at": "2026-02-08T10:00:00Z"
  }
]
```

### `GET /api/v1/notifications/unread-count`

```json
{ "count": 3 }
```

### `PATCH /api/v1/notifications/:id/read` — Marquer comme lue

**Reponse :** `204`

### `PATCH /api/v1/notifications/read-all` — Tout marquer comme lu

**Reponse :** `204`

### Push tokens

#### `POST /api/v1/notifications/push-tokens` — Enregistrer un token FCM

**Body :**
```json
{ "token": "fcm_token_ici", "platform": "android" }
```

> `platform` : `"ios"` | `"android"` | `"web"`

**Reponse :** `204`

#### `DELETE /api/v1/notifications/push-tokens` — Supprimer un token

**Body :**
```json
{ "token": "fcm_token_ici" }
```

**Reponse :** `204`

---

## 11. Parametres utilisateur

> **Base** : `/api/v1/settings`
> **Auth requise** : Oui

### `GET /api/v1/settings`

```json
{
  "notifications_enabled": true,
  "reminders_enabled": true,
  "locale": "fr"
}
```

### `PATCH /api/v1/settings`

**Body :**
```json
{
  "notifications_enabled": false,
  "reminders_enabled": true,
  "locale": "he"
}
```

> Tous les champs sont optionnels.

---

## 12. Paiements (PayMe Israel)

> **Base** : `/api/v1/payments`
> **Auth requise** : Oui (sauf webhook)

### `GET /api/v1/payments/methods` — Mes moyens de paiement

```json
[
  {
    "id": "uuid",
    "brand": "Visa",
    "last4": "4242",
    "expiry_month": 12,
    "expiry_year": 2027,
    "is_default": true
  }
]
```

### `POST /api/v1/payments/methods` — Ajouter

**Body :**
```json
{
  "brand": "Visa",
  "last4": "4242",
  "expiry_month": 12,
  "expiry_year": 2027
}
```

### `DELETE /api/v1/payments/methods/:id` — Supprimer

**Reponse :** `204`

### `PATCH /api/v1/payments/methods/:id/default` — Definir par defaut

**Reponse :** `204`

### `POST /api/v1/payments/create-link` — Generer un lien de paiement PayMe

**Body :**
```json
{
  "amount": 15000,
  "description": "Consultation cardiologie"
}
```

> `amount` en agorot (15000 = 150 ILS)

**Reponse :** Objet PayMe avec `payment_url` pour rediriger l'utilisateur.

### `POST /api/v1/payments/webhook` — Callback PayMe (pas d'auth)

Appele par PayMe pour notifier le statut du paiement. Route publique.

---

## 13. Avis (Reviews)

> **Base** : `/api/v1/reviews`
> **Auth requise** : Oui

### `POST /api/v1/reviews` — Laisser un avis (patient)

**Body :**
```json
{
  "appointment_id": "uuid",
  "practitioner_id": "uuid",
  "rating": 5,
  "comment": "Excellent praticien, je recommande"
}
```

> Le RDV doit etre `completed` ou `no_show`. Un seul avis par RDV.

**Reponse :** `201`
```json
{ "id": "uuid", "rating": 5, "comment": "...", "created_at": "..." }
```

### `PATCH /api/v1/reviews/:id/reply` — Repondre (praticien)

**Body :**
```json
{ "practitioner_reply": "Merci pour votre retour !" }
```

**Reponse :** `204`

---

## 14. CRM Praticien

> **Base** : `/api/v1/crm`
> **Auth requise** : Oui (role `practitioner` ou `admin` obligatoire)

### 14.1 Dashboard

#### `GET /api/v1/crm/dashboard/stats?from=2026-02-01&to=2026-02-28`

```json
{
  "pending": 3,
  "confirmed": 12,
  "cancelled": 2,
  "completed": 45,
  "no_show": 1
}
```

### 14.2 Rendez-vous

#### `GET /api/v1/crm/appointments?date=2026-02-08&status=pending&limit=50&offset=0`

```json
{
  "appointments": [
    {
      "id": "uuid",
      "appointment_date": "2026-02-08",
      "start_time": "09:00:00",
      "end_time": "09:30:00",
      "status": "pending",
      "profiles": { "id": "uuid", "first_name": "David", "last_name": "Cohen", "phone": "...", "avatar_url": "..." },
      "appointment_reasons": { "label_fr": "Suivi" },
      "relatives": null
    }
  ],
  "total": 5
}
```

> Tous les query params sont optionnels.

#### `PATCH /api/v1/crm/appointments/:id/confirm`

**Reponse :** `204`. Notification `appointment_confirmed` envoyee au patient. Log dans `audit_log`.

#### `PATCH /api/v1/crm/appointments/:id/cancel`

**Body :** `{ "cancellation_reason": "..." }` (optionnel)

**Reponse :** `204`. Notification `appointment_cancelled` envoyee au patient.

#### `PATCH /api/v1/crm/appointments/:id/complete`

**Body :** `{ "practitioner_notes": "..." }` (optionnel)

**Reponse :** `204`.

#### `PATCH /api/v1/crm/appointments/:id/no-show`

**Reponse :** `204`.

### 14.3 Planning hebdomadaire

#### `GET /api/v1/crm/schedule`

```json
[
  {
    "id": "uuid",
    "day_of_week": 0,
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "slot_duration_minutes": 30,
    "is_active": true
  }
]
```

> `day_of_week` : 0 = dimanche, 1 = lundi, ..., 6 = samedi

#### `POST /api/v1/crm/schedule` — Ajouter un creneau

**Body :**
```json
{
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "12:00",
  "slot_duration_minutes": 30,
  "is_active": true
}
```

#### `PATCH /api/v1/crm/schedule/:id` — Modifier

**Body :** champs optionnels (`start_time`, `end_time`, `slot_duration_minutes`, `is_active`).

#### `DELETE /api/v1/crm/schedule/:id` — Supprimer

### 14.4 Exceptions (vacances, jours speciaux)

#### `GET /api/v1/crm/overrides`

```json
[
  {
    "id": "uuid",
    "date": "2026-03-15",
    "is_available": false,
    "start_time": null,
    "end_time": null,
    "reason": "Vacances"
  }
]
```

#### `POST /api/v1/crm/overrides` — Ajouter/modifier (upsert sur date)

**Body :**
```json
{
  "date": "2026-03-15",
  "is_available": false,
  "reason": "Vacances"
}
```

Ou pour horaires speciaux :
```json
{
  "date": "2026-03-20",
  "is_available": true,
  "start_time": "10:00",
  "end_time": "14:00",
  "reason": "Horaires reduits"
}
```

#### `DELETE /api/v1/crm/overrides/:id` — Supprimer

### 14.5 Motifs de consultation

#### `GET /api/v1/crm/reasons`

Retourne les motifs globaux + ceux du praticien.

#### `POST /api/v1/crm/reasons`

**Body :**
```json
{
  "label": "Initial consultation",
  "label_fr": "Consultation initiale",
  "label_he": "ביקור ראשון",
  "sort_order": 0,
  "is_active": true
}
```

#### `PATCH /api/v1/crm/reasons/:id`

### 14.6 Instructions pre-RDV

#### `GET /api/v1/crm/instructions`
#### `POST /api/v1/crm/instructions`

**Body :**
```json
{
  "title": "Documents a apporter",
  "content": "Carte d'assurance, ordonnances en cours.",
  "is_active": true,
  "sort_order": 0
}
```

#### `PATCH /api/v1/crm/instructions/:id`

### 14.7 Vue patient

#### `GET /api/v1/crm/patients/:id`

> Le praticien doit avoir eu au moins un RDV avec ce patient.

**Reponse :**
```json
{
  "profile": { "first_name": "David", "last_name": "Cohen", "phone": "...", "date_of_birth": "...", "sex": "male", "city": "..." },
  "health_profile": { "blood_type": "O+", "kupat_holim": "Clalit", ... },
  "conditions": [{ "name": "Diabete", "severity": "moderate" }],
  "allergies": [{ "name": "Penicilline", "reaction": "Urticaire", "severity": "severe" }],
  "medications": [{ "name": "Metformine", "dosage": "500mg", "frequency": "2x/jour" }],
  "appointment_history": [
    { "id": "uuid", "appointment_date": "2026-01-15", "status": "completed", "practitioner_notes": "RAS" }
  ]
}
```

### 14.8 Avis recus

#### `GET /api/v1/crm/reviews`
#### `PATCH /api/v1/crm/reviews/:id/reply`

**Body :** `{ "practitioner_reply": "Merci !" }`

### 14.9 Profil praticien

#### `PATCH /api/v1/crm/profile`

**Body :**
```json
{
  "about": "Specialiste en cardiologie...",
  "languages": ["Francais", "Hebreu", "Anglais"],
  "education": "Universite de Tel Aviv",
  "phone": "+972-...",
  "email": "dr@clinic.com",
  "is_accepting_new_patients": true,
  "address_line": "123 Dizengoff",
  "zip_code": "62000",
  "city": "Tel Aviv"
}
```

---

## 15. WebSocket (temps reel)

### Connexion

```dart
// Flutter (socket_io_client)
final socket = io('http://localhost:3000', {
  'auth': { 'token': supabaseAccessToken },
  'transports': ['websocket'],
});
```

```js
// JavaScript (CRM)
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', {
  auth: { token: supabaseAccessToken },
});
```

### Evenements recus (server -> client)

| Evenement | Payload | Description |
|-----------|---------|-------------|
| `message:new` | `{ id, sender_id, content, message_type, ... }` | Nouveau message recu |
| `appointment:updated` | `{ id, status, ... }` | Changement de statut d'un RDV |
| `notification:new` | `{ id, type, title, body, data, ... }` | Nouvelle notification |
| `presence:online` | `{ user_id }` | Un utilisateur se connecte |
| `presence:offline` | `{ user_id }` | Un utilisateur se deconnecte |

### Authentification WebSocket

La connexion WebSocket utilise le meme JWT Supabase que l'API REST, passe via `auth.token` au handshake.

---

## 16. Enums et types de reference

### `user_role`
`"patient"` | `"practitioner"` | `"admin"`

### `sex_type`
`"male"` | `"female"` | `"other"`

### `relation_type`
`"child"` | `"parent"` | `"spouse"` | `"sibling"` | `"other"`

### `appointment_status`
`"pending"` | `"confirmed"` | `"cancelled_by_patient"` | `"cancelled_by_practitioner"` | `"completed"` | `"no_show"`

### `message_type`
`"text"` | `"image"` | `"file"` | `"system"`

### `notification_type`
`"appointment_request"` | `"appointment_confirmed"` | `"appointment_cancelled"` | `"appointment_reminder"` | `"new_message"` | `"review_received"`

### `sector` (Kupat Holim)
`"Clalit"` | `"Maccabi"` | `"Meuhedet"` | `"Leumit"` | `null`

---

## Cron Jobs (automatiques)

| Job | Frequence | Description |
|-----|-----------|-------------|
| Rappels RDV | Tous les jours a 18h (Israel) | Envoie une notification `appointment_reminder` aux patients qui ont un RDV confirme le lendemain |

---

## Resume des modules et fichiers

| Module | Fichiers | Endpoints |
|--------|----------|-----------|
| Profile | `src/modules/profile/` | 3 |
| Relatives | `src/modules/relatives/` | 3 |
| Practitioners | `src/modules/practitioners/` | 4 |
| Appointments | `src/modules/appointments/` | 5 |
| Messaging | `src/modules/messaging/` | 4 |
| Health | `src/modules/health/` | 5 |
| Notifications | `src/modules/notifications/` | 6 |
| Settings | `src/modules/settings/` | 2 |
| Payments | `src/modules/payments/` | 6 |
| Reviews | `src/modules/reviews/` | 2 |
| CRM | `src/modules/crm/` | 25+ |
| **Total** | **60 fichiers TypeScript** | **65+ endpoints** |
