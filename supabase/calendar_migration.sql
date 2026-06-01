-- ================================================================
-- KENSEI ESPORT — Migration Calendrier des matchs
-- ================================================================
-- Instructions :
--   1. Ouvrir Supabase Dashboard > SQL Editor > New query
--   2. Coller et exécuter ce fichier
--
-- Pour ajouter un match :
--   INSERT INTO public.matches
--     (team_id, game, opponent, tournament, match_date, match_time, venue, stream_url, notes)
--   VALUES
--     (NULL, 'eva', 'Team XYZ', 'Championnat FR', '2026-07-15', '20:00', 'Online', 'https://twitch.tv/kenseiesport', NULL);
--
-- Pour le rendre invisible sans le supprimer :
--   UPDATE public.matches SET is_published = false WHERE id = '...';
-- ================================================================

-- Extension UUID (déjà créée si schema.sql a été exécuté avant)
create extension if not exists "uuid-ossp";

-- ================================================================
-- MATCHES — Table des matchs à venir
-- ================================================================
create table if not exists public.matches (
  id           uuid    default uuid_generate_v4() primary key,

  -- Équipe Kensei qui joue (optionnel si toutes les équipes jouent)
  team_id      uuid    references public.teams(id) on delete set null,

  -- Jeu concerné (même liste que teams.game)
  game         text    not null
    check (game in ('valorant','lol','rl','cs2','eafc','eva')),

  -- Adversaire
  opponent     text    not null,

  -- Tournoi / compétition
  tournament   text,

  -- Date et heure du match
  match_date   date    not null,
  match_time   time,                        -- heure locale (Europe/Paris recommandé)

  -- Lieu (ex: 'Online', 'LAN Paris', etc.)
  venue        text    default 'Online',

  -- URL du stream si connu à l'avance
  stream_url   text,

  -- Notes internes ou description affichée
  notes        text,

  -- Visibilité publique
  is_published boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table  public.matches             is 'Matchs à venir de Kensei Esport. is_published=false pour masquer.';
comment on column public.matches.team_id     is 'FK → teams.id. Peut être NULL si match concerne tout le club.';
comment on column public.matches.game        is 'valorant | lol | rl | cs2 | eafc | eva';
comment on column public.matches.match_date  is 'Date du match au format YYYY-MM-DD';
comment on column public.matches.match_time  is 'Heure locale du match, ex: 20:00:00';
comment on column public.matches.stream_url  is 'URL complète du stream Twitch/YouTube si disponible';

-- Index pour requêtes fréquentes
create index if not exists idx_matches_date      on public.matches(match_date);
create index if not exists idx_matches_game      on public.matches(game);
create index if not exists idx_matches_published on public.matches(is_published, match_date);

-- Trigger updated_at (réutilise la fonction déjà créée dans schema.sql si elle existe)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ================================================================
-- Row Level Security
-- ================================================================
alter table public.matches enable row level security;

-- Lecture publique : uniquement les matchs publiés
create policy "matches_public_read"
  on public.matches for select
  using (is_published = true);

-- Écriture réservée aux utilisateurs authentifiés (admins)
create policy "matches_auth_all"
  on public.matches for all
  using (auth.role() = 'authenticated');

-- ================================================================
-- Données de démonstration (commentées — à décommenter si besoin)
-- ================================================================
/*
insert into public.matches
  (game, opponent, tournament, match_date, match_time, venue, stream_url, notes)
values
  ('eva', 'Team Alpha',   'Ligue Nationale EVA S1',  current_date + 7,  '19:00', 'Online',    'https://twitch.tv/kenseiesport', null),
  ('eva', 'Phoenix Crew', 'Ligue Nationale EVA S1',  current_date + 14, '20:00', 'Online',    'https://twitch.tv/kenseiesport', null),
  ('eva', 'Dragon Force', 'Coupe de France EVA',     current_date + 21, '18:30', 'LAN Paris', null,                            'Finale régionale'),
  ('eva', 'Storm United', 'Ligue Nationale EVA S1',  current_date + 28, '20:00', 'Online',    null,                            null);
*/
