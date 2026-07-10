/**
 * teams.js — Page listant toutes les équipes actives
 * Charge les équipes depuis Supabase et génère les cartes dynamiquement.
 * Chaque carte redirige vers team.html?id=<UUID>
 * Schéma v3+ : table teams avec colonne logo_url
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

var GAME_LABELS = {
  lol:      'League of Legends',
  rl:       'Rocket League',
  eva:      'EVA',
  valorant: 'Valorant',
  cs2:      'CS2',
  eafc:     'EA FC',
  staff:    'Organisation',
};

var GAME_IMAGES = {
  valorant: '/assets/images/valo_logo.png',
  eva:      '/assets/images/games/eva.png',
  lol:      '/assets/images/games/lol.png',
  rl:       '/assets/images/games/rl.png',
  cs2:      '/assets/images/games/cs2.png',
  eafc:     '/assets/images/games/eafc.png',
};

(async function () {
  var grid = document.getElementById('teamsGrid');
  if (!grid) return;

  var res = await supabase
    .from('teams')
    .select('id, name, game, tag, description, logo_url')
    .eq('is_active', true)
    .order('game')
    .order('name');

  if (res.error || !res.data || !res.data.length) {
    grid.innerHTML = '<p class="placeholder">Aucune équipe trouvée.</p>';
    return;
  }

  grid.innerHTML = res.data.map(function (team) {
    var gameLabel = GAME_LABELS[team.game] || team.game;
    var rawLogo   = team.logo_url || '';
    var logoSrc   = (rawLogo.startsWith('http') || rawLogo.startsWith('/assets'))
      ? rawLogo
      : (GAME_IMAGES[team.game] || '');

    var logoHtml = logoSrc
      ? '<img src="' + escapeHtml(logoSrc) + '" alt="' + escapeHtml(team.name) + '" width="88" height="88" style="object-fit:contain" />'
      : '<span style="display:flex;align-items:center;justify-content:center;width:64px;height:64px;background:var(--clr-surface);border-radius:50%;border:2px solid var(--clr-primary)">'
        + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" stroke-width="2">'
        + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>';

    var tagHtml = team.tag
      ? '<p style="color:var(--text-muted);font-size:.85rem;margin:.25rem 0 0">' + escapeHtml(team.tag) + '</p>'
      : '';

    return '<a href="/pages/team.html?id=' + escapeHtml(team.id) + '" '
      + 'class="dash-card" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:1rem;padding:2.5rem;">'
      + logoHtml
      + '<div style="text-align:center">'
      + '<p class="section__label">' + escapeHtml(gameLabel) + '</p>'
      + '<h3 style="margin:0">' + escapeHtml(team.name) + '</h3>'
      + tagHtml
      + '</div>'
      + '<span class="btn btn--ghost" style="margin-top:auto">Voir l\'équipe</span>'
      + '</a>';
  }).join('');
}());
