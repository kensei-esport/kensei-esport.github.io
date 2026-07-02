-- ================================================================
-- KENSEI ESPORT — Migration v4 : Schéma complet + RLS renforcé
-- ================================================================
-- Ce fichier est idempotent (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
-- Il peut être relancé en toute sécurité sur une base déjà partiellement
-- migrée.
--
-- Résumé des changements vs v3 :
--   1. Ajout de logo_url sur la table teams
--   2. Fonction helper is_admin() basée sur app_metadata JWT
--   3. Remplacement des policies "tous les authentifiés peuvent écrire"
--      par des policies "admin seulement" sur teams / players / team_members
--   4. Conservation du "joueur peut modifier son propre profil" (user_id)
--   5. Mise à jour de la vue v_team_roster (inchangée, recréée proprement)
--
-- Comment marquer un compte comme admin dans Supabase :
--   Dashboard → Authentication → Users → sélectionner l'user
--   → Edit → App Metadata → ajouter { "role": "admin" }
--
-- Instructions d'exécution :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 0 — Fonction helper : is_admin()
--           Lit app_metadata.role depuis le JWT Supabase.
--           SECURITY DEFINER pour être accessible depuis les policies.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Renvoie true si le JWT contient app_metadata.role = ''admin''. '
  'Définir via Supabase Dashboard → Authentication → Users → App Metadata.';


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Table teams
--           Créée si absente, colonnes manquantes ajoutées.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  game        text        NOT NULL,           -- 'valorant','lol','rl','cs2','eafc','eva','staff'…
  tag         text,                           -- Ex : "KSN", "[KSN]"
  description text,
  logo_url    text,                           -- URL du logo spécifique à cette équipe
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Ajouter logo_url si la table existait déjà sans cette colonne
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON TABLE  public.teams    IS 'Équipes actives de Kensei Esport.';
COMMENT ON COLUMN public.teams.logo_url IS
  'URL du logo de cette équipe. Si NULL, le front utilise le logo du jeu par défaut.';

-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teams_public_read  ON public.teams;
DROP POLICY IF EXISTS teams_auth_write   ON public.teams;  -- ancienne policy trop large
DROP POLICY IF EXISTS teams_admin_write  ON public.teams;

-- Lecture publique (équipes actives)
CREATE POLICY teams_public_read ON public.teams
  FOR SELECT USING (is_active = true);

-- Écriture réservée aux admins
CREATE POLICY teams_admin_write ON public.teams
  FOR ALL USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Table players
--           Schéma v3 attendu : id, user_id, nickname, real_name,
--           photo_url, country, social_url, is_active, created_at
--           (team_id / role / sort_order supprimés en v3 → team_members)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.players (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname    text        NOT NULL,
  real_name   text,
  photo_url   text,
  country     text,
  social_url  text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Migrations défensives (si colonnes déjà présentes ou absentes)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Colonnes obsolètes (migrées vers team_members en v3)
ALTER TABLE public.players
  DROP COLUMN IF EXISTS team_id,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS sort_order;

-- Index unique : 1 compte = max 1 profil joueur
CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_unique
  ON public.players (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON TABLE  public.players         IS 'Profils joueurs / staff. Indépendants des équipes (liaison via team_members).';
COMMENT ON COLUMN public.players.user_id IS
  'Compte Supabase Auth lié à ce joueur (optionnel). 1 compte = max 1 profil joueur.';

-- RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS players_public_read  ON public.players;
DROP POLICY IF EXISTS players_own_update   ON public.players;
DROP POLICY IF EXISTS players_auth_write   ON public.players;  -- ancienne policy trop large
DROP POLICY IF EXISTS players_admin_write  ON public.players;
DROP POLICY IF EXISTS players_auth_all     ON public.players;

-- Lecture publique des joueurs actifs
CREATE POLICY players_public_read ON public.players
  FOR SELECT USING (is_active = true);

-- Un joueur peut modifier uniquement son propre profil (nickname, photo, etc.)
CREATE POLICY players_own_update ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent tout faire (insert / update / delete)
CREATE POLICY players_admin_write ON public.players
  FOR ALL USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 3 — Table team_members (many-to-many players ↔ teams)
--           Un joueur peut appartenir à plusieurs équipes.
--           Son rôle peut différer selon l'équipe.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       uuid        NOT NULL REFERENCES public.teams(id)   ON DELETE CASCADE,
  player_id     uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  role          text,                        -- Rôle dans CETTE équipe (IGL, Duelist, Coach…)
  jersey_number smallint,
  sort_order    smallint    NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,                 -- NULL = toujours actif
  UNIQUE (team_id, player_id)
);

COMMENT ON TABLE  public.team_members IS
  'Appartenance d''un joueur à une équipe. Un joueur peut appartenir à plusieurs équipes.';
COMMENT ON COLUMN public.team_members.role IS
  'Rôle spécifique dans CETTE équipe (peut différer d''une team à l''autre).';

CREATE INDEX IF NOT EXISTS team_members_team_id_idx   ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS team_members_player_id_idx ON public.team_members (player_id);

-- RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_public_read  ON public.team_members;
DROP POLICY IF EXISTS team_members_auth_write   ON public.team_members;  -- ancienne policy trop large
DROP POLICY IF EXISTS team_members_admin_write  ON public.team_members;

-- Lecture publique des membres actifs
CREATE POLICY team_members_public_read ON public.team_members
  FOR SELECT USING (is_active = true);

-- Écriture réservée aux admins
CREATE POLICY team_members_admin_write ON public.team_members
  FOR ALL USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 4 — Table fan_profiles
--           (déjà gérée dans fix_signup_500.sql, recréée si absente)
-- ────────────────────────────────────────────────────────────────
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

COMMENT ON TABLE public.fan_profiles IS
  'Profils fans (comptes publics). Distincts des profils joueurs/staff (players).';

ALTER TABLE public.fan_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fan_profiles_public_read  ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_select   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_insert   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_update   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_own_delete   ON public.fan_profiles;
DROP POLICY IF EXISTS fan_profiles_auth_read    ON public.fan_profiles;

-- Chaque utilisateur ne voit et ne modifie que son propre profil fan
CREATE POLICY fan_profiles_own_select ON public.fan_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY fan_profiles_own_insert ON public.fan_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY fan_profiles_own_update ON public.fan_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY fan_profiles_own_delete ON public.fan_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Vue publique limitée (pseudo, avatar, jeu favori — pas de bio ni d'email)
CREATE OR REPLACE VIEW public.public_fan_profiles AS
  SELECT user_id, username, display_name, avatar_url, favorite_game, fan_since, created_at
  FROM public.fan_profiles;

GRANT SELECT ON public.public_fan_profiles TO anon, authenticated;


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 5 — Vue v_team_roster
--           Dénormalise équipe + joueur + membership pour le front.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_team_roster AS
SELECT
  tm.team_id,
  t.name        AS team_name,
  t.game,
  t.tag         AS team_tag,
  t.logo_url    AS team_logo_url,
  p.id          AS player_id,
  p.user_id,
  p.nickname,
  p.real_name,
  p.photo_url,
  p.country,
  p.social_url,
  tm.role,
  tm.jersey_number,
  tm.sort_order,
  tm.joined_at
FROM public.team_members tm
JOIN public.teams   t ON t.id = tm.team_id
JOIN public.players p ON p.id = tm.player_id
WHERE tm.is_active = true
  AND t.is_active  = true
  AND p.is_active  = true
ORDER BY t.game, tm.sort_order, p.nickname;

COMMENT ON VIEW public.v_team_roster IS
  'Vue dénormalisée du roster de chaque équipe active.';

GRANT SELECT ON public.v_team_roster TO anon, authenticated;


-- ────────────────────────────────────────────────────────────────
-- VÉRIFICATION
-- ────────────────────────────────────────────────────────────────
SELECT
  t.name        AS equipe,
  t.game,
  p.nickname,
  p.user_id     IS NOT NULL AS a_un_compte,
  tm.role
FROM public.team_members tm
JOIN public.teams   t ON t.id = tm.team_id
JOIN public.players p ON p.id = tm.player_id
WHERE tm.is_active = true
ORDER BY t.game, tm.sort_order, p.nickname;
