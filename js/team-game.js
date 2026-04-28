import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { supabase } from './auth.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const gameSlug = document.body.dataset.game; // 'lol', 'rl', 'eva', etc.

const GAME_LABELS = {
  lol:      'League of Legends',
  rl:       'Rocket League',
  eva:      'EVA',
  valorant: 'Valorant',
  cs2:      'CS2',
  eafc:     'EA FC',
};

async function loadTeam() {
  const grid = document.getElementById('rosterGrid');
  if (!gameSlug) {
    grid.innerHTML = '<p class="placeholder">Jeu non spécifié.</p>';
    return;
  }

  const { data: teams, error: teamErr } = await supabase
    .from('teams')
    .select('*')
    .eq('game', gameSlug)
    .limit(1);

  if (teamErr || !teams?.length) {
    grid.innerHTML = '<p class="placeholder">Équipe non trouvée.</p>';
    return;
  }

  const team = teams[0];

  const { data: players, error: playerErr } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', team.id)
    .order('role');

  if (playerErr || !players?.length) {
    grid.innerHTML = '<p class="placeholder">Aucun joueur pour le moment.</p>';
    return;
  }

  grid.innerHTML = players.map(p => {
    const initials = (p.nickname ?? '?').slice(0, 2).toUpperCase();
    const imgHtml = p.photo_url
      ? `<img class="player-card__img" src="${p.photo_url}" alt="${p.nickname}" loading="lazy" />`
      : `<div class="player-card__placeholder"><span>${initials}</span></div>`;
    return `
    <div class="player-card">
      <div class="player-card__img-wrap">
        ${imgHtml}
        ${p.role ? `<span class="player-card__badge">${p.role}</span>` : ''}
      </div>
      <div class="player-card__body">
        <p class="player-card__pseudo">${p.nickname ?? ''}</p>
        ${p.role      ? `<p class="player-card__role">${p.role}</p>` : ''}
        ${p.real_name ? `<p class="player-card__name">${p.real_name}</p>` : ''}
      </div>
    </div>`;
  }).join('');
}

loadTeam();
