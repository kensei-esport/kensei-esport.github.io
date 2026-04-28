/**
 * login.js — Logique de la page de connexion
 */

import { supabase, redirectIfLoggedIn } from './auth.js';

// Redirige si déjà connecté
redirectIfLoggedIn();

const form     = document.getElementById('loginForm');
const emailEl  = document.getElementById('email');
const passEl   = document.getElementById('password');
const errorEl  = document.getElementById('authError');
const loginBtn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email    = emailEl.value.trim();
  const password = passEl.value;

  // Validation côté client basique
  if (!email || !password) {
    errorEl.textContent = 'Veuillez remplir tous les champs.';
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Connexion…';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Message générique pour éviter l'énumération des comptes
    errorEl.textContent = 'Identifiants incorrects. Veuillez réessayer.';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Se connecter';
    return;
  }

  window.location.replace('dashboard.html');
});
