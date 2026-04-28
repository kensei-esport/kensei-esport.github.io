/**
 * dashboard.js — Page dashboard (protégée)
 */

import { requireAuth, logout, escapeHtml } from './auth.js';

const session = await requireAuth('../pages/login.html');

// Affiche l'email de l'utilisateur
const userEmailEl = document.getElementById('userEmail');
const userNameEl  = document.getElementById('userName');
if (userEmailEl) userEmailEl.textContent = escapeHtml(session.user.email);
if (userNameEl)  userNameEl.textContent  = escapeHtml(session.user.email);

// Bouton déconnexion
document.getElementById('logoutBtn')?.addEventListener('click', logout);
