-- ================================================================
-- KENSEI ESPORT — Migration v6 : Supabase Storage Buckets
-- ================================================================
-- IMPORTANT : exécuter en DEUX passes séparées dans le SQL Editor.
--   Passe 1 (ce fichier, ÉTAPE 1 uniquement) : créer les buckets
--   Passe 2 (ÉTAPE 2 uniquement) : créer les policies
--
-- La ligne ALTER TABLE a été retirée : RLS est déjà activé par
-- défaut sur storage.objects dans Supabase.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Créer les buckets (coller uniquement ce bloc en 1er)
-- ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('players',  'players',  true, 5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('teams',    'teams',    true, 5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('avatars',  'avatars',  true, 2097152,   ARRAY['image/jpeg','image/png','image/webp']),
  ('news',     'news',     true, 10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('results',  'results',  true, 10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('partners', 'partners', true, 3145728,   ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Vérification étape 1 :
SELECT id, name, public, pg_size_pretty(file_size_limit::bigint) AS max_size
FROM storage.buckets
WHERE id IN ('players','teams','avatars','news','results','partners')
ORDER BY id;


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Policies (ouvrir une NOUVELLE requête SQL pour ce bloc)
-- Ne PAS inclure l'ÉTAPE 1 dans la même exécution.
-- ────────────────────────────────────────────────────────────────

-- Nettoyage des anciennes policies si elles existent
DROP POLICY IF EXISTS players_public_read  ON storage.objects;
DROP POLICY IF EXISTS teams_public_read    ON storage.objects;
DROP POLICY IF EXISTS news_public_read     ON storage.objects;
DROP POLICY IF EXISTS results_public_read  ON storage.objects;
DROP POLICY IF EXISTS partners_public_read ON storage.objects;
DROP POLICY IF EXISTS avatars_public_read  ON storage.objects;
DROP POLICY IF EXISTS players_admin_insert  ON storage.objects;
DROP POLICY IF EXISTS players_admin_update  ON storage.objects;
DROP POLICY IF EXISTS players_admin_delete  ON storage.objects;
DROP POLICY IF EXISTS teams_admin_insert    ON storage.objects;
DROP POLICY IF EXISTS teams_admin_update    ON storage.objects;
DROP POLICY IF EXISTS teams_admin_delete    ON storage.objects;
DROP POLICY IF EXISTS news_admin_insert     ON storage.objects;
DROP POLICY IF EXISTS news_admin_update     ON storage.objects;
DROP POLICY IF EXISTS news_admin_delete     ON storage.objects;
DROP POLICY IF EXISTS results_admin_insert  ON storage.objects;
DROP POLICY IF EXISTS results_admin_update  ON storage.objects;
DROP POLICY IF EXISTS results_admin_delete  ON storage.objects;
DROP POLICY IF EXISTS partners_admin_insert ON storage.objects;
DROP POLICY IF EXISTS partners_admin_update ON storage.objects;
DROP POLICY IF EXISTS partners_admin_delete ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_insert  ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_update  ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_delete  ON storage.objects;

-- Lecture publique
CREATE POLICY players_public_read  ON storage.objects FOR SELECT USING (bucket_id = 'players');
CREATE POLICY teams_public_read    ON storage.objects FOR SELECT USING (bucket_id = 'teams');
CREATE POLICY news_public_read     ON storage.objects FOR SELECT USING (bucket_id = 'news');
CREATE POLICY results_public_read  ON storage.objects FOR SELECT USING (bucket_id = 'results');
CREATE POLICY partners_public_read ON storage.objects FOR SELECT USING (bucket_id = 'partners');
CREATE POLICY avatars_public_read  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Écriture admins (tous buckets sauf avatars)
CREATE POLICY players_admin_insert  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'players'  AND public.is_admin());
CREATE POLICY players_admin_update  ON storage.objects FOR UPDATE USING    (bucket_id = 'players'  AND public.is_admin());
CREATE POLICY players_admin_delete  ON storage.objects FOR DELETE USING    (bucket_id = 'players'  AND public.is_admin());

CREATE POLICY teams_admin_insert    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'teams'    AND public.is_admin());
CREATE POLICY teams_admin_update    ON storage.objects FOR UPDATE USING    (bucket_id = 'teams'    AND public.is_admin());
CREATE POLICY teams_admin_delete    ON storage.objects FOR DELETE USING    (bucket_id = 'teams'    AND public.is_admin());

CREATE POLICY news_admin_insert     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news'     AND public.is_admin());
CREATE POLICY news_admin_update     ON storage.objects FOR UPDATE USING    (bucket_id = 'news'     AND public.is_admin());
CREATE POLICY news_admin_delete     ON storage.objects FOR DELETE USING    (bucket_id = 'news'     AND public.is_admin());

CREATE POLICY results_admin_insert  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'results'  AND public.is_admin());
CREATE POLICY results_admin_update  ON storage.objects FOR UPDATE USING    (bucket_id = 'results'  AND public.is_admin());
CREATE POLICY results_admin_delete  ON storage.objects FOR DELETE USING    (bucket_id = 'results'  AND public.is_admin());

CREATE POLICY partners_admin_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'partners' AND public.is_admin());
CREATE POLICY partners_admin_update ON storage.objects FOR UPDATE USING    (bucket_id = 'partners' AND public.is_admin());
CREATE POLICY partners_admin_delete ON storage.objects FOR DELETE USING    (bucket_id = 'partners' AND public.is_admin());

-- Avatars : chaque utilisateur gère le sien
CREATE POLICY avatars_owner_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );
CREATE POLICY avatars_owner_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );
CREATE POLICY avatars_owner_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1])
  );
