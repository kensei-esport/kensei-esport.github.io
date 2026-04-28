import { supabase, redirectIfLoggedIn, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';

applyTranslations();

redirectIfLoggedIn('/pages/dashboard.html');

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('auth-tab--active');
  tabRegister.classList.remove('auth-tab--active');
  loginForm.style.display = '';
  registerForm.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('auth-tab--active');
  tabLogin.classList.remove('auth-tab--active');
  registerForm.style.display = '';
  loginForm.style.display = 'none';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  errEl.textContent = '';
  btn.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = escapeHtml(error.message);
    btn.disabled = false;
  } else {
    window.location.href = '/pages/dashboard.html';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPassword2').value;
  const errEl = document.getElementById('registerError');
  const btn = document.getElementById('registerBtn');

  errEl.textContent = '';

  if (password !== password2) {
    errEl.textContent = t('auth_password_mismatch') || 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (password.length < 8) {
    errEl.textContent = t('auth_password_short') || 'Le mot de passe doit contenir au moins 8 caractères.';
    return;
  }

  btn.disabled = true;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    errEl.textContent = escapeHtml(error.message);
    btn.disabled = false;
  } else {
    errEl.style.color = 'var(--color-success,#2ecc71)';
    errEl.textContent = t('auth_confirm_email') || 'Vérifiez votre boîte mail pour confirmer votre inscription.';
  }
});
