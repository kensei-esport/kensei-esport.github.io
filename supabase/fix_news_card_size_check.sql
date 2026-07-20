-- ================================================================
-- KENSEI ESPORT — Fix contrainte news_posts_card_size_check
-- ================================================================
-- Erreur : new row for relation "news_posts" violates check
--          constraint "news_posts_card_size_check"
-- Cause : la contrainte n'acceptait pas toutes les valeurs envoyées
--         par le panel admin ('normal', 'featured').
-- ================================================================

-- Supprimer l'ancienne contrainte restrictive
ALTER TABLE public.news_posts
  DROP CONSTRAINT IF EXISTS news_posts_card_size_check;

-- Recréer avec les valeurs utilisées par le panel admin
ALTER TABLE public.news_posts
  ADD CONSTRAINT news_posts_card_size_check
  CHECK (card_size IN ('normal', 'featured', 'large', 'wide', 'small'));

-- Vérification
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.news_posts'::regclass
  AND conname = 'news_posts_card_size_check';
