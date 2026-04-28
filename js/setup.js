import { supabase, requireAuth, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';

applyTranslations();

const session = await requireAuth('/pages/login.html');
const user    = session.user;

// If profile already exists → skip to dashboard
const { data: existing } = await supabase
  .from('fan_profiles')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle();

if (existing) { window.location.href = '/pages/dashboard.html'; }

// Pre-fill username from auth metadata
const savedUsername = user.user_metadata?.username ?? '';
const usernameInput = document.getElementById('setupUsername');
if (usernameInput && savedUsername) usernameInput.value = savedUsername;

// Year
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

// ── Form submit ───────────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const msgEl       = document.getElementById('setupMsg');

function showMsg(text, type = 'error') {
  msgEl.textContent = text;
  msgEl.className   = type === 'success' ? 'form-success' : 'form-error';
  msgEl.hidden      = false;
}

document.getElementById('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username     = document.getElementById('setupUsername').value.trim();
  const displayName  = document.getElementById('setupDisplayName').value.trim();
  const favoriteGame = document.getElementById('setupFavoriteGame').value || null;
  const bio          = document.getElementById('setupBio').value.trim() || null;
  const btn          = document.getElementById('setupBtn');

  if (!username) { showMsg(t('auth_fill')); return; }
  if (!USERNAME_RE.test(username)) { showMsg(t('auth_username_invalid')); return; }

  btn.disabled = true;

  const { error } = await supabase.from('fan_profiles').insert({
    user_id:       user.id,
    username,
    display_name:  displayName || null,
    favorite_game: favoriteGame,
    bio,
  });

  if (error) {
    const msg = error.message.includes('unique') || error.code === '23505'
      ? t('auth_username_taken')
      : escapeHtml(error.message);
    showMsg(msg);
    btn.disabled = false;
  } else {
    showMsg(t('setup_success'), 'success');
    setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 1400);
  }
});
