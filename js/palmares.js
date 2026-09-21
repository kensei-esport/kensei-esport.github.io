/**
 * palmares.js — Palmarès (timeline + filtre par équipe + modal)
 */
import { supabase, isDev } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

const TEAM_MAP = {};

let allEntries = [];
let activeTeams = [];
let currentFilter = 'all';

async function init() {
  applyTranslations();
  initNavbar();
  initStream();
  initModal();
  initClickDelegate();
  document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

  await loadTeams();
  await loadPalmares();
}

function initClickDelegate() {
  const container = document.getElementById('palmaresTimeline');
  if (!container) return;
  container.addEventListener('click', e => {
    const item = e.target.closest('.timeline-item[data-id]');
    if (!item) return;
    const entry = allEntries.find(x => String(x.id) === item.dataset.id);
    if (entry) openModal(entry);
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
    const icon = (rawIcon.startsWith('http') || rawIcon.startsWith('/assets')) ? rawIcon : '';
    TEAM_MAP[t.id] = { label: t.name, icon };
  });
  renderFilters();
}

function renderFilters() {
  const container = document.getElementById('palmaresFilterBar');
  if (!container) return;

  const btns = activeTeams.map(t => {
    const info = TEAM_MAP[t.id] || {};
    const logo = info.icon
      ? `<img src="${info.icon}" alt="" width="16" height="16" style="border-radius:2px;vertical-align:middle;margin-right:4px" />`
      : '';
    return `<button class="results-filter__btn" data-team="${t.id}">${logo}${escHtml(info.label || t.name)}</button>`;
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

async function loadPalmares() {
  if (!isDev) {
    try {
      const { data, error } = await supabase
        .from('palmares')
        .select('*, teams(id, name, game)')
        .eq('is_published', true)
        .order('played_at', { ascending: false })
        .order('placement_rank', { ascending: true });
      if (error) throw error;
      allEntries = data || [];
    } catch {
      allEntries = [];
    }
  }
  renderTimeline();
}

function placeClass(rank) {
  if (rank === 1) return 'place-1';
  if (rank === 2) return 'place-2';
  if (rank === 3) return 'place-3';
  return 'place';
}

function renderTimeline() {
  const container = document.getElementById('palmaresTimeline');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? allEntries
    : allEntries.filter(r => r.teams?.id === currentFilter || r.team_id === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="results-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4">
          <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z"/>
        </svg>
        <p>Aucun palmarès pour le moment.</p>
      </div>
    `;
    return;
  }

  let lastMonth = null;
  const items = [];

  filtered.forEach(r => {
    const date = r.played_at ? new Date(r.played_at) : null;
    const validDate = date && !Number.isNaN(date.getTime());
    const monthKey = validDate ? `${date.getFullYear()}-${date.getMonth()}` : 'undated';
    const monthLabel = validDate
      ? date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : 'Sans date';

    if (monthKey !== lastMonth) {
      items.push(`<div class="timeline-month">${capitalise(monthLabel)}</div>`);
      lastMonth = monthKey;
    }

    const teamInfo = TEAM_MAP[r.teams?.id] || { label: r.teams?.name ?? '', icon: '' };
    const pc = placeClass(Number(r.placement_rank));
    const dateStr = validDate
      ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '';
    const placeLabel = r.placement || (r.placement_rank ? `${r.placement_rank}e` : '—');

    items.push(`
      <div class="timeline-item timeline-item--${pc}" data-team="${escHtml(r.teams?.id ?? '')}" data-id="${escHtml(String(r.id))}" style="cursor:pointer">
        <div class="timeline-item__left">
          <time class="timeline-date" datetime="${escHtml(r.played_at || '')}">${escHtml(dateStr)}</time>
          <div class="timeline-dot"></div>
        </div>
        <div class="timeline-card">
          <div class="timeline-card__top">
            <span class="timeline-card__outcome timeline-card__outcome--${pc}">${escHtml(placeLabel)}</span>
            ${teamInfo.icon ? `<img src="${teamInfo.icon}" alt="${escHtml(teamInfo.label)}" width="16" height="16" class="timeline-card__game-icon" />` : ''}
            <span class="timeline-card__game">${escHtml(teamInfo.label)}</span>
          </div>
          <div class="timeline-card__main">
            <span class="timeline-card__opponent"><strong>${escHtml(r.title || 'Tournoi')}</strong></span>
            <span class="timeline-card__score palmares-place palmares-place--${pc}">${escHtml(placeLabel)}</span>
          </div>
          ${r.prize ? `<div class="timeline-card__tournament">${escHtml(r.prize)}</div>` : ''}
        </div>
      </div>
    `);
  });

  container.innerHTML = items.join('');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const PLACE_COLORS = {
  'place-1': '#E8C547',
  'place-2': '#C0C7D1',
  'place-3': '#CD7F32',
  place:     '#FF6B1A',
};

function initModal() {
  if (document.getElementById('palmaresModalOverlay')) return;

  const style = document.createElement('style');
  style.id = 'pmStyles';
  style.textContent = `
  #palmaresModalOverlay {
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;
    background:rgba(0,0,0,.82);
    display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;
    opacity:0;pointer-events:none;transition:opacity .25s ease;
  }
  #palmaresModalOverlay.open{opacity:1;pointer-events:all;}
  #palmaresModal {
    width:100%;max-width:820px;max-height:92vh;
    display:flex;flex-direction:column;overflow:hidden;
    background:#060606;border-radius:6px;position:relative;
    box-shadow:0 40px 120px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
    transform:translateY(24px) scale(.97);transition:transform .35s cubic-bezier(.22,1,.36,1);
  }
  #palmaresModalOverlay.open #palmaresModal{transform:translateY(0) scale(1);}
  #palmaresModalOverlay .pm-close {
    position:absolute;top:.7rem;right:.7rem;z-index:30;
    width:28px;height:28px;border-radius:50%;
    background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);
    color:rgba(255,255,255,.85);font-size:.95rem;line-height:1;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  }
  #palmaresModalOverlay .pm-close:hover{background:rgba(255,255,255,.2);color:#fff;}
  #palmaresModalOverlay .pm-hero {
    position:relative;flex-shrink:0;min-height:220px;background:#060606;overflow:hidden;
    display:flex;flex-direction:column;
  }
  #palmaresModalOverlay .pm-hero__img {
    position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;
  }
  #palmaresModalOverlay .pm-hero__gradient {
    position:absolute;inset:0;z-index:1;
    background:linear-gradient(to bottom,rgba(0,0,0,.1) 0%,rgba(6,6,6,.9) 80%,#060606 100%);
  }
  #palmaresModalOverlay .pm-hero::after {
    content:'';position:absolute;top:0;left:0;right:0;height:3px;z-index:5;
  }
  #palmaresModalOverlay .pm-hero.pc--place-1::after{background:linear-gradient(90deg,transparent,#E8C547 15%,#E8C547 85%,transparent);}
  #palmaresModalOverlay .pm-hero.pc--place-2::after{background:linear-gradient(90deg,transparent,#C0C7D1 15%,#C0C7D1 85%,transparent);}
  #palmaresModalOverlay .pm-hero.pc--place-3::after{background:linear-gradient(90deg,transparent,#CD7F32 15%,#CD7F32 85%,transparent);}
  #palmaresModalOverlay .pm-hero.pc--place::after{background:linear-gradient(90deg,transparent,#FF6B1A 15%,#FF6B1A 85%,transparent);}
  #palmaresModalOverlay .pm-matchup {
    position:relative;z-index:2;margin-top:auto;
    display:flex;align-items:flex-end;justify-content:space-between;gap:1.5rem;
    padding:0 1.75rem 1.5rem;
  }
  #palmaresModalOverlay .pm-team{display:flex;flex-direction:column;gap:.45rem;}
  #palmaresModalOverlay .pm-team__logo {
    width:52px;height:52px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:6px;
  }
  #palmaresModalOverlay .pm-team__logo img{width:40px;height:40px;object-fit:contain;}
  #palmaresModalOverlay .pm-team__label{font-size:.56rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);}
  #palmaresModalOverlay .pm-team__name{font-family:'Rajdhani',sans-serif;font-size:1.15rem;font-weight:800;color:#fff;line-height:1.15;}
  #palmaresModalOverlay .pm-place{text-align:right;}
  #palmaresModalOverlay .pm-place__rank{
    font-family:'Rajdhani',sans-serif;font-weight:900;font-size:3.4rem;line-height:.9;letter-spacing:.02em;
  }
  #palmaresModalOverlay .pm-place__lbl{font-size:.62rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.4);}
  #palmaresModalMeta {
    display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;padding:.8rem 2.5rem;flex-shrink:0;
    background:rgba(255,255,255,.022);border-top:1px solid rgba(255,255,255,.05);
    font-size:.63rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.32);
  }
  #palmaresModalOverlay .pm-meta__sep{width:1px;height:11px;background:rgba(255,255,255,.14);flex-shrink:0;}
  #palmaresModalBody {
    padding:1.5rem 2.5rem 2.25rem;display:flex;flex-direction:column;gap:1.25rem;
    overflow-y:auto;flex:1;min-height:0;background:#060606;
  }
  #palmaresModalOverlay .pm-photo{width:100%;display:block;border-radius:3px;aspect-ratio:16/9;object-fit:cover;}
  #palmaresModalOverlay .pm-youtube{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:3px;}
  #palmaresModalOverlay .pm-youtube iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
  #palmaresModalOverlay .pm-desc{color:rgba(255,255,255,.42);font-size:.9rem;line-height:1.8;border-left:2px solid rgba(249,115,22,.3);padding-left:1.1rem;}
  @media(max-width:620px){
    #palmaresModalOverlay .pm-matchup{flex-direction:column;align-items:flex-start;padding:0 1.25rem 1.5rem;}
    #palmaresModalOverlay .pm-place{text-align:left;}
    #palmaresModalMeta{padding:.75rem 1.25rem;}
    #palmaresModalBody{padding:1rem 1.25rem 1.5rem;}
  }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'palmaresModalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div id="palmaresModal">
      <button class="pm-close" id="palmaresModalClose" aria-label="Fermer">×</button>
      <div id="palmaresModalCinematic"></div>
      <div id="palmaresModalMeta"></div>
      <div id="palmaresModalBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.getElementById('palmaresModalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(r) {
  const teamInfo = TEAM_MAP[r.teams?.id] || { label: r.teams?.name ?? '', icon: '' };
  const pc = placeClass(Number(r.placement_rank));
  const color = PLACE_COLORS[pc] || PLACE_COLORS.place;
  const placeLabel = r.placement || (r.placement_rank ? `${r.placement_rank}e` : '—');
  const kenLogoSrc = teamInfo.icon || '/assets/images/orange_logo.png';
  const hasImg = !!r.image_url;

  document.getElementById('palmaresModalCinematic').innerHTML = `
    <div class="pm-hero pc--${pc}${hasImg ? '' : ''}">
      ${hasImg ? `<img class="pm-hero__img" src="${escHtml(r.image_url)}" alt="" /><div class="pm-hero__gradient"></div>` : '<div class="pm-hero__gradient"></div>'}
      <div class="pm-matchup">
        <div class="pm-team">
          <div class="pm-team__logo"><img src="${escHtml(kenLogoSrc)}" alt="" /></div>
          <div class="pm-team__label">Équipe</div>
          <div class="pm-team__name">${escHtml(teamInfo.label || 'Kensei')}</div>
        </div>
        <div class="pm-place">
          <div class="pm-place__lbl">Placement</div>
          <div class="pm-place__rank" style="color:${color}">${escHtml(placeLabel)}</div>
        </div>
      </div>
    </div>`;

  const dateStr = r.played_at
    ? new Date(r.played_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const metaParts = [r.title, dateStr, r.prize].filter(Boolean);
  document.getElementById('palmaresModalMeta').innerHTML = metaParts
    .map((p, i) => i === 0 ? escHtml(p) : `<span class="pm-meta__sep"></span>${escHtml(p)}`)
    .join('');

  let body = '';
  const embedUrl = safeYoutubeEmbed(r.youtube_url);
  if (embedUrl) {
    body += `<div class="pm-youtube"><iframe src="${escHtml(embedUrl)}" title="Replay"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe></div>`;
  }
  if (r.image_url) {
    body += `<img class="pm-photo" src="${escHtml(r.image_url)}" alt="${escHtml(r.title || '')}" loading="lazy" />`;
  }
  if (r.description) {
    body += `<p class="pm-desc">${escHtml(r.description)}</p>`;
  }
  const bodyEl = document.getElementById('palmaresModalBody');
  bodyEl.innerHTML = body;
  bodyEl.style.display = body ? '' : 'none';

  const overlayEl = document.getElementById('palmaresModalOverlay');
  overlayEl.classList.add('open');
  overlayEl.setAttribute('style',
    'position:fixed;inset:0;z-index:9200;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;opacity:1;pointer-events:all;'
  );
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('palmaresModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('style', 'position:fixed;inset:0;z-index:9200;display:flex;opacity:0;pointer-events:none;');
  document.body.style.overflow = '';
  const yt = overlay.querySelector('.pm-youtube');
  if (yt) yt.innerHTML = '';
}

function safeYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1` : null;
}

init();
