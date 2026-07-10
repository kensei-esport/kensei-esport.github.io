/**
 * results.js — Page Résultats (timeline + filtre par équipe)
 */
import { supabase, isDev } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

// Team info — populated dynamically from the teams table (indexed by team ID)
const TEAM_MAP = {};

let allResults = [];
let activeTeams = [];
let currentFilter = 'all';

async function init() {
  applyTranslations();
  initNavbar();
  initStream();
  initResultModal();
  initTimelineClickDelegate();

  await loadTeams();
  await loadResults();
}

/** Un listener sur le conteneur parent — ne meurt pas quand innerHTML est remplacé */
function initTimelineClickDelegate() {
  const container = document.getElementById('resultsTimeline');
  if (!container) { console.error('[modal] #resultsTimeline introuvable'); return; }
  container.addEventListener('click', e => {
    const item = e.target.closest('.timeline-item[data-id]');
    if (!item) { console.log('[modal] clic hors item', e.target.className); return; }
    const r = allResults.find(x => String(x.id) === item.dataset.id);
    console.log('[modal] clic id:', item.dataset.id, '| found:', !!r, '| allResults.length:', allResults.length);
    if (r) {
      try { openResultModal(r); }
      catch(err) { console.error('[modal error]', err); }
    }
  });
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
      { id: 'eva',      name: 'Kensei EVA',      game: 'eva',      logo_url: '/assets/images/games/eva.png' },
      { id: 'valorant', name: 'Kensei Valorant', game: 'valorant', logo_url: '/assets/images/valo_logo.png' },
    ];
  }
  activeTeams.forEach(t => {
    const rawIcon = t.logo_url || '';
    const icon = (rawIcon.startsWith('http') || rawIcon.startsWith('/assets'))
      ? rawIcon
      : '';
    TEAM_MAP[t.id] = { label: t.name, icon };
  });
  renderFilters();
}

