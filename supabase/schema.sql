-- ================================================================
-- KENSEI ESPORT — Supabase Schema v2
-- ================================================================
-- Instructions:
--   1. Ouvrir Supabase Dashboard > SQL Editor > New query
--   2. Coller et exécuter ce fichier en entier (première installation)
--   3. Les clés doivent être dans les GitHub Secrets du dépôt :
--      Settings > Secrets and variables > Actions
--        → SUPABASE_URL      (ex: https://abcdefgh.supabase.co)
--        → SUPABASE_ANON_KEY (ex: eyJhbGc...)
--   NE JAMAIS mettre ces valeurs dans le code ou les commits.
-- ================================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ================================================================
-- TEAMS — Table des équipes (une ligne = une équipe)
-- Pour ajouter une équipe : INSERT INTO teams ...
-- Pour la retirer :         UPDATE teams SET is_active = false WHERE id = '...'
-- ================================================================
create table if not exists public.teams (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,                        -- "Kensei Valorant"
  game        text not null check (game in ('valorant','lol','rl','cs2','eafc')),
  tag         text,                                 -- tag court, ex: "KS-VAL"
  description text,
  logo_url    text,                                 -- URL image logo de l'équipe
  cover_url   text,                                 -- URL bannière/cover
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table  public.teams      is 'Équipes de Kensei Esport. is_active=false pour masquer sans supprimer.';
comment on column public.teams.game is 'valorant | lol | rl | cs2 | eafc';

alter table public.teams enable row level security;

create policy "teams_public_read" on public.teams for select using (is_active = true);
create policy "teams_auth_all"    on public.teams for all    using (auth.role() = 'authenticated');

-- ================================================================
-- PLAYERS — Joueurs liés à une équipe via team_id (FK)
-- Supprimer une équipe supprime automatiquement ses joueurs (CASCADE)
-- ================================================================
create table if not exists public.players (
  id          uuid default uuid_generate_v4() primary key,
  team_id     uuid not null references public.teams(id) on delete cascade,
  nickname    text not null,                        -- pseudo du joueur
  real_name   text,                                 -- prénom nom réel (optionnel)
  role        text,                                 -- ex: "Duelist", "IGL", "Keeper"
  photo_url   text,                                 -- URL photo du joueur
  country     text default 'FR',                   -- code pays ISO 2 lettres
  social_url  text,                                 -- lien Twitter/X ou autre réseau
  is_active   boolean not null default true,
  sort_order  smallint not null default 0,          -- ordre d'affichage dans le roster
  created_at  timestamptz not null default now()
);

comment on table public.players is 'Joueurs. team_id FK → teams.id. CASCADE : supprimer l''équipe supprime les joueurs.';

create index if not exists idx_players_team_id on public.players(team_id);
create index if not exists idx_players_active  on public.players(team_id, is_active, sort_order);

alter table public.players enable row level security;

create policy "players_public_read" on public.players for select using (is_active = true);
create policy "players_auth_all"    on public.players for all    using (auth.role() = 'authenticated');

-- ================================================================
-- NEWS_POSTS — Articles / actualités
-- ================================================================
create table if not exists public.news_posts (
  id           uuid default uuid_generate_v4() primary key,
  title        text not null,
  slug         text unique not null,
  content      text,
  excerpt      text,
  cover_url    text,                                -- URL image de couverture
  author       text default 'Kensei Esport',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.news_posts enable row level security;

create policy "news_public_read" on public.news_posts for select using (is_published = true);
create policy "news_auth_all"    on public.news_posts for all    using (auth.role() = 'authenticated');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger news_posts_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

-- ================================================================
-- RESULTS — Résultats des matchs (liés à une équipe)
-- ================================================================
create table if not exists public.results (
  id          uuid default uuid_generate_v4() primary key,
  team_id     uuid references public.teams(id) on delete set null,
  opponent    text not null,                        -- nom de l'équipe adverse
  score_us    smallint not null default 0,
  score_them  smallint not null default 0,
  is_win      boolean generated always as (score_us > score_them) stored,
  tournament  text,                                 -- nom du tournoi
  stage       text,                                 -- "Finale", "Groupe A", etc.
  played_at   date not null default current_date,
  created_at  timestamptz not null default now()
);

comment on column public.results.is_win is 'Calculé automatiquement : score_us > score_them';

alter table public.results enable row level security;

create policy "results_public_read" on public.results for select using (true);
create policy "results_auth_all"    on public.results for all    using (auth.role() = 'authenticated');

-- ================================================================
-- PRODUCTS — Articles de la boutique avec lien d'achat externe
-- ================================================================
create table if not exists public.products (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  description  text,
  price        numeric(8,2),
  currency     text not null default 'EUR',
  image_url    text,                                -- URL photo du produit
  buy_url      text,                                -- lien externe d'achat (Shopify, Printful, etc.)
  category     text not null check (category in ('jerseys','hoodies','accessories','collab')),
  is_available boolean not null default true,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);

comment on column public.products.buy_url is 'Lien vers page d''achat externe. Laisser NULL si pas encore disponible.';

alter table public.products enable row level security;

create policy "products_public_read" on public.products for select using (true);
create policy "products_auth_all"    on public.products for all    using (auth.role() = 'authenticated');

-- ================================================================
-- PARTNERS — Partenaires de l'organisation
-- ================================================================
create table if not exists public.partners (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  logo_url    text,
  website_url text,
  tier        text default 'standard' check (tier in ('premium','standard','supporter')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.partners enable row level security;

create policy "partners_public_read" on public.partners for select using (is_active = true);
create policy "partners_auth_all"    on public.partners for all    using (auth.role() = 'authenticated');

-- ================================================================
-- CONTACT_MESSAGES — Formulaire de contact
-- ================================================================
create table if not exists public.contact_messages (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_anon_insert"  on public.contact_messages for insert with check (true);
create policy "contact_auth_select"  on public.contact_messages for select using (auth.role() = 'authenticated');
create policy "contact_auth_manage"  on public.contact_messages for all    using (auth.role() = 'authenticated');

-- ================================================================
-- DONNÉES D'EXEMPLE — Décommenter pour tester
-- ================================================================
-- -- Créer une équipe Valorant
-- insert into public.teams (name, game, tag, description)
-- values ('Kensei Valorant', 'valorant', 'KS-VAL', 'Notre équipe Valorant compétitive.');
--
-- -- Ajouter un joueur (remplacer <team-uuid> par l'UUID obtenu ci-dessus)
-- insert into public.players (team_id, nickname, role, country, sort_order)
-- values ('<team-uuid>', 'PlayerOne', 'Duelist', 'FR', 1);
--
-- -- Ajouter un produit avec lien d'achat
-- insert into public.products (name, price, buy_url, category)
-- values ('Maillot Kensei 2025', 49.99, 'https://shop.exemple.com/maillot', 'jerseys');
