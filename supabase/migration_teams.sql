-- ================================================================
-- KENSEI ESPORT — Migration : Équipes + contrainte EVA
-- ================================================================
-- Instructions :
--   1. Supabase Dashboard > SQL Editor > New query
--   2. Coller et exécuter ce fichier
--
-- Ce script :
--   - Corrige la contrainte CHECK de teams.game pour inclure 'eva'
--   - Insère l'équipe EVA (si elle n'existe pas déjà)
--   - Insère l'équipe Valorant (si elle n'existe pas déjà)
-- ================================================================

-- 1. Supprimer l'ancienne contrainte CHECK sur teams.game
alter table public.teams
  drop constraint if exists teams_game_check;

-- 2. Ajouter la nouvelle contrainte incluant 'eva'
alter table public.teams
  add constraint teams_game_check
  check (game in ('valorant', 'lol', 'rl', 'cs2', 'eafc', 'eva'));

-- 3. Idem pour la table matches si elle existe déjà
alter table public.matches
  drop constraint if exists matches_game_check;

alter table public.matches
  add constraint matches_game_check
  check (game in ('valorant', 'lol', 'rl', 'cs2', 'eafc', 'eva'));

-- 4. Insérer l'équipe EVA (ignore si déjà présente)
insert into public.teams (name, game, tag, description, logo_url, is_active)
select
  'Kensei EVA',
  'eva',
  'KS-EVA',
  'Équipe Kensei sur EVA — le FPS tactique nouvelle génération.',
  '/assets/images/games/eva.png',
  true
where not exists (
  select 1 from public.teams where game = 'eva' and is_active = true
);

-- 5. Insérer l'équipe Valorant (ignore si déjà présente)
insert into public.teams (name, game, tag, description, logo_url, is_active)
select
  'Kensei Valorant',
  'valorant',
  'KS-VAL',
  'Équipe Kensei sur Valorant.',
  '/assets/images/valo_logo.png',
  true
where not exists (
  select 1 from public.teams where game = 'valorant' and is_active = true
);
