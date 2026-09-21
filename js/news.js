/**
 * news.js — Page Actualités (grille + modal article)
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

let posts = [];
let _open = false;

function openArticleModal(post) {
  const modal = document.getElementById('articleModal');
  if (!modal) return;
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const cover = modal.querySelector('.am__cover');
  cover.style.backgroundImage = post.cover_url ? `url(${JSON.stringify(post.cover_url)})` : 'none';
  cover.style.backgroundSize = 'cover';
  cover.style.backgroundPosition = 'center 15%';
  modal.querySelector('.am__tag').textContent = post.category || 'Actualité';
  modal.querySelector('.am__title').textContent = post.title || '';
  modal.querySelector('.am__meta').textContent = [post.author || 'Kensei Esport', date].filter(Boolean).join(' · ');
  modal.querySelector('.am__excerpt').textContent = post.excerpt || '';
  const contentEl = modal.querySelector('.am__content');
  if (post.content) {
    contentEl.innerHTML = post.content;
    contentEl.style.display = 'block';
  } else {
    contentEl.style.display = 'none';
  }
  modal.classList.add('am--open');
  document.body.style.overflow = 'hidden';
  _open = true;
}

function closeArticleModal() {
  const modal = document.getElementById('articleModal');
  if (!modal) return;
  modal.classList.remove('am--open');
  document.body.style.overflow = '';
  _open = false;
}

window.closeArticleModal = closeArticleModal;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && _open) closeArticleModal(); });

async function loadNews() {
  const grid = document.getElementById('newsPageGrid');
  if (!grid) return;
  grid.innerHTML = '<p class="placeholder">Chargement des actualités…</p>';

  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, slug, excerpt, content, cover_url, author, category, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error || !data?.length) {
    grid.innerHTML = '<p class="placeholder">Aucune actualité pour le moment.</p>';
    return;
  }

  posts = data;
  grid.innerHTML = posts.map((post, i) => {
    let date = '';
    try {
      date = new Date(post.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch (_) { /* noop */ }
    const img = post.cover_url
      ? `<img class="news-card__img" src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.title)}" loading="lazy" />`
      : '<div class="news-card__img news-card__img--empty"></div>';
    return `<button type="button" data-news-idx="${i}" class="news-card">
      <div class="news-card__img-wrap">${img}</div>
      <div class="news-card__body">
        <span class="news-card__tag">${escapeHtml(post.category || 'Actualité')}</span>
        <p class="news-card__title">${escapeHtml(post.title)}</p>
        ${post.excerpt ? `<p class="news-card__meta">${escapeHtml(post.excerpt)}</p>` : ''}
        <p class="news-card__meta">${escapeHtml(date)}</p>
      </div>
    </button>`;
  }).join('');

  grid.querySelectorAll('[data-news-idx]').forEach(btn => {
    btn.addEventListener('click', () => openArticleModal(posts[+btn.dataset.newsIdx]));
  });
}

loadNews();
