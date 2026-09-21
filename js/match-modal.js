/**
 * match-modal.js — Modal prochain match + fichier .ics calendrier
 */
import { escapeHtml } from './auth.js';

const GAME_ICONS = {
  valorant: '/assets/images/valo_logo.png',
  eva:      '/assets/images/games/eva.png',
  lol:      '/assets/images/games/lol.png',
  rl:       '/assets/images/games/rl.png',
  cs2:      '/assets/images/games/cs2.png',
  eafc:     '/assets/images/games/eafc.png',
};

function escIcs(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function matchDateTime(m) {
  const date = (m.match_date || '').slice(0, 10);
  const raw  = String(m.match_time || '18:00:00');
  const [hh = '18', mm = '00', ss = '00'] = raw.split(':');
  return {
    date,
    hh: hh.padStart(2, '0'),
    mm: mm.padStart(2, '0'),
    ss: String(ss).padStart(2, '0').slice(0, 2),
  };
}

export function downloadMatchIcs(m) {
  const { date, hh, mm, ss } = matchDateTime(m);
  if (!date) return;
  const compact = date.replace(/-/g, '');
  const start = `${compact}T${hh}${mm}${ss}`;

  let endH = Number(hh) + 2;
  let endD = compact;
  if (endH >= 24) {
    endH -= 24;
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const p = n => String(n).padStart(2, '0');
    endD = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  }
  const end = `${endD}T${String(endH).padStart(2, '0')}${mm}${ss}`;

  const team = m.teams?.name || 'Kensei';
  const opp  = m.opponent || 'Adversaire';
  const summary = `${team} vs ${opp}`;
  const desc = [m.tournament, m.description || m.notes].filter(Boolean).join(' — ');
  const loc  = m.venue || m.stream_url || 'Online';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kensei Esport//Match//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:match-${m.id || compact}@kensei-esport.github.io`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Paris:${start}`,
    `DTEND;TZID=Europe/Paris:${end}`,
    `SUMMARY:${escIcs(summary)}`,
    desc ? `DESCRIPTION:${escIcs(desc)}` : null,
    `LOCATION:${escIcs(loc)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kensei-${date}-${(opp).replace(/\s+/g, '-').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export function initMatchModal() {
  if (document.getElementById('matchModalOverlay')) return;

  const style = document.createElement('style');
  style.id = 'mmStyles';
  style.textContent = `
  #matchModalOverlay {
    position:fixed;inset:0;z-index:9200;background:rgba(0,0,0,.82);
    display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;
    opacity:0;pointer-events:none;transition:opacity .25s ease;
  }
  #matchModalOverlay.open{opacity:1;pointer-events:all;}
  #matchModal {
    width:100%;max-width:820px;max-height:92vh;overflow:hidden;
    background:#060606;border-radius:6px;position:relative;
    display:flex;flex-direction:column;
    box-shadow:0 40px 120px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
  }
  #matchModalOverlay .mm-close {
    position:absolute;top:.7rem;right:.7rem;z-index:30;
    width:28px;height:28px;border-radius:50%;
    background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);
    color:rgba(255,255,255,.85);font-size:.95rem;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
  }
  #matchModalOverlay .mm-hero {
    position:relative;min-height:220px;background:#060606;overflow:hidden;
    display:flex;flex-direction:column;
  }
  #matchModalOverlay .mm-hero__img {position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;}
  #matchModalOverlay .mm-hero__grad {
    position:absolute;inset:0;
    background:linear-gradient(to bottom,rgba(0,0,0,.1),rgba(6,6,6,.95));
  }
  #matchModalOverlay .mm-hero::after {
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg,transparent,#FF6B1A 15%,#FF6B1A 85%,transparent);
  }
  #matchModalOverlay .mm-matchup {
    position:relative;z-index:2;margin-top:auto;
    display:grid;grid-template-columns:1fr auto 1fr;
    align-items:flex-end;gap:1rem;padding:0 1.75rem 1.5rem;
  }
  #matchModalOverlay .mm-team{display:flex;flex-direction:column;gap:.45rem;}
  #matchModalOverlay .mm-team--opp{align-items:flex-end;text-align:right;}
  #matchModalOverlay .mm-team__logo {
    width:52px;height:52px;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:6px;
  }
  #matchModalOverlay .mm-team__logo img{width:40px;height:40px;object-fit:contain;}
  #matchModalOverlay .mm-team__label{font-size:.56rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);}
  #matchModalOverlay .mm-team__name{font-family:'Rajdhani',sans-serif;font-size:1.15rem;font-weight:800;color:#fff;}
  #matchModalOverlay .mm-vs{font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.6rem;color:#FF6B1A;padding-bottom:.4rem;}
  #matchModalMeta {
    display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;padding:.8rem 2rem;
    background:rgba(255,255,255,.022);border-top:1px solid rgba(255,255,255,.05);
    font-size:.63rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.32);
  }
  #matchModalOverlay .mm-sep{width:1px;height:11px;background:rgba(255,255,255,.14);}
  #matchModalBody {padding:1.35rem 2rem 2rem;overflow-y:auto;display:flex;flex-direction:column;gap:1.1rem;}
  #matchModalOverlay .mm-desc{color:rgba(255,255,255,.45);font-size:.9rem;line-height:1.75;border-left:2px solid rgba(249,115,22,.3);padding-left:1.1rem;margin:0;}
  #matchModalOverlay .mm-actions{display:flex;flex-wrap:wrap;gap:.6rem;}
  #matchModalOverlay .mm-btn {
    display:inline-flex;align-items:center;gap:.45rem;
    background:var(--orange,#FF6B1A);color:#fff;border:0;border-radius:4px;
    padding:.55rem 1rem;font-size:.8rem;font-weight:700;letter-spacing:.04em;
    text-transform:uppercase;cursor:pointer;text-decoration:none;
  }
  #matchModalOverlay .mm-btn--ghost {
    background:transparent;border:1px solid rgba(255,255,255,.18);color:#fff;
  }
  @media(max-width:620px){
    #matchModalOverlay .mm-matchup{grid-template-columns:1fr;justify-items:center;text-align:center;}
    #matchModalOverlay .mm-team,#matchModalOverlay .mm-team--opp{align-items:center;text-align:center;}
    #matchModalMeta,#matchModalBody{padding-left:1.2rem;padding-right:1.2rem;}
  }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'matchModalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div id="matchModal">
      <button class="mm-close" type="button" aria-label="Fermer">×</button>
      <div id="matchModalCinematic"></div>
      <div id="matchModalMeta"></div>
      <div id="matchModalBody"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMatchModal(); });
  overlay.querySelector('.mm-close').addEventListener('click', closeMatchModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMatchModal();
  });
}

