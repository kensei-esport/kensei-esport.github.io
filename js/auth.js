/**
 * auth.js — Client Supabase + helpers d'authentification
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Use valid placeholder values during local dev (GH Actions replaces the real ones at deploy time)
const isDev = SUPABASE_URL.startsWith('__');
const _url = isDev ? 'https://placeholder.supabase.co' : SUPABASE_URL;
const _key = isDev ? 'placeholder-key' : SUPABASE_ANON_KEY;
const supabase = createClient(_url, _key);

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

export { supabase, isDev, getSession, requireAuth, redirectIfLoggedIn, logout, escapeHtml };
