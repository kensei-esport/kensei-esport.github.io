-- ================================================================
-- KENSEI ESPORT — Migration v12
-- Joueurs (photo + bio), lineup des résultats, partenaires, matchs
-- À coller dans Supabase → SQL Editor → Run
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. Joueurs : photo (déjà là en v4) + description
--    Le panel admin peut remplir photo_url et description.
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS photo_url    text,
  ADD COLUMN IF NOT EXISTS description  text;

COMMENT ON COLUMN public.players.photo_url   IS 'Photo / portrait affiché sur la carte et dans le modal fiche joueur.';
COMMENT ON COLUMN public.players.description IS 'Bio / description affichée dans le modal fiche joueur.';


-- Recréer la vue roster avec la bio.
-- CREATE OR REPLACE VIEW ne peut PAS changer l'ordre / le nom des colonnes
-- (erreur 42P16). Il faut DROP puis CREATE. description est ajoutée à la fin.
DROP VIEW IF EXISTS public.v_team_roster;

CREATE VIEW public.v_team_roster AS
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
  tm.joined_at,
  p.description
FROM public.team_members tm
JOIN public.teams   t ON t.id = tm.team_id
JOIN public.players p ON p.id = tm.player_id
WHERE tm.is_active = true
  AND t.is_active  = true
  AND p.is_active  = true
ORDER BY t.game, tm.sort_order, p.nickname;

GRANT SELECT ON public.v_team_roster TO anon, authenticated;


-- ────────────────────────────────────────────────────────────────
-- 2. Lineup d'un résultat (optionnel)
--    Joueurs / coach / manager présents sur le match.
--    À remplir depuis le panel admin après (ou avec) le résultat.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.result_lineup (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  result_id   uuid        NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  player_id   uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  staff_role  text        NOT NULL DEFAULT 'player'
                          CHECK (staff_role IN ('player', 'coach', 'manager')),
  sort_order  smallint    NOT NULL DEFAULT 0,
  UNIQUE (result_id, player_id)
);

COMMENT ON TABLE  public.result_lineup IS
  'Composition optionnelle d''un résultat : joueurs, coach, manager. Affichée dans le modal.';
COMMENT ON COLUMN public.result_lineup.staff_role IS
  'player | coach | manager';

CREATE INDEX IF NOT EXISTS result_lineup_result_id_idx ON public.result_lineup (result_id);

ALTER TABLE public.result_lineup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS result_lineup_public_read ON public.result_lineup;
DROP POLICY IF EXISTS result_lineup_admin_write ON public.result_lineup;

CREATE POLICY result_lineup_public_read ON public.result_lineup
  FOR SELECT USING (true);

CREATE POLICY result_lineup_admin_write ON public.result_lineup
  FOR ALL USING (public.is_admin());

GRANT SELECT                        ON public.team_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

GRANT SELECT                        ON public.result_lineup TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_lineup TO authenticated;


-- ────────────────────────────────────────────────────────────────
-- 3. Partenaires (table créée si absente + colonnes défensives)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL,
  logo_url     text,
  website_url  text,
  description  text,
  is_active    boolean     NOT NULL DEFAULT true,
  sort_order   smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS name         text,
  ADD COLUMN IF NOT EXISTS logo_url     text,
  ADD COLUMN IF NOT EXISTS website_url  text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS is_active    boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order   smallint    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

COMMENT ON TABLE public.partners IS
  'Sponsors / partenaires affichés sur /pages/about.html#partners.';

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partners_public_read ON public.partners;
DROP POLICY IF EXISTS partners_admin_all   ON public.partners;

CREATE POLICY partners_public_read ON public.partners
  FOR SELECT USING (is_active = true);

CREATE POLICY partners_admin_all ON public.partners
  FOR ALL USING (public.is_admin());

GRANT SELECT                        ON public.partners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;


-- ────────────────────────────────────────────────────────────────
-- 4. Matchs : visuel optionnel pour le modal "prochain match"
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS image_url         text,
  ADD COLUMN IF NOT EXISTS description       text,
  ADD COLUMN IF NOT EXISTS opponent_logo_url text;

COMMENT ON COLUMN public.matches.image_url         IS 'Visuel du match (affiche, thumbnail).';
COMMENT ON COLUMN public.matches.description       IS 'Texte affiché dans le modal du prochain match.';
COMMENT ON COLUMN public.matches.opponent_logo_url IS 'Logo adversaire.';


-- ── Exemples ─────────────────────────────────────────────────────
-- SELECT id, nickname FROM public.players WHERE is_active = true;
-- SELECT id, opponent FROM public.results ORDER BY played_at DESC LIMIT 5;
--
-- INSERT INTO public.result_lineup (result_id, player_id, staff_role, sort_order)
-- VALUES
--   ('<result_uuid>', '<player_uuid>', 'player',  0),
--   ('<result_uuid>', '<coach_uuid>',  'coach',   10),
--   ('<result_uuid>', '<mgr_uuid>',    'manager', 20);
--
-- INSERT INTO public.partners (name, logo_url, website_url, sort_order)
-- VALUES ('Nom du partenaire', 'https://…/logo.png', 'https://example.com', 0);
