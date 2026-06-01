-- ================================================================
-- KENSEI ESPORT — Migration Succès & Points
-- ================================================================
-- Ajoute :
--   • colonne points dans fan_profiles
--   • table achievements (succès prédéfinis)
--   • table user_achievements (succès gagnés par user)
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Ajouter la colonne points à fan_profiles (si absente)
alter table public.fan_profiles
  add column if not exists points integer not null default 0;

-- index pour le classement
create index if not exists fan_profiles_points_idx
  on public.fan_profiles (points desc);

-- 2. Table des succès prédéfinis (catalogue)
create table if not exists public.achievements (
  id          text        primary key,           -- ex: 'first_login'
  name        text        not null,
  description text        not null,
  icon        text        not null default '🏆', -- emoji
  pts_reward  integer     not null default 0,
  category    text        not null default 'general'
              check (category in ('general','social','support','competitive')),
  sort_order  integer     not null default 0
);

alter table public.achievements enable row level security;
create policy "achievements_public_read" on public.achievements for select using (true);
create policy "achievements_auth_write"  on public.achievements for all    using (auth.role() = 'authenticated');

-- 3. Succès gagnés par utilisateur
create table if not exists public.user_achievements (
  id             uuid        not null default uuid_generate_v4() primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  achievement_id text        not null references public.achievements(id),
  earned_at      timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "ua_public_read"  on public.user_achievements for select using (true);
create policy "ua_own_insert"   on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "ua_own_delete"   on public.user_achievements for delete using  (auth.uid() = user_id);

-- 4. Insérer le catalogue de succès
insert into public.achievements (id, name, description, icon, pts_reward, category, sort_order) values
  -- Général
  ('first_login',     'Première connexion',       'Tu as créé ton profil Ultra Kensei.',                       '🎮', 50,  'general',      1),
  ('week_1',          'Fan de la première heure',  'Inscrit dans la première semaine du lancement.',           '⚡', 100, 'general',      2),
  ('profile_full',    'Profil complet',            'Tu as rempli toutes les infos de ton profil.',             '✅', 25,  'general',      3),
  ('initie',          'Initié',                    'Tu as atteint le niveau Initié (0–499 pts).',              '🥉', 0,   'general',      4),
  ('supporter',       'Supporter',                 'Tu as atteint le niveau Supporter (500 pts).',             '🥈', 0,   'general',      5),
  ('ultra',           'Ultrà',                     'Tu as atteint le niveau Ultrà (2 000 pts).',               '🥇', 0,   'general',      6),
  ('legende',         'Légende',                   'Tu as atteint le niveau Légende (5 000 pts).',             '💎', 0,   'general',      7),
  -- Social
  ('discord_joined',  'Dans la place',             'Tu as rejoint le serveur Discord officiel Kensei.',        '💬', 50,  'social',       10),
  ('first_share',     'Ambassadeur débutant',      'Tu as partagé un contenu Kensei pour la première fois.',   '📣', 25,  'social',       11),
  ('share_x5',        'Machine à partager',        'Tu as partagé 5 contenus Kensei.',                         '🚀', 75,  'social',       12),
  ('twitch_watch',    'Supporter live',            'Tu as regardé un stream Kensei sur Twitch.',               '📺', 10,  'social',       13),
  ('twitch_x3',       'Fidèle du stream',          'Tu as regardé 3 streams Kensei ce mois-ci.',              '🎯', 200, 'social',       14),
  ('recruit_1',       'Parrain',                   'Tu as recruté un ami dans les Ultras.',                    '🤝', 300, 'social',       15),
  -- Support
  ('first_purchase',  'Premier achat',             'Tu as acheté un article officiel Kensei.',                 '🛍️', 250, 'support',      20),
  ('first_donation',  'Donateur',                  'Tu as fait un don à l\'équipe.',                           '❤️', 100, 'support',      21),
  ('big_donation',    'Grand donateur',            'Tu as fait un don de 50€ ou plus.',                        '💸', 500, 'support',      22),
  ('collector',       'Collectionneur',            'Tu as acheté 3 articles ou plus.',                         '🏅', 150, 'support',      23),
  -- Compétitif
  ('tournament_1',    'Dans l\'arène',             'Tu as assisté à ton premier tournoi Kensei.',              '🏆', 100, 'competitive',  30),
  ('tournament_x3',   'Ultra fidèle',              'Tu as assisté à 3 tournois Kensei.',                       '🔥', 300, 'competitive',  31),
  ('challenge_1',     'Releveur de défis',         'Tu as complété ton premier défi mensuel.',                 '⚡', 50,  'competitive',  32),
  ('challenge_x5',    'Chasseur de défis',         'Tu as complété 5 défis mensuels.',                         '💥', 200, 'competitive',  33),
  ('top10',           'Top 10',                    'Tu es dans le top 10 du classement Ultras.',               '👑', 0,   'competitive',  34),
  ('top3',            'Podium',                    'Tu es dans le top 3 du classement Ultras.',                '🌟', 0,   'competitive',  35)
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  pts_reward  = excluded.pts_reward,
  category    = excluded.category,
  sort_order  = excluded.sort_order;

-- ================================================================
-- ✅ Migration achievements installée avec succès.
-- ================================================================
