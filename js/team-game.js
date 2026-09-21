import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { supabase, escapeHtml } from './auth.js';
import { initPlayerModal, bindPlayerCards } from './player-modal.js';

applyTranslations();
initNavbar();
initPlayerModal();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const gameSlug = document.body.dataset.game;

const GAME_LABELS = {
  lol:      'League of Legends',
  rl:       'Rocket League',
  eva:      'EVA',
  valorant: 'Valorant',
  cs2:      'CS2',
  eafc:     'EA FC',
  staff:    'Organisation',
};

async function loadRoster(teamId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('role, sort_order, jersey_number, players (id, nickname, real_name, photo_url, country, social_url, description)')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order');

  if (!error && data?.length) {
    return data
      .filter(tm => tm.players)
      .map(tm => ({
        ...tm.players,
        role: tm.role,
        jersey_number: tm.jersey_number,
      }));
  }

  const fallback = await supabase
    .from('players')
    .select('id, nickname, real_name, photo_url, country, social_url, description, role')
    .eq('team_id', teamId)
    .eq('is_active', true);

  return fallback.data || [];
}

function renderPlayerCard(p) {
  const initials = (p.nickname ?? '?').slice(0, 2).toUpperCase();
  const imgHtml = p.photo_url
    ? `<img class="player-card__img" src="${escapeHtml(p.photo_url)}" alt="${escapeHtml(p.nickname ?? '')}" loading="lazy" />`
    : `<div class="player-card__placeholder"><span>${escapeHtml(initials)}</span></div>`;
  return `
    <button type="button" class="player-card" data-player-id="${escapeHtml(String(p.id))}">
      <div class="player-card__img-wrap">
        ${imgHtml}
        ${p.role ? `<span class="player-card__badge">${escapeHtml(p.role)}</span>` : ''}
      </div>
      <div class="player-card__body">
        <p class="player-card__pseudo">${escapeHtml(p.nickname ?? '')}</p>
        ${p.role      ? `<p class="player-card__role">${escapeHtml(p.role)}</p>` : ''}
        ${p.real_name ? `<p class="player-card__name">${escapeHtml(p.real_name)}</p>` : ''}
      </div>
    </button>`;
}

async function loadTeam() {
  const grid = document.getElementById('rosterGrid');
  if (!grid) return;
  if (!gameSlug) {
    grid.innerHTML = '<p class="placeholder">Jeu non spécifié.</p>';
    return;
  }

  const { data: teams, error: teamErr } = await supabase
    .from('teams')
    .select('*')
    .eq('game', gameSlug)
    .eq('is_active', true)
    .order('name');

  if (teamErr || !teams?.length) {
    grid.innerHTML = '<p class="placeholder">Équipe non trouvée.</p>';
    return;
  }

  const allPlayers = [];
  const sections = [];

  for (const team of teams) {
    const players = await loadRoster(team.id);
    allPlayers.push(...players);
    if (!players.length) continue;
    sections.push({ team, players });
  }

  if (!sections.length) {
    grid.innerHTML = '<p class="placeholder">Aucun joueur pour le moment.</p>';
    return;
  }

  if (sections.length === 1) {
    grid.classList.add('roster-grid');
    grid.classList.remove('roster-stack');
    grid.innerHTML = sections[0].players.map(renderPlayerCard).join('');
  } else {
    grid.classList.remove('roster-grid');
    grid.classList.add('roster-stack');
    grid.innerHTML = sections.map(s =>
      `<div>
        <h3 class="roster-team-name">${escapeHtml(s.team.name)}</h3>
        <div class="roster-grid">${s.players.map(renderPlayerCard).join('')}</div>
      </div>`
    ).join('');
  }

  bindPlayerCards(grid, allPlayers);
}

loadTeam();
