import { supabase, requireAuth, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';

applyTranslations();

const session = await requireAuth('/pages/login.html');
const user    = session.user;

// Check if profile already exists → edit mode
let isEditMode = false;
const { data: existing } = await supabase
  .from('fan_profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

if (existing) {
  isEditMode = true;
  // Pre-fill form with current values
  const usernameEl = document.getElementById('setupUsername');
  if (usernameEl) {
    usernameEl.value    = existing.username || '';
    usernameEl.readOnly = true;
    usernameEl.style.opacity = '0.6';
    usernameEl.title = 'Le pseudo ne peut pas être modifié';
  }
  const dispEl = document.getElementById('setupDisplayName');
  if (dispEl) dispEl.value = existing.display_name || '';
  const gameEl = document.getElementById('setupFavoriteGame');
  if (gameEl) gameEl.value = existing.favorite_game || '';
  const bioEl = document.getElementById('setupBio');
  if (bioEl) bioEl.value = existing.bio || '';

  // Update page labels
  const labelEl = document.querySelector('[data-i18n="setup_title"]');
  if (labelEl) labelEl.textContent = 'Mon profil';
  const titleEl = document.querySelector('.auth-split__form-title');
  if (titleEl) titleEl.innerHTML = 'MODIFIER<br/><span style="color:var(--orange)">MON PROFIL</span>';
  const subEl = document.querySelector('[data-i18n="setup_sub"]');
  if (subEl) subEl.textContent = 'Mettez à jour vos informations fan.';
  const btnEl = document.getElementById('setupBtn');
  if (btnEl) btnEl.textContent = 'Enregistrer les modifications';
}

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

  if (isEditMode) {
    // UPDATE existing profile
    const { error } = await supabase.from('fan_profiles').update({
      display_name:  displayName || null,
      favorite_game: favoriteGame,
      bio,
    }).eq('user_id', user.id);

    if (error) {
      showMsg(escapeHtml(error.message));
      btn.disabled = false;
    } else {
      showMsg('Profil mis à jour !', 'success');
      setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 1200);
    }
  } else {
    // INSERT new profile
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
  }
});
