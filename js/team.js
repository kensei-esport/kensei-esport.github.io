/**
 * team.js — Page d'une équipe individuelle
 * Lit l'UUID depuis ?id=... dans l'URL, charge l'équipe + roster via Supabase.
 * Schéma v3+ : tables teams, team_members → players
 *
 * NB : main.js est chargé avant ce fichier sur team.html,
 *      donc initNavbar/applyTranslations/js-year sont déjà gérés.
 */
import { supabase, escapeHtml } from './auth.js';

const GAME_LABELS = {
  lol:      'League of Legends',
  rl:       'Rocket League',
  eva:      'EVA',
  valorant: 'Valorant',
  cs2:      'CS2',
  eafc:     'EA FC',
  staff:    'Organisation',
};

const GAME_IMAGES = {
  valorant: '/assets/images/valo_logo.png',
  eva:      '/assets/images/games/eva.png',
  lol:      '/assets/images/games/lol.png',
  rl:       '/assets/images/games/rl.png',
  cs2:      '/assets/images/games/cs2.png',
  eafc:     '/assets/images/games/eafc.png',
};

async function loadTeam() {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('id');
  const grid   = document.getElementById('rosterGrid');

  if (!teamId) {
    setHeaderError('Équipe introuvable');
    if (grid) grid.innerHTML = '<p class="placeholder">Aucune équipe sélectionnée.</p>';
    return;
  }

  // ── 1. Charger les infos de l'équipe ─────────────────────────
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('id, name, game, tag, description, logo_url')
    .eq('id', teamId)
    .eq('is_active', true)
    .single();

  if (teamErr || !team) {
    setHeaderError('Équipe introuvable');
    if (grid) grid.innerHTML = '<p class="placeholder">Équipe non trouvée ou inactive.</p>';
    return;
  }

  // ── 2. Mettre à jour l'en-tête ───────────────────────────────
  const gameLabel = GAME_LABELS[team.game] || team.game;

  document.title = escapeHtml(team.name) + ' — Kensei Esport';
  setMetaContent('pageDesc', `Roster de l'équipe ${team.name} — Kensei Esport.`);

  setText('teamName',        team.name);
  setText('teamGame',        gameLabel);
  setText('breadcrumbTeam',  team.name);

  const iconEl  = document.getElementById('teamIcon');
  const rawLogo = team.logo_url || '';
  const logoSrc = (rawLogo.startsWith('http') || rawLogo.startsWith('/assets'))
    ? rawLogo
    : (GAME_IMAGES[team.game] || null);
  if (iconEl && logoSrc) {
    iconEl.innerHTML =
      `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(team.name)}" `
      + `width="64" height="64" style="object-fit:contain" />`;
  }

  if (team.description) {
    const wrap = document.getElementById('teamDescWrap');
    const desc = document.getElementById('teamDesc');
    if (wrap) wrap.style.display = '';
    if (desc) desc.textContent = team.description;
  }

  // ── 3. Charger le roster directement depuis players ──────────
  const { data: players, error: playerErr } = await supabase
    .from('players')
    .select('id, nickname, real_name, photo_url, country, social_url, role, user_id')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order');

  if (playerErr || !players?.length) {
    if (grid) grid.innerHTML = '<p class="placeholder">Roster en cours de construction.</p>';
    return;
  }

  if (grid) {
    grid.innerHTML = players.map(p => renderPlayerCard(p)).join('');
  }
}

function renderPlayerCard(p) {
  const initials   = (p.nickname ?? '?').slice(0, 2).toUpperCase();
  const imgHtml    = p.photo_url
    ? `<img class="player-card__img" src="${escapeHtml(p.photo_url)}" `
      + `alt="${escapeHtml(p.nickname ?? '')}" loading="lazy" />`
    : `<div class="player-card__placeholder"><span>${escapeHtml(initials)}</span></div>`;

  const badgeHtml    = p.role       ? `<span class="player-card__badge">${escapeHtml(p.role)}</span>` : '';
  const realNameHtml = p.real_name  ? `<div class="player-card__name">${escapeHtml(p.real_name)}</div>` : '';
  const countryHtml  = p.country    ? `<div class="player-card__role">${escapeHtml(p.country)}</div>`  : '';
  const socialHtml   = p.social_url
    ? `<a class="player-card__social" href="${escapeHtml(p.social_url)}" `
      + `target="_blank" rel="noopener noreferrer" aria-label="Profil social">&#x1F517;</a>`
    : '';

  return `
  <div class="player-card">
    <div class="player-card__img-wrap">${imgHtml}${badgeHtml}</div>
    <div class="player-card__body">
      <div class="player-card__pseudo">${escapeHtml(p.nickname ?? '')}</div>
      ${realNameHtml}${countryHtml}${socialHtml}
    </div>
  </div>`;
}

// ── Helpers ──────────────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setMetaContent(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('content', value);
}
function setHeaderError(msg) {
  setText('teamName', msg);
  setText('teamGame',  '');
}

loadTeam();
