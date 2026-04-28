import { supabase, requireAuth, logout, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';
import { initNavbar } from './navbar.js';

applyTranslations();

const session = await requireAuth('/pages/login.html');
const user    = session.user;

initNavbar();
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const GAME_LABELS = {
  valorant: 'Valorant',
  lol:      'League of Legends',
  rl:       'Rocket League',
  cs2:      'CS2',
  eafc:     'EA Sports FC',
};

// Load fan profile
const { data: profile } = await supabase
  .from('fan_profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

if (!profile) { window.location.href = '/pages/setup.html'; }

const displayName = escapeHtml(profile.display_name || profile.username || user.email.split('@')[0]);
const username    = escapeHtml(profile.username);

// Greeting
const greetEl = document.getElementById('dashGreeting');
if (greetEl) greetEl.textContent = 'Bienvenue, ' + displayName;

// Navbar username
const dashUsernameEl = document.getElementById('dashUsername');
if (dashUsernameEl) dashUsernameEl.textContent = displayName;

// Fan ID: KS-YYYY-XXXXXX
const fanYear  = new Date(profile.fan_since || profile.created_at).getFullYear();
const fanHex   = user.id.replace(/-/g, '').substring(0, 6).toUpperCase();
const fanId    = `KS-${fanYear}-${fanHex}`;

const fanIdEl = document.getElementById('fanIdBadge');
if (fanIdEl) fanIdEl.textContent = fanId;

// Avatar initials
const avatarEl = document.getElementById('fanCardAvatar');
if (avatarEl) {
  if (profile.avatar_url) {
    avatarEl.innerHTML = `<img src="${profile.avatar_url}" alt="${username}" />`;
  } else {
    const initial = (profile.display_name || profile.username || '?').charAt(0).toUpperCase();
    avatarEl.innerHTML = `<span>${escapeHtml(initial)}</span>`;
  }
}

// Username & display name
const usernameEl    = document.getElementById('fanCardUsername');
const displayNameEl = document.getElementById('fanCardDisplayName');
if (usernameEl)    usernameEl.textContent    = '@' + username;
if (displayNameEl) displayNameEl.textContent = displayName;

// Fan since
const sinceEl = document.getElementById('fanCardSince');
if (sinceEl) {
  const d = new Date(profile.fan_since || profile.created_at);
  sinceEl.textContent = 'Fan depuis ' + d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Fav game
const gameEl = document.getElementById('fanCardGame');
if (gameEl) {
  gameEl.textContent = GAME_LABELS[profile.favorite_game] ?? '—';
}

// QR code via api.qrserver.com
const profileUrl = `https://kensei-esport.github.io/pages/fan.html?u=${encodeURIComponent(profile.username)}`;
const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=6&data=${encodeURIComponent(profileUrl)}`;
const qrImg = document.getElementById('fanQrImg');
if (qrImg) qrImg.src = qrUrl;

// Public link
const pubLink = document.getElementById('fanPublicLink');
if (pubLink) {
  pubLink.href        = profileUrl;
  pubLink.textContent = profileUrl.replace('https://', '');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logout();
    window.location.href = '/index.html';
  });
}
