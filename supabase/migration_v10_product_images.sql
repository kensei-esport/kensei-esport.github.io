-- ================================================================
-- KENSEI ESPORT — Migration v10 : product_images (multi-images)
-- ================================================================
-- Permet d'associer plusieurs images à un produit.
-- L'image principale reste products.image_url pour la rétrocompat.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url   text        NOT NULL,
  alt_text    text,
  sort_order  smallint    NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_images IS
  'Images supplémentaires d''un produit. Carrousel dans la page shop.';

CREATE INDEX IF NOT EXISTS product_images_product_id_idx
  ON public.product_images (product_id, sort_order);

-- RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_images_public_read ON public.product_images;
DROP POLICY IF EXISTS product_images_admin_all   ON public.product_images;

CREATE POLICY product_images_public_read ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY product_images_admin_all ON public.product_images
  FOR ALL USING (public.is_admin());

-- Grant
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- Vérification
SELECT 'product_images table created' AS status;
