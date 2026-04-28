/**
 * auth.js — Client Supabase + helpers d'authentification
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function requireAuth(redirectTo = '/pages/login.html') {
  const session = await getSession();
  if (!session) window.location.replace(redirectTo);
  return session;
}

async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) window.location.replace('/pages/dashboard.html');
}

async function logout() {
  await supabase.auth.signOut();
  window.location.replace('/index.html');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

export { supabase, getSession, requireAuth, redirectIfLoggedIn, logout, escapeHtml };