export function openMatchModal(m) {
  initMatchModal();
  const teamName = m.teams?.name || 'Kensei';
  const kenLogo  = (m.teams?.logo_url && (m.teams.logo_url.startsWith('http') || m.teams.logo_url.startsWith('/assets')))
    ? m.teams.logo_url
    : '/assets/images/orange_logo.png';
  const oppLogo = m.opponent_logo_url || GAME_ICONS[m.teams?.game] || '';
  const hasImg  = !!m.image_url;

  document.getElementById('matchModalCinematic').innerHTML = `
    <div class="mm-hero">
      ${hasImg ? `<img class="mm-hero__img" src="${escapeHtml(m.image_url)}" alt="" /><div class="mm-hero__grad"></div>` : '<div class="mm-hero__grad"></div>'}
      <div class="mm-matchup">
        <div class="mm-team">
          <div class="mm-team__logo"><img src="${escapeHtml(kenLogo)}" alt="" /></div>
          <div class="mm-team__label">Notre équipe</div>
          <div class="mm-team__name">${escapeHtml(teamName)}</div>
        </div>
        <div class="mm-vs">VS</div>
        <div class="mm-team mm-team--opp">
          <div class="mm-team__logo">${oppLogo ? `<img src="${escapeHtml(oppLogo)}" alt="" />` : ''}</div>
          <div class="mm-team__label">Adversaire</div>
          <div class="mm-team__name">${escapeHtml(m.opponent || 'Adversaire')}</div>
        </div>
      </div>
    </div>`;

  let dateStr = '';
  if (m.match_date) {
    dateStr = new Date(m.match_date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  const timeStr = m.match_time ? String(m.match_time).slice(0, 5) : '';
  const meta = [dateStr, timeStr, m.tournament, m.venue].filter(Boolean);
  document.getElementById('matchModalMeta').innerHTML = meta
    .map((p, i) => i === 0 ? escapeHtml(p) : `<span class="mm-sep"></span>${escapeHtml(p)}`)
    .join('');

  const desc = m.description || m.notes || '';
  const stream = m.stream_url
    ? `<a class="mm-btn mm-btn--ghost" href="${escapeHtml(m.stream_url)}" target="_blank" rel="noopener noreferrer">Regarder le stream</a>`
    : '';

  document.getElementById('matchModalBody').innerHTML = `
    ${desc ? `<p class="mm-desc">${escapeHtml(desc)}</p>` : ''}
    <div class="mm-actions">
      <button type="button" class="mm-btn" id="matchIcsBtn">Ajouter au calendrier</button>
      ${stream}
    </div>`;

  document.getElementById('matchIcsBtn').addEventListener('click', () => downloadMatchIcs(m));

  const overlay = document.getElementById('matchModalOverlay');
  overlay.classList.add('open');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9200;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;opacity:1;pointer-events:all;';
  document.body.style.overflow = 'hidden';
}

export function closeMatchModal() {
  const overlay = document.getElementById('matchModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
}
