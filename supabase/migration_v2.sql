-- ================================================================
-- KENSEI ESPORT — Migration vers le schéma v2
-- ================================================================
-- INSTRUCTIONS :
--   1. Ouvrir Supabase Dashboard
--   2. Menu gauche → SQL Editor → "+ New query"
--   3. Coller tout ce fichier → cliquer "Run"
--   4. C'est tout. Les anciennes tables sont automatiquement
--      supprimées et recréées avec la nouvelle structure.
--
-- ⚠️  Ce script SUPPRIME et RECRÉE toutes les tables.
--     Toutes les données existantes seront perdues.
--     N'exécutez ce script qu'une seule fois sur une base vide.
-- ================================================================

-- Extension UUID (si pas déjà installée)
create extension if not exists "uuid-ossp";

-- ================================================================
-- SUPPRESSION DES ANCIENNES TABLES (ordre FK inverse)
-- ================================================================
drop table if exists public.contact_messages cascade;
drop table if exists public.partners         cascade;
drop table if exists public.products         cascade;
drop table if exists public.results          cascade;
drop table if exists public.players          cascade;
drop table if exists public.news_posts       cascade;
drop table if exists public.teams            cascade;

-- ================================================================
-- TABLE : teams
-- Une équipe = une ligne. Ajouter/retirer = INSERT/UPDATE ici.
-- ================================================================
create table public.teams (
  id          uuid        not null default uuid_generate_v4() primary key,
  name        text        not null,
  game        text        not null check (game in ('valorant','lol','rl','cs2','eafc')),
  tag         text,
  description text,
  logo_url    text,
  cover_url   text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

alter table public.teams enable row level security;
create policy "teams_public_read" on public.teams for select using (is_active = true);
create policy "teams_auth_write"  on public.teams for all    using (auth.role() = 'authenticated');

-- ================================================================
-- TABLE : players
-- Lié à une équipe via team_id. Supprimer une équipe → supprime
-- automatiquement ses joueurs (ON DELETE CASCADE).
-- ================================================================
create table public.players (
  id          uuid        not null default uuid_generate_v4() primary key,
  team_id     uuid        not null references public.teams(id) on delete cascade,
  nickname    text        not null,
  real_name   text,
  role        text,
  photo_url   text,
  country     text                 default 'FR',
  social_url  text,
  is_active   boolean     not null default true,
  sort_order  smallint    not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_players_team on public.players(team_id, is_active, sort_order);

alter table public.players enable row level security;
create policy "players_public_read" on public.players for select using (is_active = true);
create policy "players_auth_write"  on public.players for all    using (auth.role() = 'authenticated');

-- ================================================================
-- TABLE : news_posts
-- ================================================================
create table public.news_posts (
  id           uuid        not null default uuid_generate_v4() primary key,
  title        text        not null,
  slug         text        not null unique,
  excerpt      text,
  content      text,
  cover_url    text,
  author       text                 default 'Kensei Esport',
  is_published boolean     not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.news_posts enable row level security;
create policy "news_public_read" on public.news_posts for select using (is_published = true);
create policy "news_auth_write"  on public.news_posts for all    using (auth.role() = 'authenticated');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger news_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

-- ================================================================
-- TABLE : results
-- Résultats de matchs, liés à une équipe (optionnel).
-- ================================================================
create table public.results (
  id          uuid        not null default uuid_generate_v4() primary key,
  team_id     uuid                 references public.teams(id) on delete set null,
  opponent    text        not null,
  score_us    smallint    not null default 0,
  score_them  smallint    not null default 0,
  is_win      boolean     generated always as (score_us > score_them) stored,
  tournament  text,
  stage       text,
  played_at   date        not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.results enable row level security;
create policy "results_public_read" on public.results for select using (true);
create policy "results_auth_write"  on public.results for all    using (auth.role() = 'authenticated');

-- ================================================================
-- TABLE : products
-- Boutique. buy_url = lien externe pour acheter (Shopify, etc.)
-- ================================================================
create table public.products (
  id           uuid        not null default uuid_generate_v4() primary key,
  name         text        not null,
  description  text,
  price        numeric(8,2),
  currency     text        not null default 'EUR',
  image_url    text,
  buy_url      text,
  category     text        not null check (category in ('jerseys','hoodies','accessories','collab')),
  is_available boolean     not null default true,
  sort_order   smallint    not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "products_public_read" on public.products for select using (true);
create policy "products_auth_write"  on public.products for all    using (auth.role() = 'authenticated');

-- ================================================================
-- TABLE : partners
-- ================================================================
create table public.partners (
  id          uuid        not null default uuid_generate_v4() primary key,
  name        text        not null,
  logo_url    text,
  website_url text,
  tier        text                 default 'standard' check (tier in ('premium','standard','supporter')),
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

alter table public.partners enable row level security;
create policy "partners_public_read" on public.partners for select using (is_active = true);
create policy "partners_auth_write"  on public.partners for all    using (auth.role() = 'authenticated');

-- ================================================================
-- TABLE : contact_messages
-- Le formulaire de contact peut insérer sans être connecté.
-- ================================================================
create table public.contact_messages (
  id         uuid        not null default uuid_generate_v4() primary key,
  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
create policy "contact_anon_insert" on public.contact_messages for insert with check (true);
create policy "contact_auth_read"   on public.contact_messages for select using (auth.role() = 'authenticated');
create policy "contact_auth_manage" on public.contact_messages for all    using (auth.role() = 'authenticated');

-- ================================================================
-- EXEMPLE D'UTILISATION (décommenter pour tester)
-- ================================================================
--
-- 1. Créer une équipe :
-- insert into public.teams (name, game, tag) values ('Kensei Valorant', 'valorant', 'KS-VAL');
--
-- 2. Récupérer son ID, puis ajouter un joueur :
-- insert into public.players (team_id, nickname, role, country)
-- select id, 'Player1', 'Duelist', 'FR' from public.teams where tag = 'KS-VAL';
--
-- 3. Ajouter un produit avec lien d'achat :
-- insert into public.products (name, price, buy_url, category, is_available)
-- values ('Maillot Kensei 2025', 49.99, 'https://votreshop.com/maillot', 'jerseys', true);

-- ================================================================
-- ✅ Schéma installé avec succès.
-- ================================================================
