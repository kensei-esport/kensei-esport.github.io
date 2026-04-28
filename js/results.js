/**
 * results.js — Page Résultats (timeline + filtre par équipe)
 */
import { supabase } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

const TEAM_LABELS = {
  lol:  { label: 'League of Legends', icon: '/assets/images/lol_logo.png' },
  rl:   { label: 'Rocket League',     icon: '/assets/images/rl_logo.png'  },
  eva:  { label: 'EVA',               icon: '/assets/images/games/eva.svg' },
};

let allResults = [];
let currentFilter = 'all';

async function init() {
  applyTranslations();
  initNavbar();
  initStream();

  setupFilters();
  await loadResults();
}

function setupFilters() {
  document.querySelectorAll('.results-filter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.results-filter__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.team;
      renderTimeline();
    });
  });
}

async function loadResults() {
  const grid = document.getElementById('resultsTimeline');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .order('match_date', { ascending: false });

    if (error) throw error;
    allResults = data || [];
  } catch {
    allResults = [];
  }

  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('resultsTimeline');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? allResults
    : allResults.filter(r => r.team_slug === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="results-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <p>Aucun résultat disponible pour le moment.</p>
      </div>
    `;
    return;
  }

  // Group by year/month for section headers
  let lastMonth = null;
  const items = [];

  filtered.forEach((r, idx) => {
    const date = new Date(r.match_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (monthKey !== lastMonth) {
      items.push(`<div class="timeline-month">${capitalise(monthLabel)}</div>`);
      lastMonth = monthKey;
    }

    const teamInfo = TEAM_LABELS[r.team_slug] || { label: r.team_slug, icon: '' };
    const outcome  = r.outcome || 'draw';
    const dateStr  = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const scoreHtml = (r.score_us !== null && r.score_them !== null)
      ? `<span class="timeline-card__score">${r.score_us} <span>–</span> ${r.score_them}</span>`
      : '';

    items.push(`
      <div class="timeline-item timeline-item--${outcome}" data-team="${escHtml(r.team_slug || '')}">
        <div class="timeline-item__left">
          <time class="timeline-date" datetime="${escHtml(r.match_date || '')}">${escHtml(dateStr)}</time>
          <div class="timeline-dot"></div>
        </div>
        <div class="timeline-card">
          <div class="timeline-card__top">
            <span class="timeline-card__outcome timeline-card__outcome--${outcome}">${outcomeLabel(outcome)}</span>
            ${teamInfo.icon ? `<img src="${teamInfo.icon}" alt="${escHtml(teamInfo.label)}" width="16" height="16" class="timeline-card__game-icon" />` : ''}
            <span class="timeline-card__game">${escHtml(teamInfo.label)}</span>
          </div>
          <div class="timeline-card__main">
            <span class="timeline-card__opponent">vs <strong>${escHtml(r.opponent || 'Adversaire')}</strong></span>
            ${scoreHtml}
          </div>
          ${r.tournament ? `<div class="timeline-card__tournament">${escHtml(r.tournament)}</div>` : ''}
          ${r.notes ? `<div class="timeline-card__notes">${escHtml(r.notes)}</div>` : ''}
        </div>
      </div>
    `);
  });

  container.innerHTML = items.join('');
}

function outcomeLabel(outcome) {
  const labels = { win: 'Victoire', loss: 'Défaite', draw: 'Nul' };
  return labels[outcome] || outcome;
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

init();
