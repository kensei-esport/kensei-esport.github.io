import { supabase, redirectIfLoggedIn, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';

applyTranslations();

redirectIfLoggedIn('/pages/dashboard.html');

// ── Tabs ──────────────────────────────────────────────────────────
const tabLogin    = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const panelLogin  = document.getElementById('panelLogin');
const panelRegister = document.getElementById('panelRegister');
const msgEl       = document.getElementById('formMsg');

function showMsg(text, type = 'error') {
  msgEl.textContent = text;
  msgEl.className   = type === 'success' ? 'form-success' : 'form-error';
  msgEl.hidden      = false;
}
function clearMsg() { msgEl.hidden = true; msgEl.textContent = ''; }

function activateTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('auth-tab--active', isLogin);
  tabRegister.classList.toggle('auth-tab--active', !isLogin);
  panelLogin.hidden    = !isLogin;
  panelRegister.hidden = isLogin;
  clearMsg();
}

tabLogin.addEventListener('click',    () => activateTab('login'));
tabRegister.addEventListener('click', () => activateTab('register'));

// Open register tab if hash says so
if (location.hash === '#register') activateTab('register');

// ── Login ─────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) { showMsg(t('auth_fill')); return; }

  btn.disabled = true;
  btn.textContent = t('auth_loading');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase().includes('email not confirmed')
      ? t('auth_email_not_confirmed')
      : t('auth_invalid_creds');
    showMsg(msg);
    btn.disabled = false;
    btn.textContent = t('auth_login_btn');
    return;
  }

  // Check if profile exists → redirect accordingly
  const { data: profile } = await supabase
    .from('fan_profiles')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  window.location.href = profile ? '/pages/dashboard.html' : '/pages/setup.html';
});

// ── Register ──────────────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();
  const username  = document.getElementById('regUsername').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPasswordConfirm').value;
  const btn       = document.getElementById('registerBtn');

  if (!username || !email || !password || !password2) { showMsg(t('auth_fill')); return; }
  if (!USERNAME_RE.test(username)) { showMsg(t('auth_username_invalid')); return; }
  if (password !== password2)      { showMsg(t('auth_password_mismatch')); return; }
  if (password.length < 8)         { showMsg(t('auth_password_short')); return; }

  btn.disabled = true;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      showMsg(escapeHtml(error.message));
    } else {
      showMsg(t('auth_confirm_email'), 'success');
      document.getElementById('registerForm').reset();
    }
  } catch (err) {
    showMsg('Erreur réseau. Vérifie ta connexion et réessaie.');
  } finally {
    btn.disabled = false;
  }
});
