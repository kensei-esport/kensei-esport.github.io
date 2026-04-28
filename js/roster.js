/**
 * roster.js — Chargement du roster depuis Supabase
 */

import { supabase, getSession, updateNavAuth, escapeHtml } from './auth.js';

// Navbar
getSession().then(updateNavAuth);

// Footer année
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

const grid = document.getElementById('rosterGrid');

async function loadRoster() {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, pseudo, role, game, avatar_url')
    .order('pseudo');

  if (error || !players?.length) {
    grid.innerHTML = '<p class="placeholder">Aucun joueur à afficher pour l\'instant.</p>';
    return;
  }

  grid.innerHTML = players.map(p => `
    <article class="player-card">
      <img
        src="${escapeHtml(p.avatar_url || '../assets/images/default-avatar.png')}"
        alt="Avatar de ${escapeHtml(p.pseudo)}"
        loading="lazy"
      />
      <p class="player-card__pseudo">${escapeHtml(p.pseudo)}</p>
      <p class="player-card__role">${escapeHtml(p.role ?? '')} · ${escapeHtml(p.game ?? '')}</p>
    </article>
  `).join('');
}

loadRoster();
