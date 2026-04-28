import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { supabase, escapeHtml } from './auth.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const GAME_LABELS = {
  valorant: 'Valorant',
  lol:      'League of Legends',
  rl:       'Rocket League',
  cs2:      'CS2',
  eafc:     'EA Sports FC',
};

const params   = new URLSearchParams(window.location.search);
const username = params.get('u');
const wrap     = document.getElementById('fanProfileWrap');

if (!username) {
  wrap.innerHTML = '<p class="placeholder">Profil non trouvé.</p>';
} else {
  // Sanitise: allow only alphanumeric, underscore, dash
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 32);

  const { data: profile, error } = await supabase
    .from('fan_profiles')
    .select('user_id, username, display_name, avatar_url, favorite_game, fan_since, created_at')
    .eq('username', safeUsername)
    .maybeSingle();

  if (error || !profile) {
    wrap.innerHTML = '<p class="placeholder">Profil introuvable.</p>';
  } else {
    const displayName = escapeHtml(profile.display_name || profile.username);
    const uname       = escapeHtml(profile.username);

    // Fan ID
    const fanYear = new Date(profile.fan_since || profile.created_at).getFullYear();
    const fanHex  = profile.user_id.replace(/-/g, '').substring(0, 6).toUpperCase();
    const fanId   = `KS-${fanYear}-${fanHex}`;

    // Dates
    const sinceDate = new Date(profile.fan_since || profile.created_at)
      .toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    // Avatar
    const avatarHtml = profile.avatar_url
      ? `<img src="${profile.avatar_url}" alt="${uname}" />`
      : `<span>${escapeHtml((profile.display_name || profile.username || '?').charAt(0).toUpperCase())}</span>`;

    // Game
    const gameLabel = GAME_LABELS[profile.favorite_game] ?? '—';

    // No QR on the public page (avoids infinite recursion)
    wrap.innerHTML = `
      <div class="fan-card">
        <div class="fan-card__header">
          <img class="fan-card__logo" src="/assets/images/orange_logo.png" alt="Kensei" />
          <span class="fan-card__org">KENSEI ESPORT</span>
          <span class="fan-card__badge">${escapeHtml(fanId)}</span>
        </div>
        <div class="fan-card__body">
          <div class="fan-card__avatar">${avatarHtml}</div>
          <div class="fan-card__info">
            <div class="fan-card__username">@${uname}</div>
            <div class="fan-card__displayname">${displayName}</div>
            <div class="fan-card__meta">
              <span class="fan-card__since">Fan depuis ${escapeHtml(sinceDate)}</span>
              <span class="fan-card__game">${escapeHtml(gameLabel)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Update page title
    document.title = `Profil fan @${uname} — Kensei Esport`;
  }
}
