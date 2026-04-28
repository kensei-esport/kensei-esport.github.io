/**
 * results.js — Chargement des résultats depuis Supabase
 */

import { supabase, getSession, updateNavAuth, escapeHtml } from './auth.js';

getSession().then(updateNavAuth);
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

const list = document.getElementById('resultsList');

async function loadResults() {
  const { data: results, error } = await supabase
    .from('results')
    .select('id, opponent, score_us, score_them, game, date, tournament')
    .order('date', { ascending: false });

  if (error || !results?.length) {
    list.innerHTML = '<p class="placeholder">Aucun résultat à afficher pour l\'instant.</p>';
    return;
  }

  list.innerHTML = results.map(r => {
    const win = r.score_us > r.score_them;
    return `
      <div class="result-item result-item--${win ? 'win' : 'loss'}">
        <div>
          <strong>${escapeHtml(r.tournament ?? '')}</strong>
          <p>${escapeHtml(r.game ?? '')} · ${escapeHtml(new Date(r.date).toLocaleDateString('fr-FR'))}</p>
        </div>
        <div style="text-align:center">
          <p>vs <strong>${escapeHtml(r.opponent)}</strong></p>
        </div>
        <div class="result-item__score">
          ${escapeHtml(String(r.score_us))} — ${escapeHtml(String(r.score_them))}
        </div>
      </div>
    `;
  }).join('');
}

loadResults();
