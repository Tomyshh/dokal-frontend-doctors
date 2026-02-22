## Guide Frontend — Calendrier & RDV (CRM Dokal)

Ce document décrit **les états** (patient draft/linked, RDV incomplet, source RDV, overlay Google) et **les endpoints** à utiliser pour que le calendrier CRM et les pages RDV/patients affichent la bonne UX.

---

## 1) Modèle de données (à connaître)

### 1.1 `patients` (nouvelle table)
Un **dossier patient** indépendant de Supabase Auth.

- **`patients.id`**: identifiant CRM (UUID)
- **`patients.status`**:
  - `draft`: créé depuis CRM/Google, **sans compte mobile**
  - `linked`: lié à un compte mobile
- **`patients.auth_user_id`**: UUID du compte mobile (nullable)
- **Teoudat Zehout**:
  - **hash** (`patients.teudat_zehut_hash`) utilisé pour le matching
  - **encrypté** (`patients.teudat_zehut_encrypted`) (jamais affiché tel quel)

### 1.2 `profiles` (table Auth)
Profil d’un utilisateur **authentifié** (patient mobile, praticien, secrétaire…).

- Un patient mobile a toujours un `profiles.id` (FK vers `auth.users.id`).
- Le CRM/Google **ne crée jamais** `auth.users` / `profiles` pour un patient.

### 1.3 `appointments` (RDV Dokal)
Un vrai RDV Dokal (utilisé pour l’agenda et les workflows RDV).

Champs importants :
- **`appointments.patient_record_id`**: FK vers `patients.id` (**toujours présent**)
- **`appointments.patient_id`**: FK vers `profiles.id` (nullable, **uniquement** si patient mobile lié)
- **`appointments.status`**: `pending|confirmed|cancelled_by_*|completed|no_show`
- **`appointments.source`** (source de création):
  - `dokal_crm` (créé dans le CRM)
  - `dokal_app` (créé via l’app mobile)
  - `google_calendar_sync` (import Google Calendar)
  - `legacy_unknown`
- **RDV “infos manquantes”**:
  - `appointments.patient_info_missing` (boolean)
  - `appointments.patient_missing_fields` (string[]) ex: `["teudat_zehut"]`

### 1.4 `crm_external_events` (overlay Google)
Événements importés Google Calendar affichés comme **overlay** dans le calendrier CRM (souvent `busy`, parfois fallback).

Champs importants :
- `type_detected`: `busy|appointment`
- `source`: `google_calendar_sync`

Règle :
- Si un event Google peut être converti en vrai RDV Dokal → on crée `appointments`.
- Sinon → on garde `crm_external_events`.

---

## 2) États UX à afficher dans le calendrier CRM

Pour chaque élément affiché :

### 2.1 Vrai RDV Dokal (provient de `appointments`)
Affichage recommandé :
- **Badge statut RDV** (selon `appointments.status`)
- **Badge source** (selon `appointments.source`)
  - `dokal_crm` → “Dokal CRM”
  - `dokal_app` → “Dokal App”
  - `google_calendar_sync` → “Google Calendar Sync”
- **Badge “Infos manquantes”** si `patient_info_missing=true`
  - afficher la liste friendly depuis `patient_missing_fields`
  - CTA: “Compléter patient” (ouvre fiche patient)

### 2.2 RDV avec patient “draft”
Définition :
- `appointments.patient_id == null`
- donc pas de compte mobile, pas de conversation, pas de notifications patient

**Exception** : RDV créés via `source=dokal_app` → ne jamais afficher "Patient non inscrit (draft)" car le patient a forcément un compte (authentifié dans l'app). Si `patient_id` est null, c'est une incohérence backend à corriger.

Affichage recommandé (hors dokal_app) :
- indiquer “Patient non inscrit (draft)”
- CTA principal: “Compléter dossier patient” (Teoudat, contact, etc.)

### 2.3 Overlay Google (provient de `crm_external_events`)
Affichage recommandé :
- style “externe”/grisé
- badge “Google”
- si `type_detected=busy` : bloc “Occupé”
- si `type_detected=appointment` : bloc “RDV détecté (non importé)” + CTA “Convertir en RDV” (optionnel si on ajoute un endpoint dédié plus tard)

---

## 3) Conversion “draft → RDV complet”

### 3.1 Compléter un patient (CRM)
Le frontend doit pouvoir :
- éditer prénom/nom/teoudat/email/tel/city…
- ce qui met à jour :
  - `patients.*`
  - et **recalcule** `appointments.patient_info_missing` + `patient_missing_fields` sur les RDV à venir

### 3.2 Liaison automatique lors de l’inscription mobile
Quand le patient s’inscrit via l’app mobile et renseigne sa Teoudat :
- un compte Auth est créé (`auth.users` + `profiles`)
- le backend recherche un `patients` draft matching Teoudat
- il attache `patients.auth_user_id`
- il remplit `appointments.patient_id`

Le frontend CRM verra alors automatiquement :
- RDV “draft” → RDV “lié”
- conversation/notifications patient deviennent possibles.

---

## 4) Endpoints à utiliser (frontend)

### 4.1 RDV (CRM)
- **Lister RDV** (praticien ou secrétaire/org) :
  - `GET /api/v1/crm/appointments?date=YYYY-MM-DD&limit=..&offset=..`
  - `GET /api/v1/crm/organization/appointments?...`
- **Créer RDV confirmé (CRM)** :
  - `POST /api/v1/crm/appointments`
  - payload:
    - soit `patient_record_id`
    - soit `patient: { first_name,last_name,teudat_zehut?,... }` (création inline du dossier patient)
- **Actions** :
  - confirmer: `PATCH /api/v1/crm/appointments/:id/confirm`
  - annuler: `PATCH /api/v1/crm/appointments/:id/cancel`
  - terminer: `PATCH /api/v1/crm/appointments/:id/complete`
  - no-show: `PATCH /api/v1/crm/appointments/:id/no-show`
- **Éditer infos RDV (titre/description/lieu/notes)** :
  - praticien: `PATCH /api/v1/crm/appointments/:id`
  - secrétaire/org: `PATCH /api/v1/crm/organization/appointments/:id`

### 4.2 Patients (CRM)
- **Lister tous les patients visibles** (paginé, filtres) :
  - `GET /api/v1/crm/patients?limit=..&offset=..&q=..&status=draft|linked&incomplete=true|false`
- **Recherche (visible uniquement)** :
  - `GET /api/v1/crm/patients/search?q=...`
- **Créer dossier patient (draft)** :
  - `POST /api/v1/crm/patients`
- **Modifier un dossier patient** (compléter identité) :
  - `PATCH /api/v1/crm/patients/:id`
- **Fiche patient (vue)** :
  - `GET /api/v1/crm/patients/:id`

### 4.3 Overlay Google
- **Lister événements externes (overlay)** :
  - `GET /api/v1/integrations/google-calendar/external-events?from=YYYY-MM-DD&to=YYYY-MM-DD&practitioner_id=...`

---

## 5) Bonnes pratiques UI
- Toujours afficher la **source** RDV (badge).
- Toujours distinguer :
  - “RDV Dokal” (`appointments`)
  - “Overlay Google” (`crm_external_events`)
- Pour un patient draft :
  - afficher “non inscrit”
  - CTA “compléter” (Teoudat en priorité)
- Pour un RDV incomplet :
  - afficher clairement la liste de champs manquants
  - proposer une action rapide (ouvrir fiche patient sur l’onglet identité)

