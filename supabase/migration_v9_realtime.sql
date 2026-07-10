-- ================================================================
-- KENSEI ESPORT — Activation Supabase Realtime sur results
-- ================================================================
-- Permet au front (results.js) de recevoir les INSERT/UPDATE/DELETE
-- en temps réel via WebSocket, sans recharger la page.
--
-- Instructions :
--   Supabase Dashboard → SQL Editor → New query → Coller → Run
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.results;

-- Vérification — doit lister "results" parmi les tables
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
