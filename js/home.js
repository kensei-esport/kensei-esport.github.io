/**
 * home.js — Chargement dynamique depuis Supabase pour la page d'accueil
 * Auto-exécuté à l'import (index.html seulement)
 */
import { supabase, escapeHtml } from './auth.js';

(async function () {
  await Promise.all([loadNews(), loadResults()]);
}());

async function loadNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="placeholder">Chargement…</p>';

  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, slug, category, published_at, image_url')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="placeholder">Aucune actualité pour le moment.</p>';
    return;
  }

  grid.innerHTML = data.map(function (post, i) {
    var date = '';
    try {
      date = new Date(post.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (_) { /* noop */ }

    var imgHtml = post.image_url
      ? '<img class="news-card__img" src="' + escapeHtml(post.image_url) + '" alt="' + escapeHtml(post.title) + '" loading="lazy" />'
      : '<div class="news-card__img" style="background:var(--surface-2);"></div>';

    return '<a href="/pages/news.html?slug=' + encodeURIComponent(escapeHtml(post.slug)) + '" class="news-card' + (i === 0 ? ' news-card--feat' : '') + '">'
      + '<div class="news-card__img-wrap">' + imgHtml + '</div>'
      + '<div class="news-card__body">'
      + '<span class="news-card__tag">' + escapeHtml(post.category || 'News') + '</span>'
      + '<p class="news-card__title">' + escapeHtml(post.title) + '</p>'
      + '<p class="news-card__meta">' + date + '</p>'
      + '</div>'
      + '</a>';
  }).join('');
}

async function loadResults() {
  var list = document.getElementById('resultsList');
  if (!list) return;

  list.innerHTML = '<p class="placeholder">Chargement…</p>';

  var { data, error } = await supabase
    .from('results')
    .select('*')
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

    return '<div class="result-item result-item--' + (r.is_win ? 'win' : 'loss') + '">'
      + '<div class="result-item__side">'
      + '<div class="result-item__team-name">' + escapeHtml(r.our_team_name) + '</div>'
      + '<div class="result-item__meta">' + escapeHtml(r.tournament || '') + (date ? ' — ' + date : '') + '</div>'
      + '</div>'
      + '<div class="result-item__score">' + Number(r.score_us) + ' — ' + Number(r.score_them) + '</div>'
      + '<div class="result-item__side result-item__side--right">'
      + '<div class="result-item__team-name">' + escapeHtml(r.opponent_name) + '</div>'
      + '<div class="result-item__meta">' + escapeHtml(r.game || '') + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
}
