/**
 * results.js — Page Résultats (timeline + filtre par équipe)
 */
import { supabase, isDev } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

// Team info — populated dynamically from the teams table
const TEAM_LABELS = {};

let allResults = [];
let activeTeams = [];
let currentFilter = 'all';

async function init() {
  applyTranslations();
  initNavbar();
  initStream();

  await loadTeams();
  await loadResults();
}

async function loadTeams() {
  if (!isDev) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, game, logo_url')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      activeTeams = data || [];
    } catch {
      activeTeams = [];
    }
  }
  if (isDev || activeTeams.length === 0) {
    activeTeams = [
      { id: 'eva',      name: 'Kensei EVA',      game: 'eva',      logo_url: '/assets/images/games/eva.svg' },
      { id: 'valorant', name: 'Kensei Valorant', game: 'valorant', logo_url: '/assets/images/valo_logo.png' },
    ];
  }
  activeTeams.forEach(t => {
    TEAM_LABELS[t.game] = { label: t.name, icon: t.logo_url || '' };
  });
  renderFilters();
}

function renderFilters() {
  const container = document.getElementById('resultsFilterBar');
  if (!container) return;

  const seen = new Set();
  const unique = activeTeams.filter(t => {
    if (seen.has(t.game)) return false;
    seen.add(t.game);
    return true;
  });

  const btns = unique.map(t => {
    const info = TEAM_LABELS[t.game] || {};
    const logo = info.icon
      ? `<img src="${info.icon}" alt="" width="16" height="16" style="border-radius:2px;vertical-align:middle;margin-right:4px" />`
      : '';
    return `<button class="results-filter__btn" data-team="${t.game}">${logo}${info.label || t.game}</button>`;
  }).join('');

  container.innerHTML =
    `<button class="results-filter__btn active" data-team="all">Tous</button>${btns}`;

  container.querySelectorAll('.results-filter__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.results-filter__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.team;
      renderTimeline();
    });
  });
}

async function loadResults() {
  const grid = document.getElementById('resultsTimeline');
  if (!grid) return;

  if (!isDev) {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*, teams(id, name, game)')
        .order('played_at', { ascending: false });
      if (error) throw error;
      allResults = data || [];
    } catch {
      allResults = [];
    }
  }

  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('resultsTimeline');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? allResults
    : allResults.filter(r => r.teams?.game === currentFilter);

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
    const date = new Date(r.played_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (monthKey !== lastMonth) {
      items.push(`<div class="timeline-month">${capitalise(monthLabel)}</div>`);
      lastMonth = monthKey;
    }

    const gameKey  = r.teams?.game ?? '';
    const teamInfo = TEAM_LABELS[gameKey] || { label: r.teams?.name ?? gameKey, icon: '' };
    // Derive outcome from generated is_win + scores
    const oc      = r.is_win ? 'win' : (r.score_us === r.score_them ? 'draw' : 'loss');
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const scoreHtml = (r.score_us !== null && r.score_them !== null)
      ? `<span class="timeline-card__score">${r.score_us} <span>–</span> ${r.score_them}</span>`
      : '';

    items.push(`
      <div class="timeline-item timeline-item--${oc}" data-team="${escHtml(gameKey)}">
        <div class="timeline-item__left">
          <time class="timeline-date" datetime="${escHtml(r.played_at || '')}">${escHtml(dateStr)}</time>
          <div class="timeline-dot"></div>
        </div>
        <div class="timeline-card">
          <div class="timeline-card__top">
            <span class="timeline-card__outcome timeline-card__outcome--${oc}">${outcomeLabel(oc)}</span>
            ${teamInfo.icon ? `<img src="${teamInfo.icon}" alt="${escHtml(teamInfo.label)}" width="16" height="16" class="timeline-card__game-icon" />` : ''}
            <span class="timeline-card__game">${escHtml(teamInfo.label)}</span>
          </div>
          <div class="timeline-card__main">
            <span class="timeline-card__opponent">vs <strong>${escHtml(r.opponent || 'Adversaire')}</strong></span>
            ${scoreHtml}
          </div>
          ${r.tournament ? `<div class="timeline-card__tournament">${escHtml(r.tournament)}</div>` : ''}
          ${r.stage ? `<div class="timeline-card__notes">${escHtml(r.stage)}</div>` : ''}
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