function renderFilters() {
  const container = document.getElementById('resultsFilterBar');
  if (!container) return;

  const btns = activeTeams.map(t => {
    const info = TEAM_MAP[t.id] || {};
    const logo = info.icon
      ? `<img src="${info.icon}" alt="" width="16" height="16" style="border-radius:2px;vertical-align:middle;margin-right:4px" />`
      : '';
    return `<button class="results-filter__btn" data-team="${t.id}">${logo}${info.label || t.name}</button>`;
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
      // Ne pas vider allResults sur erreur : garder les données existantes
    }
  }

  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('resultsTimeline');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? allResults
    : allResults.filter(r => r.teams?.id === currentFilter || r.team_id === currentFilter);

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

    const teamInfo = TEAM_MAP[r.teams?.id] || { label: r.teams?.name ?? '', icon: '' };
    // Derive outcome from generated is_win + scores
    const oc      = r.is_win ? 'win' : (r.score_us === r.score_them ? 'draw' : 'loss');
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const scoreHtml = (r.score_us !== null && r.score_them !== null)
      ? `<span class="timeline-card__score">${r.score_us} <span>–</span> ${r.score_them}</span>`
      : '';

    items.push(`
      <div class="timeline-item timeline-item--${oc}" data-team="${escHtml(r.teams?.id ?? r.teams?.game ?? '')}" data-id="${escHtml(String(r.id))}" style="cursor:pointer">
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

// ── Modal résultat ───────────────────────────────────────────────

const GAME_ICONS = {
  valorant: '/assets/images/valo_logo.png',
  eva:      '/assets/images/games/eva.png',
  lol:      '/assets/images/lol_logo.png',
  rl:       '/assets/images/rl_logo.png',
};

function initResultModal() {
  if (document.getElementById('resultModalOverlay')) return;

  // ── CSS injecté directement — indépendant de main.css ───────────
  const style = document.createElement('style');
  style.id = 'rmStyles';
  style.textContent = `
  #resultModalOverlay {
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;
    background:rgba(0,0,0,.82);
    display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;
    opacity:0;pointer-events:none;transition:opacity .25s ease;
  }
  #resultModalOverlay.open{opacity:1;pointer-events:all;}
  #resultModal {
    width:100%;max-width:900px;max-height:92vh;
    display:flex;flex-direction:column;overflow:hidden;
    background:#060606;border-radius:6px;position:relative;
    box-shadow:0 40px 120px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
    transform:translateY(24px) scale(.97);transition:transform .35s cubic-bezier(.22,1,.36,1);
  }
  #resultModalOverlay.open #resultModal{transform:translateY(0) scale(1);}
  #resultModalOverlay .rm-close {
    position:absolute;top:.85rem;right:.85rem;z-index:20;
    width:32px;height:32px;border-radius:50%;
    background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.18);
    color:rgba(255,255,255,.8);font-size:1.1rem;line-height:1;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
    transition:background .15s,transform .2s;
  }
  #resultModalOverlay .rm-close:hover{background:rgba(255,255,255,.2);color:#fff;transform:rotate(90deg);}
  #resultModalOverlay .rm-hero {
    position:relative;flex-shrink:0;min-height:360px;background:#060606;
    overflow:hidden;display:flex;flex-direction:column;
  }
  #resultModalOverlay .rm-hero__img {
    position:absolute;top:0;left:0;right:0;bottom:0;
    width:100%;height:100%;object-fit:cover;object-position:center 75%;
    opacity:.65;
    transform:scale(1.06);transition:transform 5s ease;
  }
  #resultModalOverlay.open .rm-hero__img{transform:scale(1);}
  #resultModalOverlay .rm-hero__gradient {
    position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;
    background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(6,6,6,.05) 30%,rgba(6,6,6,.78) 65%,rgba(6,6,6,1) 100%);
  }
  #resultModalOverlay .rm-hero::after {
    content:'';position:absolute;top:0;left:0;right:0;height:3px;z-index:5;
  }
  #resultModalOverlay .rm-hero.oc--win::after{background:linear-gradient(90deg,transparent,#22c55e 15%,#22c55e 85%,transparent);}
  #resultModalOverlay .rm-hero.oc--loss::after{background:linear-gradient(90deg,transparent,#ef4444 15%,#ef4444 85%,transparent);}
  #resultModalOverlay .rm-hero.oc--draw::after{background:linear-gradient(90deg,transparent,#f97316 15%,#f97316 85%,transparent);}
  #resultModalOverlay .rm-hero--no-img{
    background:radial-gradient(ellipse 70% 55% at 12% 85%,rgba(249,115,22,.13) 0%,transparent 60%),
               radial-gradient(ellipse 55% 50% at 92% 8%,rgba(249,115,22,.07) 0%,transparent 55%),#060606;
  }
  #resultModalOverlay .rm-watermark {
    position:absolute;bottom:-12px;right:-8px;z-index:0;
    font-family:'Rajdhani',sans-serif;font-weight:900;font-size:clamp(5rem,20vw,12rem);
    letter-spacing:.05em;text-transform:uppercase;
    color:rgba(255,255,255,.012);pointer-events:none;user-select:none;white-space:nowrap;line-height:1;
  }
  #resultModalOverlay .rm-matchup {
    position:relative;z-index:2;margin-top:auto;
    display:grid;grid-template-columns:1fr auto 1fr;
    align-items:flex-end;gap:1.25rem;padding:0 2.5rem 2.5rem;
  }
  #resultModalOverlay .rm-team{display:flex;flex-direction:column;align-items:flex-start;gap:.5rem;}
  #resultModalOverlay .rm-team--opp{align-items:flex-end;text-align:right;}
  #resultModalOverlay .rm-team__logo {
    width:68px;height:68px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:6px;
  }
  #resultModalOverlay .rm-team__logo img{width:52px;height:52px;object-fit:contain;}
  #resultModalOverlay .rm-team__label{font-size:.56rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);}
  #resultModalOverlay .rm-team__name{font-family:'Rajdhani',sans-serif;font-size:1.05rem;font-weight:800;color:#fff;line-height:1.15;}
  #resultModalOverlay .rm-team--opp .rm-team__name{color:rgba(255,255,255,.48);}
  #resultModalOverlay .rm-score{display:flex;flex-direction:column;align-items:center;gap:.45rem;flex-shrink:0;padding-bottom:.2rem;}
  #resultModalOverlay .rm-score__nums{display:flex;align-items:baseline;gap:.2rem;font-family:'Rajdhani',sans-serif;font-weight:900;line-height:1;}
  #resultModalOverlay .rm-score__us{font-size:5.5rem;color:#fff;}
  #resultModalOverlay .rm-score__sep{font-size:2.4rem;color:rgba(255,255,255,.2);padding:0 .15rem;}
  #resultModalOverlay .rm-score__them{font-size:5.5rem;color:rgba(255,255,255,.28);}
  #resultModalOverlay .rm-outcome{font-size:.62rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;padding:.22rem .9rem;border-radius:2px;white-space:nowrap;}
  #resultModalOverlay .rm-outcome--win{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.3);}
  #resultModalOverlay .rm-outcome--loss{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3);}
  #resultModalOverlay .rm-outcome--draw{background:rgba(249,115,22,.09);color:#f97316;border:1px solid rgba(249,115,22,.3);}
  #resultModalMeta {
    display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;padding:.8rem 2.5rem;flex-shrink:0;
    background:rgba(255,255,255,.022);border-top:1px solid rgba(255,255,255,.05);
    font-size:.63rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.32);
  }
  #resultModalOverlay .rm-meta__sep{width:1px;height:11px;background:rgba(255,255,255,.14);flex-shrink:0;}
  #resultModalBody {
    padding:1.5rem 2.5rem 2.25rem;display:flex;flex-direction:column;gap:1.25rem;
    overflow-y:auto;flex:1;min-height:0;background:#060606;
  }
  #resultModalOverlay .rm-photo{width:100%;display:block;border-radius:3px;aspect-ratio:16/9;object-fit:cover;object-position:center top;}
  #resultModalOverlay .rm-youtube{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:3px;}
  #resultModalOverlay .rm-youtube iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
  #resultModalOverlay .rm-desc{color:rgba(255,255,255,.42);font-size:.9rem;line-height:1.8;border-left:2px solid rgba(249,115,22,.3);padding-left:1.1rem;}
  @media(max-width:620px){
    #resultModalOverlay .rm-hero{min-height:280px;}
    #resultModalOverlay .rm-matchup{grid-template-columns:1fr;justify-items:center;padding:0 1.25rem 2rem;gap:.75rem;}
    #resultModalOverlay .rm-team,#resultModalOverlay .rm-team--opp{align-items:center;text-align:center;}
    #resultModalOverlay .rm-score__us,#resultModalOverlay .rm-score__them{font-size:4rem;}
    #resultModalMeta{padding:.75rem 1.25rem;}
    #resultModalBody{padding:1rem 1.25rem 1.5rem;}
  }
  `;
  document.head.appendChild(style);

  // ── Overlay ──────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id        = 'resultModalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div id="resultModal">
      <button class="rm-close" id="resultModalClose" aria-label="Fermer">×</button>
      <div id="resultModalCinematic"></div>
      <div id="resultModalMeta"></div>
      <div id="resultModalBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeResultModal(); });
  document.getElementById('resultModalClose').addEventListener('click', closeResultModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeResultModal(); });
}

function openResultModal(r) {
  const teamInfo  = TEAM_MAP[r.teams?.id] || { label: r.teams?.name ?? '', icon: '' };
  const oc        = r.is_win ? 'win' : (r.score_us === r.score_them ? 'draw' : 'loss');
  const ocLabel   = { win: 'VICTOIRE', loss: 'DÉFAITE', draw: 'MATCH NUL' }[oc];

  // Kensei logo — jamais un logo de jeu générique
  const GAME_ICON_URLS = Object.values(GAME_ICONS);
  const kenLogoSrc = (teamInfo.icon && !GAME_ICON_URLS.includes(teamInfo.icon))
    ? teamInfo.icon : '/assets/images/orange_logo.png';

  // Logo adversaire
  const oppLogoSrc = r.opponent_logo_url || GAME_ICONS[r.teams?.game] || '';

  const hasImg = !!r.image_url;

  // ── Hero ─────────────────────────────────────────────────────
  document.getElementById('resultModalCinematic').innerHTML = `
    <div class="rm-hero oc--${oc}${hasImg ? '' : ' rm-hero--no-img'}">
      ${hasImg ? `<img class="rm-hero__img" src="${escHtml(r.image_url)}" alt="" loading="eager" />
                  <div class="rm-hero__gradient"></div>` : ''}
      ${!hasImg ? `<div class="rm-watermark">${ocLabel}</div>` : ''}
      <div class="rm-matchup">
        <div class="rm-team">
          <div class="rm-team__logo"><img src="${escHtml(kenLogoSrc)}" alt="" /></div>
          <div class="rm-team__label">Notre équipe</div>
          <div class="rm-team__name">${escHtml(teamInfo.label || 'Kensei')}</div>
        </div>
        <div class="rm-score">
          <div class="rm-score__nums">
            <span class="rm-score__us">${r.score_us ?? '—'}</span>
            <span class="rm-score__sep">:</span>
            <span class="rm-score__them">${r.score_them ?? '—'}</span>
          </div>
          <span class="rm-outcome rm-outcome--${oc}">${ocLabel}</span>
        </div>
        <div class="rm-team rm-team--opp">
          <div class="rm-team__logo">${oppLogoSrc ? `<img src="${escHtml(oppLogoSrc)}" alt="" />` : ''}</div>
          <div class="rm-team__label">Adversaire</div>
          <div class="rm-team__name">${escHtml(r.opponent || 'Adversaire')}</div>
        </div>
      </div>
    </div>`;

  // ── Meta bar ─────────────────────────────────────────────────
  const dateStr = new Date(r.played_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const metaParts = [dateStr];
  if (r.tournament) metaParts.push(r.tournament);
  if (r.stage)      metaParts.push(r.stage);
  document.getElementById('resultModalMeta').innerHTML = metaParts
    .map((p, i) => i === 0 ? escHtml(p) : `<span class="rm-meta__sep"></span>${escHtml(p)}`)
    .join('');

  // ── Body ─────────────────────────────────────────────────────
  let body = '';
  const embedUrl = safeYoutubeEmbed(r.youtube_url);
  if (embedUrl) {
    body += `<div class="rm-youtube"><iframe src="${escHtml(embedUrl)}" title="Replay du match"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe></div>`;
  }
  if (r.image_url) {
    body += `<img class="rm-photo" src="${escHtml(r.image_url)}" alt="Photo du match" loading="lazy" />`;
  }
  if (r.description) {
    body += `<p class="rm-desc">${escHtml(r.description)}</p>`;
  }
  const bodyEl = document.getElementById('resultModalBody');
  bodyEl.innerHTML = body;
  bodyEl.style.display = body ? '' : 'none';

  const overlayEl = document.getElementById('resultModalOverlay');
  if (!overlayEl) { console.error('[modal] overlay introuvable — initResultModal non appelé?'); return; }

  overlayEl.classList.add('open');
  // Force toutes les propriétés critiques en inline (la classe CSS peut ne pas s'appliquer)
  overlayEl.setAttribute('style',
    'position:fixed;top:0;left:0;right:0;bottom:0;' +
    'z-index:9200;background:rgba(0,0,0,.82);' +
    'display:flex;align-items:center;justify-content:center;' +
    'padding:1.5rem 1rem;opacity:1;pointer-events:all;'
  );
  // Forcer aussi le modal inner
  const modalEl = document.getElementById('resultModal');
  if (modalEl) modalEl.setAttribute('style',
    'background:#060606;width:100%;max-width:900px;max-height:92vh;' +
    'display:flex;flex-direction:column;overflow-y:auto;border-radius:6px;' +
    'box-shadow:0 40px 120px rgba(0,0,0,.9);position:relative;'
  );
  document.body.style.overflow = 'hidden';
}


function closeResultModal() {
  const overlay = document.getElementById('resultModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('style', 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;opacity:0;pointer-events:none;');
  document.body.style.overflow = '';
  const yt = overlay.querySelector('.rm-youtube');
  if (yt) yt.innerHTML = '';
}

/** Extrait l'ID YouTube et retourne une URL embed sécurisée */
function safeYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1` : null;
}

init();
