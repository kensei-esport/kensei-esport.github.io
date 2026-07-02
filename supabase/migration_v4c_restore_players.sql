-- ================================================================
-- KENSEI ESPORT — Migration v4c : Restauration players simplifié
-- ================================================================
-- On revient à la structure simple qui marchait :
--   players (id, user_id, nickname, real_name, photo_url, country,
--            social_url, team_id, role, sort_order, is_active, created_at)
--
-- Seul ajout vs l'ancien schéma : user_id → lien compte Supabase Auth.
-- Ce user_id permet :
--   - de savoir qu'un compte connecté EST un joueur
--   - de savoir dans quelle équipe il est (via players.team_id)
--   → accès plateforme = vérifier que auth.uid() existe dans players
--
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================

-- ── Restaurer les colonnes supprimées par la migration v3 ────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS team_id    uuid     REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role       text,
  ADD COLUMN IF NOT EXISTS sort_order smallint NOT NULL DEFAULT 0;

-- ── S'assurer que user_id est bien présent (ajout v3) ───────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Index unique : 1 compte = max 1 profil joueur
CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_unique
  ON public.players (user_id)
  WHERE user_id IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS players_public_read  ON public.players;
DROP POLICY IF EXISTS players_own_update   ON public.players;
DROP POLICY IF EXISTS players_admin_write  ON public.players;
DROP POLICY IF EXISTS players_auth_write   ON public.players;
DROP POLICY IF EXISTS players_auth_all     ON public.players;

-- Lecture publique des joueurs actifs
CREATE POLICY players_public_read ON public.players
  FOR SELECT USING (is_active = true);

-- Un joueur peut modifier son propre profil via son compte connecté
CREATE POLICY players_own_update ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins peuvent tout faire
CREATE POLICY players_admin_write ON public.players
  FOR ALL USING (public.is_admin());


-- ── Après la migration : mettre à jour les team_id ───────────────
-- Va dans Table Editor → players → édite chaque joueur et
-- remplis team_id avec l'UUID de son équipe.
--
-- Pour récupérer les UUIDs des équipes :
SELECT id, name, game FROM public.teams WHERE is_active = true ORDER BY game, name;

-- Pour voir les joueurs sans team_id assigné :
SELECT id, nickname, real_name FROM public.players WHERE team_id IS NULL ORDER BY nickname;
