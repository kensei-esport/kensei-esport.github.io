-- ================================================================
-- KENSEI ESPORT — Migration v4b : Table team_accounts
-- ================================================================
-- Objectif : séparer "qui est affiché dans le roster public"
--            (team_members via players) de "quel compte auth
--            a accès à la plateforme Kensei" (team_accounts).
--
-- Résumé de l'architecture finale :
--
--   players         → profil public (pseudo, photo, pays…)
--   team_members    → lien player ↔ team pour le ROSTER PUBLIC
--   team_accounts   → lien user_id (compte auth) ↔ team pour la PLATEFORME
--   players.user_id → optionnel : relie un profil player à un compte auth
--
-- Un même compte peut être dans team_members ET team_accounts
-- pour deux équipes différentes (ex : Staff + Valorant A).
--
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Créer la table team_accounts
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_accounts (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id    uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'player',
    -- Valeurs suggérées : 'player', 'coach', 'manager', 'staff', 'analyst'
  is_active  boolean     NOT NULL DEFAULT true,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

COMMENT ON TABLE  public.team_accounts IS
  'Lien entre un compte Supabase Auth et une équipe. Sert au contrôle d''accès '
  'de la plateforme interne. Distinct du roster public (team_members).';
COMMENT ON COLUMN public.team_accounts.role IS
  'Rôle de ce compte dans cette équipe (player, coach, staff, manager, analyst).';

CREATE INDEX IF NOT EXISTS team_accounts_user_id_idx ON public.team_accounts (user_id);
CREATE INDEX IF NOT EXISTS team_accounts_team_id_idx ON public.team_accounts (team_id);

-- RLS
ALTER TABLE public.team_accounts ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir ses propres accès
CREATE POLICY team_accounts_own_read ON public.team_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Les admins gèrent tout
CREATE POLICY team_accounts_admin_all ON public.team_accounts
  FOR ALL USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Vue utilitaire : accès complets d'un compte
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_account_access AS
SELECT
  ta.user_id,
  t.id    AS team_id,
  t.name  AS team_name,
  t.game,
  ta.role,
  ta.joined_at,
  -- Si ce compte a aussi un profil joueur lié
  p.id       AS player_id,
  p.nickname AS player_nickname,
  p.photo_url
FROM public.team_accounts ta
JOIN public.teams   t ON t.id = ta.team_id
LEFT JOIN public.players p ON p.user_id = ta.user_id
WHERE ta.is_active = true
  AND t.is_active  = true;

COMMENT ON VIEW public.v_account_access IS
  'Accès plateforme d''un compte : équipes, rôle, et profil joueur associé si existant.';

GRANT SELECT ON public.v_account_access TO authenticated;


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 3 — Helpers pour peupler team_members (roster public)
-- ────────────────────────────────────────────────────────────────
-- Lance ces requêtes pour récupérer les UUIDs dont tu as besoin,
-- puis copie-les dans le template INSERT ci-dessous.

-- 3a. IDs des équipes actives
SELECT id, name, game, tag
FROM public.teams
WHERE is_active = true
ORDER BY game, name;

-- 3b. IDs des joueurs existants
SELECT id, nickname, real_name
FROM public.players
WHERE is_active = true
ORDER BY nickname;


-- ────────────────────────────────────────────────────────────────
-- TEMPLATE — Peuplement de team_members (roster public)
-- Remplace les UUIDs par les vraies valeurs récupérées ci-dessus.
-- ────────────────────────────────────────────────────────────────
/*
INSERT INTO public.team_members (team_id, player_id, role, sort_order)
VALUES
  -- Kensei Valorant A
  ('UUID-TEAM-VALO-A',  'UUID-NATIO',      'IGL',      1),
  ('UUID-TEAM-VALO-A',  'UUID-EZIROXX',    'Duelist',  2),
  ('UUID-TEAM-VALO-A',  'UUID-STYLLOX',    'Sentinel', 3),

  -- Kensei Valorant B
  ('UUID-TEAM-VALO-B',  'UUID-BLACKSHARK', 'IGL',      1),
  ('UUID-TEAM-VALO-B',  'UUID-WAZZABI',    'Duelist',  2),

  -- Kensei EVA
  ('UUID-TEAM-EVA',     'UUID-LUZZOG',     'Main',     1),
  ('UUID-TEAM-EVA',     'UUID-SHYRA',      'Support',  2),

  -- Kensei Staff (un joueur peut être dans Staff ET Valo)
  ('UUID-TEAM-STAFF',   'UUID-NATIO',      'Manager',  1),
  ('UUID-TEAM-STAFF',   'UUID-NOATYY',     'Coach',    2)

ON CONFLICT (team_id, player_id) DO NOTHING;
*/


-- ────────────────────────────────────────────────────────────────
-- TEMPLATE — Peuplement de team_accounts (accès plateforme)
-- Remplace les UUIDs par les UUIDs des comptes auth.
-- Dashboard → Authentication → Users pour les user_id.
-- ────────────────────────────────────────────────────────────────
/*
INSERT INTO public.team_accounts (user_id, team_id, role)
VALUES
  -- ksnatio : accès Valorant A (joueur) + Staff (manager)
  ('UUID-AUTH-KSNATIO', 'UUID-TEAM-VALO-A',  'player'),
  ('UUID-AUTH-KSNATIO', 'UUID-TEAM-STAFF',   'manager')

ON CONFLICT (user_id, team_id) DO NOTHING;
*/
