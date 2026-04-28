/**
 * config.js — Configuration Supabase
 *
 * Les valeurs __SUPABASE_URL__ et __SUPABASE_ANON_KEY__ sont
 * remplacées automatiquement par GitHub Actions au déploiement
 * via les secrets du repo (Settings > Secrets and variables > Actions).
 *
 * La clé anon est publique par conception Supabase.
 * La sécurité repose sur les politiques RLS côté Supabase.
 * Ne jamais mettre la service_role key ici.
 */

const SUPABASE_URL      = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
