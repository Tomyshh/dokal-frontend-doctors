# Spécification Backend — Notifications Push OneSignal

> **Objectif** : Ce document décrit exactement ce que le backend doit implémenter pour envoyer des notifications push OneSignal aux patients (app mobile) lorsque des actions sont effectuées depuis le frontend praticien (CRM web).

---

## 1. Contexte

- **Frontend** : CRM web pour praticiens (dokal-frontend-doctors)
- **Destinataire** : App mobile patient (dokal-app)
- **Service** : OneSignal pour les push notifications
- **Source des triggers** : Appels API effectués par le frontend praticien

Les rappels automatiques (cron, node-cron) sont gérés séparément — ce spec couvre uniquement les **triggers déclenchés par les actions du frontend**.

---

## 2. Prérequis avant envoi

Avant d’envoyer une notification push à un utilisateur :

1. **`notifications_enabled`** : Vérifier dans `user_settings` que `notifications_enabled = true` pour le `user_id` cible.
2. **Locale** : Récupérer `locale` dans `user_settings` pour le destinataire. Valeurs possibles : `fr`, `en`, `he`, `ru`, `am`, `es`.
3. **Push tokens** : Récupérer les tokens dans `push_tokens` pour le `user_id` cible. OneSignal utilise ces tokens (ou un mapping externe_id → player_id OneSignal selon votre intégration).

---

## 3. Mapping des endpoints → notifications

Chaque fois que le backend traite avec succès l’un des endpoints ci-dessous, il doit :

1. Insérer une ligne dans `notifications` (pour l’historique in-app)
2. Envoyer une notification push OneSignal au patient (si `notifications_enabled` et tokens présents)

---

### 3.1 RDV confirmé

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `/api/v1/crm/appointments/{id}/confirm` | PATCH | Praticien confirme un RDV |
| `/api/v1/crm/organization/appointments/{id}/confirm` | PATCH | Admin/secretary confirme un RDV |

**Destinataire** : `patient_id` du rendez-vous (ou `relative_id` → `user_id` du parent si RDV pour un proche).

**Type** : `appointment_confirmed`

**Données payload (data)** :
```json
{
  "type": "appointment_confirmed",
  "appointment_id": "uuid",
  "conversation_id": "uuid ou null"
}
```

**Templates par langue** :

| Locale | Title | Body |
|--------|-------|------|
| fr | RDV confirmé | Un rendez-vous a été confirmé. |
| en | Appointment confirmed | An appointment has been confirmed. |
| he | פגישה אושרה | פגישה אושרה. |
| ru | Приём подтверждён | Приём был подтверждён. |
| am | Appointment confirmed | An appointment has been confirmed. |
| es | Cita confirmada | Se ha confirmado una cita. |

---

### 3.2 RDV annulé

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `/api/v1/crm/appointments/{id}/cancel` | PATCH | Praticien annule un RDV |
| `/api/v1/crm/organization/appointments/{id}/cancel` | PATCH | Admin/secretary annule un RDV |

**Destinataire** : `patient_id` (ou parent du `relative_id`).

**Type** : `appointment_cancelled`

**Données payload** :
```json
{
  "type": "appointment_cancelled",
  "appointment_id": "uuid",
  "conversation_id": "uuid ou null"
}
```

**Templates par langue** :

| Locale | Title | Body |
|--------|-------|------|
| fr | RDV annulé | Un rendez-vous a été annulé. |
| en | Appointment cancelled | An appointment has been cancelled. |
| he | פגישה בוטלה | פגישה בוטלה. |
| ru | Приём отменён | Приём был отменён. |
| am | Appointment cancelled | An appointment has been cancelled. |
| es | Cita cancelada | Se ha cancelado una cita. |

---

### 3.3 RDV créé par le praticien (patient lié)

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `POST /api/v1/crm/appointments` | POST | Praticien crée un RDV pour un patient **lié** (`auth_user_id` non null) |

**Condition** : Envoyer la notification uniquement si le `patient_record` a un `auth_user_id` (patient avec compte app).

**Destinataire** : `auth_user_id` du patient (ou parent si RDV pour un proche).

**Type** : `appointment_created` *(à ajouter au schéma si absent)*

**Données payload** :
```json
{
  "type": "appointment_created",
  "appointment_id": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "start_time": "HH:mm:ss",
  "conversation_id": "uuid ou null"
}
```

**Templates par langue** :

| Locale | Title | Body |
|--------|-------|------|
| fr | Nouveau rendez-vous | Un rendez-vous a été créé pour vous. |
| en | New appointment | An appointment has been created for you. |
| he | פגישה חדשה | נוצרה פגישה עבורך. |
| ru | Новый приём | Для вас создан приём. |
| am | New appointment | An appointment has been created for you. |
| es | Nueva cita | Se ha creado una cita para usted. |

---

