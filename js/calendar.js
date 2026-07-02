/**
 * calendar.js — Page Calendrier des matchs
 * Charge les matchs depuis Supabase et affiche un calendrier mensuel interactif
 * + une liste des prochains matchs.
 */
import { supabase, isDev } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

const MONTH_NAMES = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

// Game labels — populated dynamically from the teams table
const GAME_LABELS = {};

let allMatches  = [];   // all matches from DB
let activeTeams = [];   // teams fetched from DB
let currentGame = 'all';

// Week navigation state
function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
}
let weekStart = getMonday(new Date()); // Monday of the current week

/* ──────────────────────────────────────────── */
/*  Init                                        */
/* ──────────────────────────────────────────── */
async function init() {
  applyTranslations();
  initNavbar();
  initStream();
  setupWeekNav();
  await loadTeams();
  await loadMatches();
}

/* ──────────────────────────────────────────── */
/*  Data                                        */
/* ──────────────────────────────────────────── */
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
  activeTeams.forEach(t => { GAME_LABELS[t.game] = t.name; });
  renderFilters();
}

async function loadMatches() {
  if (!isDev) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, teams(id, name, game)')
        .eq('is_published', true)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });
      if (error) throw error;
      allMatches = data || [];
    } catch {
      allMatches = [];
    }
  }
  renderCalendar();
  renderUpcomingList();
}

/* ──────────────────────────────────────────── */
/*  Filters                                     */
/* ──────────────────────────────────────────── */
function renderFilters() {
  const container = document.getElementById('calFilters');
  if (!container) return;

  const btns = activeTeams.map(t => {
    const logo = t.logo_url
      ? `<img src="${escHtml(t.logo_url)}" alt="" width="16" height="16" style="border-radius:2px;vertical-align:middle;margin-right:4px" />`
      : '';
    return `<button class="cal-filter-btn" data-game="${escHtml(t.id)}">${logo}${escHtml(t.name)}</button>`;
  }).join('');

  container.innerHTML =
    `<button class="cal-filter-btn active" data-game="all">Tous</button>${btns}`;

  container.querySelectorAll('.cal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cal-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGame = btn.dataset.game;
      renderCalendar();
      renderUpcomingList();
    });
  });
}

function filteredMatches() {
  if (currentGame === 'all') return allMatches;
  return allMatches.filter(m => m.teams?.id === currentGame || m.team_id === currentGame);
}

/* ──────────────────────────────────────────── */
/*  Month navigation                            */
/* ──────────────────────────────────────────── */
function setupWeekNav() {
  document.getElementById('calPrev').addEventListener('click', () => {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() - 7);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
    renderCalendar();
  });
}

