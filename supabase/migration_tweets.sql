-- ================================================================
-- KENSEI ESPORT — Migration : table tweets
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ================================================================

create table if not exists public.tweets (
  id          uuid default uuid_generate_v4() primary key,
  tweet_id    text,                        -- ID du tweet sur X (optionnel, pour lien direct)
  text        text not null,              -- Contenu du tweet
  photo_url   text,                       -- URL image (optionnel)
  likes       integer not null default 0,
  retweets    integer not null default 0,
  posted_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

comment on table public.tweets is 'Tweets manuellement saisis depuis le dashboard pour affichage sur la homepage.';

alter table public.tweets enable row level security;

-- Lecture publique
create policy "tweets_public_read" on public.tweets
  for select using (true);

-- Écriture authentifiée seulement
create policy "tweets_auth_write" on public.tweets
  for all using (auth.role() = 'authenticated');

-- Index pour trier par date de post
create index if not exists tweets_posted_at_idx on public.tweets (posted_at desc);
