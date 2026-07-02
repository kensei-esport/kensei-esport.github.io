-- ================================================================
-- KENSEI ESPORT — Lien players ↔ comptes auth via fan_profiles
-- ================================================================
-- fan_profiles contient : user_id (UUID auth) + username + display_name
-- players contient      : nickname + real_name + user_id (à remplir)
--
-- On fait le lien automatiquement quand :
--   LOWER(players.nickname) = LOWER(fan_profiles.username)
--
-- Instructions :
--   1. Lance la VÉRIFICATION d'abord (SELECT) pour valider les pairings
--   2. Si tout est bon, lance le UPDATE
--   3. Ceux sans fan_profile restent user_id = NULL (ils n'ont pas de compte)
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 1 — Voir les pairings proposés (lecture seule)
-- ────────────────────────────────────────────────────────────────
SELECT
  p.id              AS player_id,
  p.nickname,
  p.real_name,
  fp.user_id        AS compte_auth,
  fp.username       AS fan_username,
  fp.display_name   AS fan_displayname,
  CASE
    WHEN p.user_id IS NOT NULL THEN '✅ déjà lié'
    WHEN fp.user_id IS NOT NULL THEN '🔗 à lier'
    ELSE '❌ pas de compte'
  END AS statut
FROM public.players p
LEFT JOIN public.fan_profiles fp
  ON LOWER(p.nickname) = LOWER(fp.username)
ORDER BY statut, p.nickname;


-- ────────────────────────────────────────────────────────────────
-- ÉTAPE 2 — Auto-lien par correspondance nickname = username
--           (uniquement pour les players qui n'ont pas encore de user_id)
-- ────────────────────────────────────────────────────────────────
UPDATE public.players p
SET user_id = fp.user_id
FROM public.fan_profiles fp
WHERE LOWER(p.nickname) = LOWER(fp.username)
  AND p.user_id IS NULL;   -- ne pas écraser un lien déjà existant


-- ────────────────────────────────────────────────────────────────
-- VÉRIFICATION finale
-- ────────────────────────────────────────────────────────────────
SELECT
  p.nickname,
  p.real_name,
  p.user_id IS NOT NULL AS compte_lié,
  fp.username,
  fp.display_name
FROM public.players p
LEFT JOIN public.fan_profiles fp ON fp.user_id = p.user_id
ORDER BY p.nickname;