/* ──────────────────────────────────────────── */
/*  Calendar rendering                          */
/* ──────────────────────────────────────────── */
const DAY_NAMES_SHORT = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function renderCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Week range title: "2 – 8 Juin 2026" or "30 Mai – 5 Juin 2026"
  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(weekStart.getDate() + 6);
  const sameMonth = weekStart.getMonth() === endOfWeek.getMonth();
  const title = sameMonth
    ? `${weekStart.getDate()} – ${endOfWeek.getDate()} ${MONTH_NAMES[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`
    : `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${endOfWeek.getDate()} ${MONTH_NAMES[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
  document.getElementById('calMonthTitle').textContent = title;

  const body = document.getElementById('calBody');
  const matches = filteredMatches();

  // Index matches by date string "YYYY-MM-DD"
  const byDay = {};
  matches.forEach(m => {
    if (!m.match_date) return;
    const key = m.match_date.slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(m);
  });

  // Build 7 day cells (Mon → Sun)
  let html = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const isToday = date.getTime() === today.getTime();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const dayMatches = byDay[dateStr] || [];

    let classes = 'cal-day';
    if (isToday)               classes += ' today';
    if (dayMatches.length > 0) classes += ' has-match';

    const dowName = DAY_NAMES_SHORT[date.getDay()];

    html += `<div class="${classes}">`;
    html += `<div class="cal-day__header">`;
    html += `<span class="cal-day__dow">${dowName}</span>`;
    html += `<span class="cal-day__num">${date.getDate()}</span>`;
    html += `</div>`;

    dayMatches.forEach(m => {
      const label = m.opponent
        ? `KS vs ${escHtml(m.opponent)}`
        : escHtml(m.teams?.name || GAME_LABELS[m.teams?.game] || '');
      html += `<span class="cal-event" data-id="${m.id}" role="button" tabindex="0">${label}</span>`;
    });

    html += `</div>`;
  }

  body.innerHTML = html;

  // Attach popover events
  body.querySelectorAll('.cal-event[data-id]').forEach(el => {
    el.addEventListener('click', e => {
      const match = allMatches.find(m => String(m.id) === el.dataset.id);
      if (match) showPopover(e, match);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const match = allMatches.find(m => String(m.id) === el.dataset.id);
        if (match) showPopover(e, match);
      }
    });
  });
}

/* ──────────────────────────────────────────── */
/*  Upcoming matches list                       */
/* ──────────────────────────────────────────── */
function renderUpcomingList() {
  const container = document.getElementById('matchList');
  if (!container) return;

  const today  = new Date().toISOString().slice(0, 10);
  const upcoming = filteredMatches()
    .filter(m => m.match_date >= today)
    .slice(0, 20);

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="cal-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <p>Aucun match prévu pour le moment.</p>
      </div>`;
    return;
  }

  const MONTHS_SHORT = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];

  container.innerHTML = upcoming.map(m => {
    const d     = new Date(m.match_date + 'T00:00:00');
    const day   = d.getDate();
    const mon   = MONTHS_SHORT[d.getMonth()];
    const game  = GAME_LABELS[m.game] || m.teams?.game || m.game || '';
    const time  = m.match_time ? m.match_time.slice(0,5) : '';
    const team  = m.teams?.name || 'Kensei';
    const opp   = m.opponent   || '???';
    const tourn = m.tournament || '';
    const venue = m.venue      || '';

    const streamBtn = m.stream_url
      ? `<a href="${escHtml(m.stream_url)}" target="_blank" rel="noopener noreferrer" class="match-card__stream">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z"/></svg>
           Watch
         </a>`
      : '';

    return `
      <div class="match-card">
        <div class="match-card__date">
          <span class="match-card__day">${day}</span>
          <span class="match-card__month">${mon}</span>
        </div>
        <div class="match-card__info">
          <div class="match-card__teams">${escHtml(team)} vs ${escHtml(opp)}</div>
          <div class="match-card__meta">
            ${game ? `<span class="match-card__badge match-card__badge--game">${escHtml(game)}</span>` : ''}
            ${tourn ? `<span class="match-card__badge">${escHtml(tourn)}</span>` : ''}
            ${venue ? `<span class="match-card__badge">${escHtml(venue)}</span>` : ''}
            ${time  ? `<span class="match-card__time">${time}</span>` : ''}
          </div>
        </div>
        <div>${streamBtn}</div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────── */
/*  Popover                                     */
/* ──────────────────────────────────────────── */
function showPopover(e, match) {
  const popover = document.getElementById('calPopover');
  const game    = GAME_LABELS[match.game] || match.teams?.game || match.game || '';

  document.getElementById('calPopTitle').textContent =
    `${match.teams?.name || 'Kensei'} vs ${match.opponent || '???'}`;
  document.getElementById('calPopGame').innerHTML =
    game ? `<strong>Jeu :</strong> ${escHtml(game)}` : '';
  document.getElementById('calPopTournament').innerHTML =
    match.tournament ? `<strong>Tournoi :</strong> ${escHtml(match.tournament)}` : '';
  document.getElementById('calPopTime').innerHTML =
    match.match_time ? `<strong>Heure :</strong> ${match.match_time.slice(0,5)}` : '';
  document.getElementById('calPopVenue').innerHTML =
    match.venue ? `<strong>Lieu :</strong> ${escHtml(match.venue)}` : '';
  document.getElementById('calPopNotes').innerHTML =
    match.notes ? escHtml(match.notes) : '';
  document.getElementById('calPopStream').innerHTML = match.stream_url
    ? `<a href="${escHtml(match.stream_url)}" target="_blank" rel="noopener noreferrer" class="match-card__stream" style="font-size:0.75rem">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z"/></svg>
         Regarder le stream
       </a>`
    : '';

  // Position
  const rect = e.target.getBoundingClientRect();
  popover.style.top  = `${rect.bottom + window.scrollY + 8}px`;
  popover.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
  popover.classList.add('open');
}

function closePopover() {
  document.getElementById('calPopover').classList.remove('open');
}

/* ──────────────────────────────────────────── */
/*  Helpers                                     */
/* ──────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ──────────────────────────────────────────── */
/*  Boot                                        */
/* ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calPopoverClose').addEventListener('click', closePopover);
  document.addEventListener('click', e => {
    const popover = document.getElementById('calPopover');
    if (!e.target.closest('.cal-event') && !e.target.closest('.cal-popover')) {
      popover.classList.remove('open');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopover();
  });
});

init();