### 3.4 RDV replanifié (praticien)

> **Note** : Actuellement, le PATCH CRM ne permet pas de modifier `appointment_date` / `start_time` / `end_time`. Si un endpoint de reschedule côté praticien est ajouté plus tard, utiliser ce type.

**Type** : `appointment_rescheduled` *(à ajouter au schéma si absent)*

**Données payload** :
```json
{
  "type": "appointment_rescheduled",
  "appointment_id": "uuid",
  "appointment_date": "YYYY-MM-DD",
  "start_time": "HH:mm:ss",
  "conversation_id": "uuid ou null"
}
```

**Templates par langue** :

| Locale | Title | Body |
|--------|-------|------|
| fr | RDV modifié | Votre rendez-vous a été modifié. |
| en | Appointment rescheduled | Your appointment has been rescheduled. |
| he | פגישה שונתה | הפגישה שלך שונתה. |
| ru | Приём перенесён | Ваш приём был перенесён. |
| am | Appointment rescheduled | Your appointment has been rescheduled. |
| es | Cita reprogramada | Su cita ha sido reprogramada. |

---

### 3.5 Consultation terminée

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `/api/v1/crm/appointments/{id}/complete` | PATCH | Praticien marque la consultation comme terminée |
| `/api/v1/crm/organization/appointments/{id}/complete` | PATCH | Admin/secretary marque comme terminée |

**Destinataire** : `patient_id` (ou parent du `relative_id`).

**Type** : `appointment_completed` *(à ajouter au schéma si absent)*

**Données payload** :
```json
{
  "type": "appointment_completed",
  "appointment_id": "uuid",
  "conversation_id": "uuid ou null"
}
```

**Templates par langue** :

| Locale | Title | Body |
|--------|-------|------|
| fr | Consultation terminée | Votre consultation est terminée. Vous pouvez laisser un avis. |
| en | Consultation completed | Your consultation is complete. You can leave a review. |
| he | הפגישה הסתיימה | הפגישה שלך הסתיימה. תוכל להשאיר ביקורת. |
| ru | Консультация завершена | Ваша консультация завершена. Вы можете оставить отзыв. |
| am | Consultation completed | Your consultation is complete. You can leave a review. |
| es | Consulta completada | Su consulta ha finalizado. Puede dejar una reseña. |

---

### 3.6 Nouveau message

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `POST /api/v1/conversations/{id}/messages` | POST | Praticien envoie un message |

**Destinataire** : L’autre participant de la conversation (le patient, car l’expéditeur est le praticien).

**Type** : `new_message`

**Données payload** :
```json
{
  "type": "new_message",
  "conversation_id": "uuid",
  "message_id": "uuid",
  "sender_name": "Dr. Dupont",
  "content_preview": "Extrait du message (max 80 caractères)"
}
```

**Body dynamique** : Utiliser `content_preview` dans le body pour personnaliser. Exemple :  
`"Dr. Dupont : Bonjour, je vous confirme..."`

**Templates par langue** (title fixe, body avec variable `{sender_name}` et `{preview}`) :

| Locale | Title | Body (template) |
|--------|-------|-----------------|
| fr | Nouveau message | {sender_name} : {preview} |
| en | New message | {sender_name}: {preview} |
| he | הודעה חדשה | {sender_name}: {preview} |
| ru | Новое сообщение | {sender_name}: {preview} |
| am | New message | {sender_name}: {preview} |
| es | Nuevo mensaje | {sender_name}: {preview} |

**Règles** :
- `content_preview` : tronquer `content` à 80 caractères, échapper les retours à la ligne.
- Si `message_type === 'image'` : body = `{sender_name} : [Image]` (ou équivalent localisé).
- Si `message_type === 'file'` : body = `{sender_name} : [Fichier]` (ou équivalent localisé).

---

### 3.7 Réponse à un avis

| Endpoint | Méthode | Déclencheur |
|----------|---------|-------------|
| `PATCH /api/v1/reviews/{id}/reply` | PATCH | Praticien répond à un avis |
| `PATCH /api/v1/crm/reviews/{id}/reply` | PATCH | Praticien répond via CRM |

**Destinataire** : `patient_id` de la review.

**Type** : `review_received`

**Données payload** :
```json
{
  "type": "review_received",
  "review_id": "uuid",
  "appointment_id": "uuid",
  "practitioner_name": "Dr. Dupont",
  "reply_preview": "Extrait de la réponse (max 80 caractères)"
}
```

**Templates par langue** (body avec variable `{practitioner_name}` et optionnellement `{preview}`) :

| Locale | Title | Body (template) |
|--------|-------|-----------------|
| fr | Réponse à votre avis | {practitioner_name} a répondu à votre avis. |
| en | Reply to your review | {practitioner_name} replied to your review. |
| he | תשובה לביקורת שלך | {practitioner_name} הגיב לביקורת שלך. |
| ru | Ответ на ваш отзыв | {practitioner_name} ответил на ваш отзыв. |
| am | Reply to your review | {practitioner_name} replied to your review. |
| es | Respuesta a su reseña | {practitioner_name} ha respondido a su reseña. |

