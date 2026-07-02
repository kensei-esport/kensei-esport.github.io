-- ================================================================
-- KENSEI ESPORT — Migration v3 : Gestion dynamique des équipes
-- ================================================================
-- Objectifs :
--   1. Ajouter user_id sur la table players (lien compte Supabase)
--   2. Créer la table team_members (many-to-many players ↔ teams)
--   3. Migrer les données existantes de players.team_id → team_members
--   4. Supprimer la colonne team_id de players (obsolète)
--   5. RLS adapté
--
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Ajouter user_id sur players
--           (nullable : un joueur peut ne pas avoir de compte)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_unique
  ON public.players (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.players.user_id IS
  'Compte Supabase Auth lié à ce joueur (optionnel). 1 compte = max 1 profil joueur.';

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Créer la table team_members (many-to-many)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       uuid        NOT NULL REFERENCES public.teams(id)   ON DELETE CASCADE,
  player_id     uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  role          text,                        -- Rôle dans CETTE équipe (IGL, Duelist, Coach…)
  jersey_number smallint,                    -- Numéro de maillot
  sort_order    smallint    NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,                 -- NULL = toujours actif
  UNIQUE (team_id, player_id)               -- Un joueur ne peut être qu'une fois par équipe
);

COMMENT ON TABLE  public.team_members IS
  'Appartenance d''un joueur à une équipe. Un joueur peut appartenir à plusieurs équipes.';
COMMENT ON COLUMN public.team_members.role IS
  'Rôle spécifique dans cette équipe (peut différer d''une team à l''autre).';

CREATE INDEX IF NOT EXISTS team_members_team_id_idx   ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS team_members_player_id_idx ON public.team_members (player_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Lecture publique (infos de roster)
CREATE POLICY "team_members_public_read" ON public.team_members
  FOR SELECT USING (is_active = true);

-- Écriture réservée aux admins authentifiés
CREATE POLICY "team_members_auth_write" ON public.team_members
  FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 3 — Migrer les données existantes
--           (copier players.team_id → team_members)
-- ────────────────────────────────────────────────────────────────
INSERT INTO public.team_members (team_id, player_id, role, sort_order, is_active)
SELECT
  p.team_id,
  p.id,
  p.role,
  COALESCE(p.sort_order, 0),
  COALESCE(p.is_active, true)
FROM public.players p
WHERE p.team_id IS NOT NULL
ON CONFLICT (team_id, player_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 4 — Nettoyer players : supprimer colonnes migrées vers
--           team_members (team_id, role déplacés, sort_order)
-- ────────────────────────────────────────────────────────────────
-- On garde: id, user_id, nickname, real_name, photo_url, country, social_url, is_active, created_at
-- On retire: team_id (remplacé par team_members), role (par team_members), sort_order (par team_members)

ALTER TABLE public.players
  DROP COLUMN IF EXISTS team_id,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS sort_order;

-- Ajouter created_at si absent
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 5 — RLS sur players (mise à jour)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS players_public_read ON public.players;
DROP POLICY IF EXISTS players_auth_all    ON public.players;

-- Lecture publique des joueurs actifs
CREATE POLICY "players_public_read" ON public.players
  FOR SELECT USING (is_active = true);

-- Un joueur peut modifier son propre profil (via son user_id)
CREATE POLICY "players_own_update" ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins authentifiés peuvent tout faire
CREATE POLICY "players_auth_write" ON public.players
  FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 6 — Vue utilitaire : roster complet d'une équipe
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_team_roster AS
SELECT
  tm.team_id,
  t.name        AS team_name,
  t.game,
  t.tag         AS team_tag,
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

-- ────────────────────────────────────────────────────────────────
-- VÉRIFICATION — Afficher le résultat de la migration
-- ────────────────────────────────────────────────────────────────
SELECT
  t.name  AS equipe,
  p.nickname,
  tm.role,
  p.user_id IS NOT NULL AS a_un_compte
FROM public.v_team_roster
ORDER BY equipe, tm.sort_order;
