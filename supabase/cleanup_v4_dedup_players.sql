-- ================================================================
-- KENSEI ESPORT — Nettoyage : dédoublonnage de la table players
-- ================================================================
-- Contexte :
--   Dans l'ancien schéma, un joueur présent dans 3 équipes avait
--   3 lignes dans players (une par team_id). Ce script fusionne
--   les doublons en gardant le plus ancien enregistrement pour
--   chaque nickname, puis met à jour team_members en conséquence.
--
-- Sécurité :
--   - Exécuté dans une transaction (ROLLBACK automatique si erreur)
--   - Une vérification finale affiche le résultat
--
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================

BEGIN;

-- ── Étape 1 : Table de correspondance ancien_uuid → uuid_à_garder ─
--   Pour chaque nickname, on garde le joueur créé en premier
--   (ou à défaut le plus petit UUID si created_at est identique).

CREATE TEMP TABLE dedup_map AS
WITH ranked AS (
  SELECT
    id,
    nickname,
    created_at,
    FIRST_VALUE(id) OVER (
      PARTITION BY nickname
      ORDER BY created_at, id   -- id comme tiebreaker déterministe
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS keep_id
  FROM public.players
)
SELECT id AS old_id, keep_id
FROM ranked
WHERE id <> keep_id;

-- Afficher ce qui va être fusionné (pour vérification avant commit)
SELECT
  p_old.nickname,
  p_old.id        AS old_id,
  p_keep.id       AS keep_id
FROM dedup_map dm
JOIN public.players p_old  ON p_old.id  = dm.old_id
JOIN public.players p_keep ON p_keep.id = dm.keep_id
ORDER BY p_old.nickname;

-- ── Étape 2 : Rediriger team_members vers le joueur conservé ──────
UPDATE public.team_members
SET player_id = dm.keep_id
FROM dedup_map dm
WHERE public.team_members.player_id = dm.old_id;

-- ── Étape 3 : Supprimer les entrées dupliquées de players ─────────
DELETE FROM public.players
WHERE id IN (SELECT old_id FROM dedup_map);

DROP TABLE dedup_map;

COMMIT;

-- ── Vérification finale ───────────────────────────────────────────
-- Doit afficher 1 ligne par nickname unique
SELECT
  p.nickname,
  COUNT(tm.id) AS nb_equipes,
  STRING_AGG(t.name, ', ' ORDER BY t.name) AS equipes
FROM public.players p
LEFT JOIN public.team_members tm ON tm.player_id = p.id
LEFT JOIN public.teams         t  ON t.id = tm.team_id
GROUP BY p.id, p.nickname
ORDER BY p.nickname;
