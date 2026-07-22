-- ================================================================
-- KENSEI ESPORT — Fix : bucket Storage "products" manquant
-- ================================================================
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================

-- Créer le bucket produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 'products', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public          = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Policies RLS
DROP POLICY IF EXISTS products_bucket_public_read  ON storage.objects;
DROP POLICY IF EXISTS products_bucket_admin_insert ON storage.objects;
DROP POLICY IF EXISTS products_bucket_admin_update ON storage.objects;
DROP POLICY IF EXISTS products_bucket_admin_delete ON storage.objects;

CREATE POLICY products_bucket_public_read
  ON storage.objects FOR SELECT USING (bucket_id = 'products');

CREATE POLICY products_bucket_admin_insert
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND public.is_admin());

CREATE POLICY products_bucket_admin_update
  ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND public.is_admin());

CREATE POLICY products_bucket_admin_delete
  ON storage.objects FOR DELETE USING (bucket_id = 'products' AND public.is_admin());

-- Vérification
SELECT id, name, public, pg_size_pretty(file_size_limit::bigint) AS max_size
FROM storage.buckets WHERE id = 'products';
