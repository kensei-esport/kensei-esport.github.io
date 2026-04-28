/**
 * auth.js — Initialisation Supabase + helpers d'authentification
 * Chargé en premier sur toutes les pages.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Client Supabase global
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Retourne la session en cours, ou null.
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Redirige vers la page de login si l'utilisateur n'est pas connecté.
 * À appeler en haut des pages protégées.
 * @param {string} [redirectTo='../pages/login.html']
 */
async function requireAuth(redirectTo = '../pages/login.html') {
  const session = await getSession();
  if (!session) {
    window.location.replace(redirectTo);
  }
  return session;
}

/**
 * Redirige vers le dashboard si l'utilisateur est déjà connecté.
 * À appeler sur la page de login.
 */
async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) {
    window.location.replace('dashboard.html');
  }
}

/**
 * Déconnecte l'utilisateur et redirige vers l'accueil.
 */
async function logout() {
  await supabase.auth.signOut();
  window.location.replace('../index.html');
}

/**
 * Met à jour la navbar selon l'état de connexion.
 * @param {import('@supabase/supabase-js').Session|null} session
 */
function updateNavAuth(session) {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (session) {
    navAuth.innerHTML = `
      <span class="navbar__user">${escapeHtml(session.user.email)}</span>
      <button class="btn btn--outline" id="logoutBtn">Déconnexion</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
  } else {
    navAuth.innerHTML = `<a href="/pages/login.html" class="btn btn--outline">Connexion</a>`;
  }
}

/**
 * Échappe les caractères HTML pour prévenir les injections XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export { supabase, getSession, requireAuth, redirectIfLoggedIn, logout, updateNavAuth, escapeHtml };
