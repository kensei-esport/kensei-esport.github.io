-- ================================================================
-- KENSEI ESPORT — Migration v8 : RLS écriture tables contenu
-- ================================================================
-- Les tables results, matches, news_posts, partners, products
-- n'avaient pas de policies d'écriture → UPDATE/INSERT retournaient 400.
-- Les teams/players avaient des policies admins mais sans les GRANTs.
-- ================================================================

-- ── Helper is_admin() (idempotent) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ── GRANTS de base (rôles anon/authenticated) ────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT                   ON public.teams       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;

GRANT SELECT                   ON public.players     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;

GRANT SELECT                   ON public.results     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;

GRANT SELECT                   ON public.matches     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;

GRANT SELECT                   ON public.news_posts  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;

GRANT SELECT                   ON public.partners    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;

GRANT SELECT                   ON public.products    TO anon, authenticated;

-- ── RLS + policies pour chaque table ────────────────────────────

-- results
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS results_public_read ON public.results;
DROP POLICY IF EXISTS results_admin_write ON public.results;
CREATE POLICY results_public_read ON public.results FOR SELECT USING (true);
CREATE POLICY results_admin_write ON public.results FOR ALL    USING (public.is_admin());

-- matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS matches_public_read ON public.matches;
DROP POLICY IF EXISTS matches_admin_all   ON public.matches;
CREATE POLICY matches_public_read ON public.matches FOR SELECT USING (is_published = true);
CREATE POLICY matches_admin_all   ON public.matches FOR ALL    USING (public.is_admin());

-- news_posts
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS news_public_read ON public.news_posts;
DROP POLICY IF EXISTS news_admin_all   ON public.news_posts;
CREATE POLICY news_public_read ON public.news_posts FOR SELECT USING (is_published = true);
CREATE POLICY news_admin_all   ON public.news_posts FOR ALL    USING (public.is_admin());

-- partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partners_public_read ON public.partners;
DROP POLICY IF EXISTS partners_admin_all   ON public.partners;
CREATE POLICY partners_public_read ON public.partners FOR SELECT USING (is_active = true);
CREATE POLICY partners_admin_all   ON public.partners FOR ALL    USING (public.is_admin());

-- products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS products_admin_all   ON public.products;
CREATE POLICY products_public_read ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY products_admin_all   ON public.products FOR ALL    USING (public.is_admin());

-- contact_messages : les fans peuvent insérer, les admins lisent
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_public_insert ON public.contact_messages;
DROP POLICY IF EXISTS contact_admin_all     ON public.contact_messages;
CREATE POLICY contact_public_insert ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY contact_admin_all     ON public.contact_messages FOR ALL    USING (public.is_admin());

-- ── Vérification ─────────────────────────────────────────────────
SELECT tablename,
       COUNT(*) FILTER (WHERE cmd = 'SELECT') AS read_policies,
       COUNT(*) FILTER (WHERE cmd != 'SELECT') AS write_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('results','matches','news_posts','partners','products','contact_messages')
GROUP BY tablename
ORDER BY tablename;
