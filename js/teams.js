/**
 * teams.js — Chargement dynamique du roster depuis Supabase
 * Schéma v2 : table teams (is_active) + players (team_id FK → teams.id)
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Correspond game → ID de la section HTML dans teams.html
var GAME_SECTION = {
  valorant: 'rosterValorant',
  lol:      'rosterLoL',
  rl:       'rosterRL',
  cs2:      'rosterCS2',
  eafc:     'rosterFIFA'
};

(async function () {
  // 1. Charger toutes les équipes actives
  var teamsRes = await supabase
    .from('teams')
    .select('id, name, game, tag, description')
    .eq('is_active', true)
    .order('created_at');

  if (teamsRes.error) {
    console.error('[teams] Erreur chargement équipes', teamsRes.error);
    return;
  }

  var teams = teamsRes.data || [];

  // 2. Charger tous les joueurs actifs en une seule requête
  var playersRes = await supabase
    .from('players')
    .select('id, team_id, nickname, real_name, role, photo_url, country, social_url, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  var allPlayers = playersRes.data || [];

  // Grouper les joueurs par team_id
  var playersByTeam = {};
  allPlayers.forEach(function (p) {
    if (!playersByTeam[p.team_id]) playersByTeam[p.team_id] = [];
    playersByTeam[p.team_id].push(p);
  });

  // 3. Remplir chaque section du roster
  teams.forEach(function (team) {
    var sectionId = GAME_SECTION[team.game];
    if (!sectionId) return;

    var container = document.getElementById(sectionId);
    if (!container) return;

    var players = playersByTeam[team.id] || [];

    if (!players.length) {
      container.innerHTML = '<p class="placeholder">Roster en cours de construction.</p>';
      return;
    }

    container.innerHTML = players.map(function (p) {
      var imgHtml = p.photo_url
        ? '<img class="player-card__img" src="' + escapeHtml(p.photo_url) + '" alt="' + escapeHtml(p.nickname) + '" loading="lazy" />'
        : '<div class="player-card__img player-card__img--placeholder"></div>';

      var badgeHtml = p.role
        ? '<span class="player-card__badge">' + escapeHtml(p.role) + '</span>'
        : '';

      var nameHtml = p.real_name
        ? '<div class="player-card__name">' + escapeHtml(p.real_name) + '</div>'
        : '';

      var countryHtml = p.country
        ? '<div class="player-card__role">' + escapeHtml(p.country) + '</div>'
        : '';

      var socialHtml = p.social_url
        ? '<a class="player-card__social" href="' + escapeHtml(p.social_url) + '" target="_blank" rel="noopener noreferrer" aria-label="Profil social">&#x1F517;</a>'
        : '';

      return '<div class="player-card">'
        + '<div class="player-card__img-wrap">' + imgHtml + badgeHtml + '</div>'
        + '<div class="player-card__body">'
        + '<div class="player-card__pseudo">' + escapeHtml(p.nickname) + '</div>'
        + nameHtml
        + countryHtml
        + socialHtml
        + '</div>'
        + '</div>';
    }).join('');
  });
}());
