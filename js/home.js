/**
 * home.js — Chargement dynamique depuis Supabase pour la page d'accueil
 * Auto-exécuté à l'import (index.html seulement)
 */
import { supabase, escapeHtml } from './auth.js';

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
  modal.querySelector('.am__cover').style.background = post.cover_url
    ? `url(${JSON.stringify(post.cover_url)}) center/cover no-repeat` : 'var(--surface-2)';

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
  await Promise.all([loadNews(), loadResults()]);
}());

async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="placeholder">Chargement…</p>';

  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, slug, excerpt, content, cover_url, author, category, card_size, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="placeholder">Aucune actualité pour le moment.</p>';
    return;
  }

  // Sort: large cards first so --feat occupies the left column
  const posts = [...data].sort((a, b) => {
    const rank = s => s === 'large' ? 0 : s === 'small' ? 2 : 1;
    return rank(a.card_size) - rank(b.card_size);
  });

  grid.innerHTML = posts.map(function (post, i) {
    var date = '';
    try {
      date = new Date(post.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (_) { /* noop */ }

    var sizeClass = post.card_size === 'large' ? ' news-card--feat'
                  : post.card_size === 'small' ? ' news-card--small' : '';

    var imgHtml = post.cover_url
      ? '<img class="news-card__img" src="' + escapeHtml(post.cover_url) + '" alt="' + escapeHtml(post.title) + '" loading="lazy" />'
      : '<div class="news-card__img news-card__img--empty"></div>';

    return '<button type="button" data-news-idx="' + i + '" class="news-card' + sizeClass + '">'
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
