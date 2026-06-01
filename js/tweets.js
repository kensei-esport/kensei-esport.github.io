/**
 * tweets.js — Charge et affiche les derniers tweets de @KenseiEsport
 * via la Supabase Edge Function `get-tweets`.
 */
import { SUPABASE_URL } from './config.js';

const EDGE_URL = `${SUPABASE_URL}/functions/v1/get-tweets`;

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildCard(tweet, username) {
  const tweetUrl = `https://x.com/${username}/status/${tweet.id}`;
  const imgHtml = tweet.photo_url
    ? `<div class="tweet-card__media"><img src="${tweet.photo_url}" alt="" loading="lazy" /></div>`
    : '';

  const metrics = tweet.public_metrics || {};

  return `
    <article class="tweet-card">
      <div class="tweet-card__header">
        <div class="tweet-card__avatar" aria-hidden="true">K</div>
        <div class="tweet-card__meta">
          <span class="tweet-card__name">Kensei Esport</span>
          <span class="tweet-card__handle">@${username}</span>
        </div>
        <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card__x-icon" aria-label="Voir sur X">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
      <p class="tweet-card__text">${escapeHtml(tweet.text)}</p>
      ${imgHtml}
      <div class="tweet-card__footer">
        <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card__time">${timeAgo(tweet.created_at)}</a>
        <div class="tweet-card__metrics">
          <span class="tweet-card__metric">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
            ${metrics.like_count ?? 0}
          </span>
          <span class="tweet-card__metric">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
            ${metrics.retweet_count ?? 0}
          </span>
        </div>
      </div>
    </article>`;
}

export async function loadTweets(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (SUPABASE_URL.startsWith('__')) {
    container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Tweets disponibles en production.</p>`;
    return;
  }

  container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Chargement des tweets…</p>`;

  try {
    const res = await fetch(EDGE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { tweets, username } = await res.json();

    if (!tweets?.length) {
      container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Aucun tweet trouvé.</p>`;
      return;
    }

    container.innerHTML = tweets.map(t => buildCard(t, username)).join('');
  } catch (e) {
    console.error('[tweets]', e);
    container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Impossible de charger les tweets.</p>`;
  }
}


const EDGE_URL = `${SUPABASE_URL}/functions/v1/get-tweets`;
const PROFILE_URL = 'https://x.com/KenseiEsport';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function linkifyText(text, entities) {
  // Replace URLs with their display_url linked version
  if (!entities?.urls) return escapeHtml(text);
  let result = text;
  // Sort descending by index to replace from end to avoid offset issues
  const urls = [...(entities.urls || [])].sort((a, b) => b.start - a.start);
  for (const u of urls) {
    const raw = u.url;
    // Skip Twitter's own media/card t.co links (they end in /photo or have pic.twitter)
    if (u.display_url?.startsWith('pic.twitter') || u.expanded_url?.includes('/photo/')) {
      result = result.slice(0, u.start) + result.slice(u.end);
    } else {
      const link = `<a href="${u.expanded_url}" target="_blank" rel="noopener noreferrer" class="tweet-card__link">${u.display_url}</a>`;
      result = result.slice(0, u.start) + link + result.slice(u.end);
    }
  }
  // Escape HTML in the text parts only (links are already HTML)
  // We do a targeted escape: escape the non-link parts
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildCard(tweet, mediaMap, username) {
  const tweetUrl = `https://x.com/${username}/status/${tweet.id}`;
  const media = tweet.attachments?.media_keys
    ?.map(k => mediaMap[k])
    .filter(Boolean) ?? [];

  const img = media.find(m => m.type === 'photo' || m.type === 'animated_gif');
  const imgHtml = img
    ? `<div class="tweet-card__media"><img src="${img.url}" alt="" loading="lazy" /></div>`
    : '';

  const metrics = tweet.public_metrics || {};
  const stats = `
    <span class="tweet-card__metric">
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>
      ${metrics.like_count ?? 0}
    </span>
    <span class="tweet-card__metric">
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
      ${metrics.retweet_count ?? 0}
    </span>`;

  return `
    <article class="tweet-card">
      <div class="tweet-card__header">
        <div class="tweet-card__avatar" aria-hidden="true">K</div>
        <div class="tweet-card__meta">
          <span class="tweet-card__name">Kensei Esport</span>
          <span class="tweet-card__handle">@${username}</span>
        </div>
        <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card__x-icon" aria-label="Voir sur X">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
      <p class="tweet-card__text">${linkifyText(tweet.text, tweet.entities)}</p>
      ${imgHtml}
      <div class="tweet-card__footer">
        <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="tweet-card__time">${timeAgo(tweet.created_at)}</a>
        <div class="tweet-card__metrics">${stats}</div>
      </div>
    </article>`;
}

export async function loadTweets(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Dev mode: show placeholder
  if (SUPABASE_URL.startsWith('__')) {
    container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Tweets disponibles en production.</p>`;
    return;
  }

  container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Chargement des tweets…</p>`;

  try {
    const res = await fetch(EDGE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { tweets, mediaMap, username } = await res.json();

    if (!tweets?.length) {
      container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Aucun tweet trouvé.</p>`;
      return;
    }

    container.innerHTML = tweets.map(t => buildCard(t, mediaMap, username)).join('');
  } catch (e) {
    console.error('[tweets]', e);
    container.innerHTML = `<p class="placeholder" style="grid-column:1/-1">Impossible de charger les tweets.</p>`;
  }
}
