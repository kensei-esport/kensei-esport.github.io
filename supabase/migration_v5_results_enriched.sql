-- ================================================================
-- KENSEI ESPORT — Migration v5 : Résultats enrichis + Schema
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- PARTIE 1 — Ajouter les colonnes manquantes à la table results
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS image_url   text,        -- Photo du match (URL)
  ADD COLUMN IF NOT EXISTS youtube_url text,        -- URL replay YouTube
  ADD COLUMN IF NOT EXISTS description text;        -- Description / résumé du match

COMMENT ON COLUMN public.results.image_url   IS 'URL de la photo du match (screenshot, affiche…)';
COMMENT ON COLUMN public.results.youtube_url IS 'URL YouTube du replay. Ex: https://youtu.be/VIDEO_ID';
COMMENT ON COLUMN public.results.description IS 'Résumé ou commentaire du match affiché dans le modal.';


-- ────────────────────────────────────────────────────────────────
-- PARTIE 2 — Schéma complet de toutes les tables publiques
--            (à coller dans SQL Editor pour avoir la vue complète)
-- ────────────────────────────────────────────────────────────────
SELECT
  t.table_name                         AS "Table",
  c.ordinal_position                   AS "#",
  c.column_name                        AS "Colonne",
  c.data_type                          AS "Type",
  CASE c.is_nullable WHEN 'NO' THEN '✗' ELSE '✓' END AS "Nullable",
  c.column_default                     AS "Défaut"
FROM information_schema.tables   t
JOIN information_schema.columns  c
  ON  c.table_name   = t.table_name
  AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type   IN ('BASE TABLE', 'VIEW')
ORDER BY t.table_name, c.ordinal_position;
