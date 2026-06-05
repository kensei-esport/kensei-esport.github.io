-- ================================================================
-- KENSEI ESPORT — Fix "Database error saving new user" (500)
-- ================================================================
-- Problème : Supabase renvoie 500 sur /auth/v1/signup
-- Cause    : Un trigger ou hook sur auth.users échoue au moment
--            de l'inscription (table manquante, RLS bloquant, etc.)
-- Solution : Supprimer le trigger auto-création de profil.
--            Le profil fan est créé côté front dans js/setup.js,
--            le trigger n'est pas nécessaire.
--
-- Instructions :
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Coller ce fichier en entier → Run
--   3. Retester le signup sur le site
-- ================================================================

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Supprimer le trigger et la fonction handle_new_user
--           (noms les plus courants, DROP IF EXISTS = sans erreur
--            si ils n'existent pas)
-- ──────────────────────────────────────────────────────────────────
DROP TRIGGER  IF EXISTS on_auth_user_created     ON auth.users;
DROP TRIGGER  IF EXISTS handle_new_user_trigger  ON auth.users;
DROP TRIGGER  IF EXISTS create_profile_on_signup ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user()   CASCADE;
DROP FUNCTION IF EXISTS public.create_fan_profile() CASCADE;

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Vérifier que la table fan_profiles existe bien
--           (recrée uniquement si elle n'existe pas)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fan_profiles (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text        NOT NULL UNIQUE,
  display_name  text,
  bio           text,
  avatar_url    text,
  favorite_game text        CHECK (favorite_game IN ('valorant','lol','rl','cs2','eafc','eva')),
  fan_since     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 3 — Activer RLS et définir des policies strictes
--           (DROP IF EXISTS pour éviter les doublons)
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.fan_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (toutes les variantes connues)
DROP POLICY IF EXISTS fan_profiles_public_read  ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_insert   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_update   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_delete   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_select   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_auth_read    ON public.fan_profiles;

-- L'utilisateur connecté peut lire uniquement son propre profil
CREATE POLICY fan_profiles_own_select
  ON public.fan_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- L'utilisateur connecté peut créer son propre profil (setup.js)
CREATE POLICY fan_profiles_own_insert
  ON public.fan_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- L'utilisateur connecté peut modifier son propre profil
CREATE POLICY fan_profiles_own_update
  ON public.fan_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- L'utilisateur connecté peut supprimer son propre profil
CREATE POLICY fan_profiles_own_delete
  ON public.fan_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 4 — Vue publique limitée pour la page fan publique
--           (utilisée par js/fan.js pour afficher les profils publics)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.public_fan_profiles AS
  SELECT
    user_id,
    username,
    display_name,
    avatar_url,
    favorite_game,
    fan_since,
    created_at
  FROM public.fan_profiles;

GRANT SELECT ON public.public_fan_profiles TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- ÉTAPE 5 — Diagnostic : lister les triggers encore actifs
--           sur auth.users (doit retourner 0 ligne après ce script)
-- ──────────────────────────────────────────────────────────────────
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table  = 'users';

-- ================================================================
-- ✅ Si l'ÉTAPE 5 retourne 0 lignes, le signup devrait fonctionner.
-- ================================================================