---

## 4. Cas non couverts (hors scope frontend)

- **appointment_request** : Déclenché quand le patient crée un RDV (app mobile) → notifie le praticien.
- **appointment_reminder** : Rappels automatiques (cron) → géré séparément.
- **No-show** : Pas de notification push au patient (optionnel, à décider).

---

## 5. Schéma `notifications` et types

Le backend doit insérer une ligne dans `notifications` pour chaque notification envoyée :

```sql
INSERT INTO notifications (user_id, type, title, body, data, is_read)
VALUES (
  :user_id,
  :type,  -- appointment_confirmed | appointment_cancelled | appointment_created | appointment_rescheduled | appointment_completed | new_message | review_received
  :title, -- selon locale
  :body,  -- selon locale (et variables pour new_message, review_received)
  :data,  -- JSON avec appointment_id, conversation_id, etc.
  false
);
```

**Types à supporter** (à étendre si besoin) :

- `appointment_confirmed`
- `appointment_cancelled`
- `appointment_created` *(nouveau)*
- `appointment_rescheduled` *(nouveau, pour usage futur)*
- `appointment_completed` *(nouveau)*
- `new_message`
- `review_received`

---

## 6. Intégration OneSignal

### 6.1 Flux recommandé

1. Après succès de l’endpoint (confirm, cancel, message, etc.) :
   - Récupérer `user_settings` du destinataire (`notifications_enabled`, `locale`).
   - Si `notifications_enabled === false` → ne pas envoyer de push (mais insérer quand même dans `notifications` si souhaité).
   - Récupérer les push tokens du destinataire (ou l’`external_id` OneSignal si vous utilisez ce mapping).
2. Choisir le template (title/body) selon `locale`.
3. Remplir les variables (`sender_name`, `preview`, etc.) pour les types dynamiques.
4. Envoyer via l’API OneSignal (REST ou SDK).
5. Insérer la notification dans `notifications`.

### 6.2 Données OneSignal

- **include_external_user_ids** : `[user_id]` si vous utilisez `external_id` = `user_id` (recommandé).
- **contents** : `{ "en": body }` (OneSignal exige une langue par défaut ; vous pouvez dupliquer avec la locale réelle).
- **headings** : `{ "en": title }`.
- **data** : payload JSON pour le deep linking (appointment_id, conversation_id, type, etc.).

### 6.3 Gestion des erreurs

- Si OneSignal renvoie une erreur (token invalide, etc.) : logger et ne pas bloquer la réponse API.
- Optionnel : supprimer les tokens invalides de `push_tokens` si OneSignal indique qu’ils sont obsolètes.

---

## 7. Récapitulatif des endpoints à instrumenter

| Endpoint | Type notification | Destinataire |
|----------|-------------------|--------------|
| `PATCH /api/v1/crm/appointments/{id}/confirm` | appointment_confirmed | patient_id / parent |
| `PATCH /api/v1/crm/organization/appointments/{id}/confirm` | appointment_confirmed | patient_id / parent |
| `PATCH /api/v1/crm/appointments/{id}/cancel` | appointment_cancelled | patient_id / parent |
| `PATCH /api/v1/crm/organization/appointments/{id}/cancel` | appointment_cancelled | patient_id / parent |
| `POST /api/v1/crm/appointments` | appointment_created | auth_user_id (si patient lié) |
| `PATCH /api/v1/crm/appointments/{id}/complete` | appointment_completed | patient_id / parent |
| `PATCH /api/v1/crm/organization/appointments/{id}/complete` | appointment_completed | patient_id / parent |
| `POST /api/v1/conversations/{id}/messages` | new_message | patient (autre participant) |
| `PATCH /api/v1/reviews/{id}/reply` | review_received | patient_id de la review |
| `PATCH /api/v1/crm/reviews/{id}/reply` | review_received | patient_id de la review |

---

## 8. Checklist backend

- [ ] Intégrer le SDK OneSignal ou l’API REST
- [ ] Créer un module `notifications` qui :
  - Récupère `user_settings` (notifications_enabled, locale)
  - Récupère les push tokens ou external_id
  - Sélectionne le template selon la locale
  - Envoie la push et insère dans `notifications`
- [ ] Appeler ce module après chaque endpoint listé ci-dessus
- [ ] Ajouter les types `appointment_created`, `appointment_rescheduled`, `appointment_completed` au schéma si nécessaire
- [ ] Créer les templates dans les 6 langues (fr, en, he, ru, am, es)
- [ ] Tester chaque scénario avec `notifications_enabled` true/false et différentes locales
