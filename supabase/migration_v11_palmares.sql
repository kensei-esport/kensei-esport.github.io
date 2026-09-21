-- ================================================================
-- KENSEI ESPORT — Migration v11 : Palmarès
-- ================================================================
-- À coller dans Supabase → SQL Editor → Run
--
-- Chaque ligne = un résultat de tournoi (titre + équipe + placement).
-- Affiché sur /pages/palmares.html, filtrable par équipe, cliquable.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.palmares (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text        NOT NULL,                          -- Nom du tournoi / compétition
  team_id         uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  placement       text        NOT NULL,                          -- Libellé affiché : "1er", "2e", "Top 4", "Vainqueur"…
  placement_rank  smallint,                                      -- 1, 2, 3… pour le tri et les couleurs or/argent/bronze
  played_at       date,                                          -- Date du tournoi (ou de la finale)
  prize           text,                                          -- Prime / récompense (optionnel) ex. "500 €"
  description     text,                                          -- Résumé affiché dans le modal
  image_url       text,                                          -- Photo / visuel
  youtube_url     text,                                          -- Replay YouTube (optionnel)
  is_published    boolean     NOT NULL DEFAULT true,
  sort_order      smallint    NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.palmares IS
  'Palmarès : placements en tournoi par équipe. Affiché sur /pages/palmares.html.';
COMMENT ON COLUMN public.palmares.title          IS 'Nom du tournoi (ex. PREMIER Split 2, EVA Championship).';
COMMENT ON COLUMN public.palmares.team_id        IS 'Équipe concernée (liste déroulante via FK teams).';
COMMENT ON COLUMN public.palmares.placement      IS 'Libellé du placement affiché (1er, 2e, Top 8…).';
COMMENT ON COLUMN public.palmares.placement_rank IS 'Rang numérique : 1 = or, 2 = argent, 3 = bronze, sinon orange.';
COMMENT ON COLUMN public.palmares.played_at      IS 'Date du tournoi, utilisée pour grouper par mois.';
COMMENT ON COLUMN public.palmares.prize          IS 'Prime ou récompense (texte libre).';

CREATE INDEX IF NOT EXISTS palmares_team_id_idx     ON public.palmares (team_id);
CREATE INDEX IF NOT EXISTS palmares_played_at_idx   ON public.palmares (played_at DESC);
CREATE INDEX IF NOT EXISTS palmares_published_idx   ON public.palmares (is_published);

ALTER TABLE public.palmares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS palmares_public_read ON public.palmares;
DROP POLICY IF EXISTS palmares_admin_write ON public.palmares;

CREATE POLICY palmares_public_read ON public.palmares
  FOR SELECT USING (is_published = true);

CREATE POLICY palmares_admin_write ON public.palmares
  FOR ALL USING (public.is_admin());

GRANT SELECT                        ON public.palmares TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.palmares TO authenticated;


-- ── Exemple d'insertion (à adapter avec un vrai team_id) ─────────
-- SELECT id, name FROM public.teams WHERE is_active = true;
--
-- INSERT INTO public.palmares (title, team_id, placement, placement_rank, played_at, prize, description)
-- VALUES (
--   'PREMIER Split 2',
--   '37b61c3e-c1bc-4116-b554-b6f0296f4e50',  -- Kensei Hatamoto
--   '1er',
--   1,
--   '2026-09-20',
--   'Champion',
--   'Victoire en finale du PREMIER Split 2.'
-- );
