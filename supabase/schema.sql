-- ================================================================
-- KENSEI ESPORT — Supabase Global Schema
-- ================================================================
-- Instructions:
--   1. Ouvrir Supabase Dashboard > SQL Editor > New query
--   2. Coller et exécuter ce fichier en entier
--   3. Les clés (SUPABASE_URL, SUPABASE_ANON_KEY) doivent être
--      ajoutées dans les Secrets GitHub du dépôt (pas dans le code) :
--      Settings > Secrets and variables > Actions > SUPABASE_URL
--      et SUPABASE_ANON_KEY
-- ================================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ================================================================
-- PLAYERS — Joueurs de chaque équipe
-- ================================================================
create table if not exists public.players (
  id          uuid default uuid_generate_v4() primary key,
  pseudo      text not null,
  real_name   text,
  role        text,
  game        text not null check (game in ('valorant','lol','rl','cs2','eafc')),
  image_url   text,
  bio         text,
  nationality text default 'FR',
  is_active   boolean default true not null,
  created_at  timestamptz default now() not null
);
comment on table public.players is 'Roster des joueurs par jeu';

alter table public.players enable row level security;

create policy "players_public_read"  on public.players for select using (is_active = true);
create policy "players_auth_insert"  on public.players for insert with check (auth.role() = 'authenticated');
create policy "players_auth_update"  on public.players for update using  (auth.role() = 'authenticated');
create policy "players_auth_delete"  on public.players for delete using  (auth.role() = 'authenticated');

-- ================================================================
-- NEWS_POSTS — Articles / actualités
-- ================================================================
create table if not exists public.news_posts (
  id           uuid default uuid_generate_v4() primary key,
  title        text not null,
  slug         text unique not null,
  content      text,
  excerpt      text,
  category     text default 'News',
  image_url    text,
  is_published boolean default false not null,
  published_at timestamptz,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);
comment on table public.news_posts is 'Articles publiés sur le site';

alter table public.news_posts enable row level security;

create policy "news_public_read"    on public.news_posts for select using (is_published = true);
create policy "news_auth_all"       on public.news_posts for all    using (auth.role() = 'authenticated');

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger news_posts_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

-- ================================================================
-- RESULTS — Résultats de matchs
-- ================================================================
create table if not exists public.results (
  id             uuid default uuid_generate_v4() primary key,
  game           text not null,
  our_team_name  text not null,
  opponent_name  text not null,
  score_us       integer not null default 0 check (score_us >= 0),
  score_them     integer not null default 0 check (score_them >= 0),
  is_win         boolean generated always as (score_us > score_them) stored,
  tournament     text,
  played_at      timestamptz default now() not null,
  created_at     timestamptz default now() not null
);
comment on table public.results is 'Résultats des matchs officiels';

alter table public.results enable row level security;

create policy "results_public_read"  on public.results for select using (true);
create policy "results_auth_all"     on public.results for all    using (auth.role() = 'authenticated');

-- ================================================================
-- PRODUCTS — Boutique
-- ================================================================
create table if not exists public.products (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  description  text,
  price        numeric(10,2) not null default 0 check (price >= 0),
  category     text check (category in ('jerseys','hoodies','accessories','collab')),
  image_url    text,
  is_available boolean default false not null,
  stock        integer default 0 check (stock >= 0),
  created_at   timestamptz default now() not null
);
comment on table public.products is 'Produits de la boutique';

alter table public.products enable row level security;

create policy "products_public_read"  on public.products for select using (true);
create policy "products_auth_all"     on public.products for all    using (auth.role() = 'authenticated');

-- ================================================================
-- PARTNERS — Partenaires
-- ================================================================
create table if not exists public.partners (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  logo_url    text,
  website_url text,
  is_active   boolean default true not null,
  created_at  timestamptz default now() not null
);
comment on table public.partners is 'Partenaires officiels';

alter table public.partners enable row level security;

create policy "partners_public_read"  on public.partners for select using (is_active = true);
create policy "partners_auth_all"     on public.partners for all    using (auth.role() = 'authenticated');

-- ================================================================
-- CONTACT_MESSAGES — Formulaire de contact
-- ================================================================
create table if not exists public.contact_messages (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  is_read    boolean default false not null,
  created_at timestamptz default now() not null
);
comment on table public.contact_messages is 'Messages reçus via le formulaire de contact';

alter table public.contact_messages enable row level security;

-- Tout le monde peut envoyer un message (formulaire public)
create policy "contact_anon_insert"   on public.contact_messages for insert with check (true);
-- Seuls les admins authentifiés peuvent lire / gérer
create policy "contact_auth_select"   on public.contact_messages for select using (auth.role() = 'authenticated');
create policy "contact_auth_update"   on public.contact_messages for update using (auth.role() = 'authenticated');
create policy "contact_auth_delete"   on public.contact_messages for delete using (auth.role() = 'authenticated');

-- ================================================================
-- SAMPLE DATA (optionnel — supprimer en production)
-- ================================================================
-- insert into public.players (pseudo, real_name, role, game, nationality) values
--   ('StonksMan', 'Jean Dupont', 'Duelist', 'valorant', 'FR'),
--   ('RyZe', 'Marc Leroy', 'Sentinel', 'valorant', 'FR'),
--   ('Kyu', 'Antoine Martin', 'Controller', 'valorant', 'FR'),
--   ('Neska', 'Lucas Bernard', 'Initiator', 'valorant', 'FR'),
--   ('Raiichud', 'Hugo Petit', 'Flex', 'valorant', 'FR');
