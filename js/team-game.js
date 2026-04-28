import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { supabase } from './auth.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const gameSlug = document.body.dataset.game; // 'lol' or 'rl'

const GAME_LABELS = {
  lol: 'League of Legends',
  rl:  'Rocket League',
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

  grid.innerHTML = players.map(p => `
    <div class="player-card">
      <div class="player-card__avatar">
        ${p.avatar_url
          ? `<img src="${p.avatar_url}" alt="${p.pseudo}" loading="lazy" />`
          : `<span>${p.pseudo.charAt(0).toUpperCase()}</span>`}
      </div>
      <div class="player-card__info">
        <p class="player-card__pseudo">${p.pseudo}</p>
        ${p.role   ? `<p class="player-card__role">${p.role}</p>` : ''}
        ${p.full_name ? `<p class="player-card__name">${p.full_name}</p>` : ''}
      </div>
    </div>
  `).join('');
}

loadTeam();
