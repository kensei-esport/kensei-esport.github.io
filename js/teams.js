/**
 * teams.js — Chargement dynamique du roster depuis Supabase
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

var GAME_MAP = {
  valorant: 'rosterValorant',
  lol:      'rosterLoL',
  rl:       'rosterRL',
  cs2:      'rosterCS2',
  eafc:     'rosterFIFA'
};

(async function () {
  var { data, error } = await supabase
    .from('players')
    .select('id, pseudo, real_name, role, game, image_url, nationality')
    .eq('is_active', true)
    .order('game')
    .order('pseudo');

  if (error) {
    console.error('[teams] Supabase error', error);
  }

  var players = data || [];

  Object.keys(GAME_MAP).forEach(function (game) {
    var containerId = GAME_MAP[game];
    var container = document.getElementById(containerId);
    if (!container) return;

    var gamePlayers = players.filter(function (p) { return p.game === game; });

    if (!gamePlayers.length) {
      container.innerHTML = '<p class="placeholder">Roster en cours de construction.</p>';
      return;
    }

    container.innerHTML = gamePlayers.map(function (p) {
      var imgHtml = p.image_url
        ? '<img class="player-card__img" src="' + escapeHtml(p.image_url) + '" alt="' + escapeHtml(p.pseudo) + '" loading="lazy" />'
        : '';
      var badgeHtml = p.role
        ? '<span class="player-card__badge">' + escapeHtml(p.role) + '</span>'
        : '';
      var nameHtml = p.real_name
        ? '<div class="player-card__name">' + escapeHtml(p.real_name) + '</div>'
        : '';
      var natHtml = p.nationality
        ? '<div class="player-card__role">' + escapeHtml(p.nationality) + '</div>'
        : '';

      return '<div class="player-card">'
        + '<div class="player-card__img-wrap">' + imgHtml + badgeHtml + '</div>'
        + '<div class="player-card__body">'
        + '<div class="player-card__pseudo">' + escapeHtml(p.pseudo) + '</div>'
        + nameHtml
        + natHtml
        + '</div>'
        + '</div>';
    }).join('');
  });
}());
