import { supabase, requireAuth, logout, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';

applyTranslations();

const session = await requireAuth('/pages/login.html');
const user    = session.user;

// Year
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

// Load fan profile
const { data: profile } = await supabase
  .from('fan_profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

// If no profile → setup
if (!profile) { window.location.href = '/pages/setup.html'; }

const displayName = profile?.display_name || profile?.username || user.email.split('@')[0];

// Navbar username
document.querySelectorAll('#dashUsername').forEach(el => { el.textContent = escapeHtml(displayName); });

// Greeting
const greetEl = document.getElementById('dashGreeting');
if (greetEl) greetEl.textContent = 'Bienvenue, ' + escapeHtml(displayName);

// Card: username
const usernameEl = document.getElementById('dashAccountUsername');
if (usernameEl) usernameEl.textContent = '@' + escapeHtml(profile.username);

// Card: email
const emailEl = document.getElementById('dashEmail');
if (emailEl) emailEl.textContent = escapeHtml(user.email);

// Card: fan since
const sinceEl = document.getElementById('dashFanSince');
if (sinceEl) {
  const d = new Date(profile.fan_since || profile.created_at);
  sinceEl.textContent = d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Card: favorite game
const gameEl = document.getElementById('dashFavGame');
if (gameEl) {
  const GAME_LABELS = { valorant: 'Valorant', lol: 'League of Legends', cs2: 'CS2', rl: 'Rocket League', eafc: 'EA Sports FC' };
  gameEl.textContent = GAME_LABELS[profile.favorite_game] ?? t('dash_no_game');
}

// Card: bio
const bioEl = document.getElementById('dashBio');
if (bioEl && profile.bio) { bioEl.textContent = escapeHtml(profile.bio); bioEl.parentElement.hidden = false; }

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logout();
    window.location.href = '/index.html';
  });
}
