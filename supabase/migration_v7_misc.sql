-- ================================================================
-- KENSEI ESPORT — Ajouts rapides
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. Ajouter opponent_logo_url à la table results
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS opponent_logo_url text;

COMMENT ON COLUMN public.results.opponent_logo_url IS
  'URL du logo de l''adversaire (bucket results ou externe). '
  'Si NULL, le front utilise le logo par défaut du jeu.';


-- ────────────────────────────────────────────────────────────────
-- 2. Se passer soi-même admin
--    Remplace ton.email@ici par ton adresse email Supabase.
-- ────────────────────────────────────────────────────────────────
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'aguionnet@gaming.tech';

-- Vérification :
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE email = 'aguionnet@gaming.tech';
