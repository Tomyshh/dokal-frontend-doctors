# Connexion Google (OAuth) – Configuration

Ce document décrit la configuration nécessaire pour que la connexion avec Google fonctionne (DevOps, Frontend déjà en place, Backend).

---

## 1. DevOps / Configuration

### 1.1 Google Cloud Console

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Créer un projet ou en sélectionner un.
3. **Configure the OAuth consent screen** (écran de consentement) :
   - Type : **External** (ou Internal si uniquement pour votre organisation).
   - Renseigner au minimum : **App name**, **User support email**, **Developer contact**.
4. **Create Credentials** → **OAuth client ID** :
   - Application type : **Web application**.
   - **Authorized JavaScript origins** :
     - En dev : `http://localhost:3001`
     - En prod : `https://dokal.life`
   - **Authorized redirect URIs** (obligatoire) :
     - Utiliser l’URL de callback **Supabase** (pas celle de votre app) :
     - Format : `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
     - Remplacer `<PROJECT_REF>` par l’ID de votre projet Supabase (visible dans l’URL du dashboard Supabase).
     - Exemple : `https://abcdefgh.supabase.co/auth/v1/callback`
5. Récupérer le **Client ID** et le **Client Secret** et les garder pour Supabase.

**Scopes** : Les scopes par défaut (`openid`, `userinfo.email`, `userinfo.profile`) suffisent. Les ajouter si la console le demande.

### 1.2 Supabase Dashboard

**Important** : le CRM frontend tourne sur le **port 3001** (`npm run dev` → `http://localhost:3001`). Ne pas utiliser le port 3000 (réservé au backend).

1. Ouvrir le [Dashboard Supabase](https://supabase.com/dashboard) → votre projet.
2. **Authentication** → **URL Configuration** :
   - **Site URL** : en dev mettre `http://localhost:3001` (pas 3000). Sinon Supabase peut rediriger vers le mauvais port après Google.
   - **Redirect URLs** : ajouter explicitement :
     - En dev : `http://localhost:3001/auth/callback`
     - En prod : `https://dokal.life/auth/callback`
   - Sauvegarder.
3. **Authentication** → **Providers** → **Google**.
4. Activer **Enable Sign in with Google**.
5. Renseigner :
   - **Client ID** : celui fourni par Google.
   - **Client Secret** : celui fourni par Google.
6. Enregistrer.

### 1.3 Production (dokal.life)

Pour le déploiement actuel (frontend sur **dokal.life**, backend déployé à part) :

| Où | Valeur à mettre |
|----|-----------------|
| **Supabase → URL Configuration → Site URL** | `https://dokal.life` |
| **Supabase → Redirect URLs** | `https://dokal.life/auth/callback` |
| **Google Console → Authorized JavaScript origins** | `https://dokal.life` |
| **Google Console → Authorized redirect URIs** | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (inchangé) |

Sans ça, après la connexion Google, Supabase redirige vers la mauvaise URL (ex. localhost ou le backend) et tu obtiens une erreur ou « site inaccessible ».

### 1.4 Résumé DevOps

| Où | Quoi |
|----|------|
| **Google Console** | Créer OAuth 2.0 “Web application”, **Redirect URI** = `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| **Supabase** | Activer Google, coller Client ID + Secret, ajouter **Redirect URLs** = `https://dokal.life/auth/callback` (et localhost en dev) |

Aucune variable d’environnement supplémentaire n’est nécessaire côté frontend pour Google (Supabase gère le provider).

---

## 2. Frontend (déjà en place)

- **Page login** : bouton “Continuer avec Google” qui appelle `signInWithOAuth({ provider: 'google', options: { redirectTo: '.../auth/callback?next=/${locale}' } })`.
- **Route** `GET /auth/callback` : échange le `code` reçu contre une session Supabase (`exchangeCodeForSession`), écrit les cookies de session, puis redirige vers `next` (ex. `/${locale}`).
- En cas d’erreur, redirection vers `/${locale}/login?error=auth_code` avec message traduit.

Rien à faire de plus côté frontend pour la connexion Google.

---

## 3. Backend – À faire

L’API utilise déjà le JWT Supabase (`Authorization: Bearer <token>`). Une connexion via Google produit le **même type de JWT** après que Supabase ait créé ou récupéré l’utilisateur.

À vérifier / implémenter côté backend :

1. **Vérification du JWT**  
   Aucun changement : continuer à valider le token Supabase comme aujourd’hui (même logique pour email/password et Google).

2. **Création / mise à jour du profil praticien**  
   Lors de la **première** connexion avec Google, Supabase crée un utilisateur dans `auth.users` (souvent avec `email`, `raw_user_meta_data` contenant nom, prénom, avatar, etc.). Il faut que le backend (ou un trigger Supabase) :
   - Crée l’entrée correspondante dans votre table **profil / praticien** si elle n’existe pas (en s’appuyant sur `auth.users.id` et éventuellement `raw_user_meta_data`).
   - Ou que votre endpoint **GET /profile** (ou équivalent) crée le profil à la volée au premier appel pour cet `id` utilisateur.

3. **Rôle et métadonnées**  
   Si votre app distingue `patient` / `practitioner` / `admin` :
   - Soit vous définissez le rôle dans les **User Metadata** Supabase (ex. à l’inscription ou via un flow “compléter le profil” après la première connexion Google).
   - Soit vous le déduisez côté backend à partir de la présence d’un profil “praticien” en base.

4. **Tests**  
   - Connexion Google → vérifier que le JWT est bien reçu par le backend et que l’utilisateur est identifié.
   - Première connexion Google → vérifier que le profil praticien est créé (ou que le flow “compléter le profil” s’affiche si c’est le cas).

En résumé : **pas de changement sur la vérification du token** ; s’assurer que **le profil (et éventuellement le rôle) est créé ou mis à jour** pour les utilisateurs qui arrivent uniquement via Google.
