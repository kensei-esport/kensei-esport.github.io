/**
 * home.js — Chargement dynamique depuis Supabase pour la page d'accueil
 * Auto-exécuté à l'import (index.html seulement)
 */
import { supabase, escapeHtml } from './auth.js';
import { initMatchModal, openMatchModal } from './match-modal.js';

// ── News modal ────────────────────────────────────────────────────
let _newsModalOpen = false;

function openArticleModal(post) {
  const modal = document.getElementById('articleModal');
  if (!modal) return;

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  modal.querySelector('.am__cover').style.backgroundImage = post.cover_url
    ? `url(${JSON.stringify(post.cover_url)})` : 'none';
  modal.querySelector('.am__cover').style.backgroundSize   = 'cover';
  modal.querySelector('.am__cover').style.backgroundPosition = post.cover_url ? 'center 15%' : 'center';
  modal.querySelector('.am__cover').style.backgroundRepeat = 'no-repeat';

  modal.querySelector('.am__tag').textContent   = post.category || 'Actualité';
  modal.querySelector('.am__title').textContent = post.title || '';
  modal.querySelector('.am__meta').textContent  = [post.author || 'Kensei Esport', date].filter(Boolean).join(' · ');
  modal.querySelector('.am__excerpt').textContent = post.excerpt || '';

  // Content — we control this from our own DB so innerHTML is safe here
  const contentEl = modal.querySelector('.am__content');
  if (post.content) {
    contentEl.innerHTML = post.content;
    contentEl.style.display = 'block';
  } else {
    contentEl.style.display = 'none';
  }

  modal.classList.add('am--open');
  document.body.style.overflow = 'hidden';
  _newsModalOpen = true;
}

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  if (!modal) return;
  modal.classList.remove('am--open');
  document.body.style.overflow = '';
  _newsModalOpen = false;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape' && _newsModalOpen) closeArticleModal(); });
window.closeArticleModal = closeArticleModal;

// ── Boot ──────────────────────────────────────────────────────────
(async function () {
  initMatchModal();
  await Promise.all([loadNews(), loadUpcoming(), loadResults()]);
}());

async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="placeholder">Chargement…</p>';

  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, slug, excerpt, content, cover_url, author, category, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="placeholder">Aucune actualité pour le moment.</p>';
    return;
  }

  // Store posts for modal access
  const posts = data;

  grid.innerHTML = posts.map(function (post, i) {
    var date = '';
    try {
      date = new Date(post.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (_) { /* noop */ }

    var imgHtml = post.cover_url
      ? '<img class="news-card__img" src="' + escapeHtml(post.cover_url) + '" alt="' + escapeHtml(post.title) + '" loading="lazy" />'
      : '<div class="news-card__img news-card__img--empty"></div>';

    return '<button type="button" data-news-idx="' + i + '" class="news-card' + (i === 0 ? ' news-card--feat' : '') + '">'
      + '<div class="news-card__img-wrap">' + imgHtml + '</div>'
      + '<div class="news-card__body">'
      + '<span class="news-card__tag">' + escapeHtml(post.category || 'Actualité') + '</span>'
      + '<p class="news-card__title">' + escapeHtml(post.title) + '</p>'
      + '<p class="news-card__meta">' + escapeHtml(date) + '</p>'
      + '</div>'
      + '</button>';
  }).join('');

  grid.querySelectorAll('[data-news-idx]').forEach(btn => {
    btn.addEventListener('click', () => openArticleModal(posts[+btn.dataset.newsIdx]));
  });
}

const GAME_LABELS = { lol: 'League of Legends', rl: 'Rocket League', eva: 'EVA', valorant: 'Valorant', cs2: 'CS2', eafc: 'EA FC' };

async function loadUpcoming() {
  const list = document.getElementById('upcomingList');
  if (!list) return;

  list.innerHTML = '<p class="placeholder">Chargement…</p>';

  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('matches')
    .select('*, teams(id, name, game, logo_url)')
    .eq('is_published', true)
    .gte('match_date', todayStr)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
    .limit(5);

  if (error || !data?.length) {
    list.innerHTML = '<p class="placeholder">Aucun match prévu pour le moment.</p>';
    return;
  }

  list.innerHTML = data.map((m, i) => {
    let date = '';
    try {
      date = new Date(m.match_date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch (_) { /* noop */ }
    const time = m.match_time ? String(m.match_time).slice(0, 5) : '';
    const teamName = m.teams ? m.teams.name : 'Kensei';
    const gameLabel = m.teams ? (GAME_LABELS[m.teams.game] || m.teams.game || '') : '';
    const meta = [m.tournament, gameLabel].filter(Boolean).join(' — ');

    return '<button type="button" class="result-item result-item--upcoming" data-match-idx="' + i + '">'
      + '<div class="result-item__side">'
      + '<div class="result-item__team-name">' + escapeHtml(teamName) + '</div>'
      + '<div class="result-item__meta">' + escapeHtml(meta) + '</div>'
      + '</div>'
      + '<div class="result-item__score result-item__vs">VS</div>'
      + '<div class="result-item__side result-item__side--right">'
      + '<div class="result-item__team-name">' + escapeHtml(m.opponent || 'Adversaire') + '</div>'
      + '<div class="result-item__meta">' + escapeHtml([date, time].filter(Boolean).join(' · ')) + '</div>'
      + '</div>'
      + '</button>';
  }).join('');

  list.querySelectorAll('[data-match-idx]').forEach(btn => {
    btn.addEventListener('click', () => openMatchModal(data[+btn.dataset.matchIdx]));
  });
}

async function loadResults() {
  var list = document.getElementById('resultsList');
  if (!list) return;

  list.innerHTML = '<p class="placeholder">Chargement…</p>';

  var { data, error } = await supabase
    .from('results')
    .select('*, teams(name, game)')
    .order('played_at', { ascending: false })
    .limit(4);

  if (error || !data || !data.length) {
    list.innerHTML = '<p class="placeholder">Aucun résultat pour le moment.</p>';
    return;
  }

  list.innerHTML = data.map(function (r) {
    var date = '';
    try {
      date = new Date(r.played_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch (_) { /* noop */ }

    var outcome = r.is_win ? 'win' : (r.score_us === r.score_them ? 'draw' : 'loss');
    var teamName = r.teams ? r.teams.name : 'Kensei';
    var gameLabel = r.teams ? (GAME_LABELS[r.teams.game] || r.teams.game || '') : '';

    return '<div class="result-item result-item--' + outcome + '">'
      + '<div class="result-item__side">'
      + '<div class="result-item__team-name">' + escapeHtml(teamName) + '</div>'
      + '<div class="result-item__meta">' + escapeHtml(r.tournament || '') + (date ? ' — ' + date : '') + '</div>'
      + '</div>'
      + '<div class="result-item__score">' + Number(r.score_us) + ' — ' + Number(r.score_them) + '</div>'
      + '<div class="result-item__side result-item__side--right">'
      + '<div class="result-item__team-name">' + escapeHtml(r.opponent || '') + '</div>'
      + '<div class="result-item__meta">' + escapeHtml(gameLabel) + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
}
