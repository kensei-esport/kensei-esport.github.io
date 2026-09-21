/**
 * player-modal.js — Fiche joueur (photo, rôle, bio, réseaux)
 */
import { escapeHtml } from './auth.js';

let _open = false;

export function initPlayerModal() {
  if (document.getElementById('playerModalOverlay')) return;

  const style = document.createElement('style');
  style.id = 'plStyles';
  style.textContent = `
  #playerModalOverlay {
    position:fixed;inset:0;z-index:9300;background:rgba(0,0,0,.82);
    display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;
    opacity:0;pointer-events:none;transition:opacity .25s ease;
  }
  #playerModalOverlay.open{opacity:1;pointer-events:all;}
  #playerModal {
    width:100%;max-width:560px;max-height:92vh;overflow:hidden;
    background:#060606;border-radius:8px;position:relative;
    box-shadow:0 40px 120px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);
    display:flex;flex-direction:column;
    transform:translateY(20px) scale(.97);transition:transform .32s cubic-bezier(.22,1,.36,1);
  }
  #playerModalOverlay.open #playerModal{transform:none;}
  #playerModalOverlay .pl-close {
    position:absolute;top:.7rem;right:.7rem;z-index:30;
    width:28px;height:28px;border-radius:50%;
    background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);
    color:rgba(255,255,255,.85);font-size:.95rem;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
  }
  #playerModalOverlay .pl-close:hover{background:rgba(255,255,255,.2);}
  #playerModalOverlay .pl-hero {
    position:relative;height:280px;flex-shrink:0;background:#0d0d0d;overflow:hidden;
  }
  #playerModalOverlay .pl-hero img {
    width:100%;height:100%;object-fit:cover;object-position:top center;
  }
  #playerModalOverlay .pl-hero__ph {
    width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    font-family:'Rajdhani',sans-serif;font-size:5rem;font-weight:900;
    color:rgba(249,115,22,.35);
    background:linear-gradient(135deg,#111 0%,rgba(249,115,22,.12) 100%);
  }
  #playerModalOverlay .pl-hero::after {
    content:'';position:absolute;inset:0;
    background:linear-gradient(to bottom,transparent 40%,#060606 100%);
  }
  #playerModalOverlay .pl-body {padding:0 1.75rem 1.75rem;overflow-y:auto;}
  #playerModalOverlay .pl-role {
    display:inline-block;margin-bottom:.45rem;
    background:rgba(249,115,22,.15);color:#FF6B1A;
    font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
    padding:.2rem .55rem;border-radius:3px;
  }
  #playerModalOverlay .pl-nick {
    font-family:'Rajdhani',sans-serif;font-size:2rem;font-weight:800;color:#fff;line-height:1.05;margin:0;
  }
  #playerModalOverlay .pl-real {color:rgba(255,255,255,.4);font-size:.9rem;margin:.35rem 0 0;}
  #playerModalOverlay .pl-meta {
    display:flex;flex-wrap:wrap;gap:.6rem;margin:.9rem 0 1.1rem;
    font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
    color:rgba(255,255,255,.35);
  }
  #playerModalOverlay .pl-desc {
    color:rgba(255,255,255,.55);font-size:.92rem;line-height:1.75;
    border-left:2px solid rgba(249,115,22,.35);padding-left:1rem;margin:0;
    white-space:pre-wrap;
  }
  #playerModalOverlay .pl-social {
    display:inline-flex;align-items:center;gap:.4rem;margin-top:1.15rem;
    color:#FF6B1A;font-size:.82rem;font-weight:600;text-decoration:none;
  }
  #playerModalOverlay .pl-social:hover{text-decoration:underline;}
  @media(max-width:520px){
    #playerModalOverlay .pl-hero{height:220px;}
    #playerModalOverlay .pl-body{padding:0 1.2rem 1.4rem;}
  }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'playerModalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div id="playerModal">
      <button class="pl-close" type="button" aria-label="Fermer">×</button>
      <div id="playerModalInner"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePlayerModal(); });
  overlay.querySelector('.pl-close').addEventListener('click', closePlayerModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && _open) closePlayerModal(); });
}

export function openPlayerModal(p) {
  initPlayerModal();
  const initials = (p.nickname || '?').slice(0, 2).toUpperCase();
  const photo = p.photo_url
    ? `<img src="${escapeHtml(p.photo_url)}" alt="${escapeHtml(p.nickname || '')}" />`
    : `<div class="pl-hero__ph">${escapeHtml(initials)}</div>`;
  const role = p.role ? `<span class="pl-role">${escapeHtml(p.role)}</span>` : '';
  const real = p.real_name ? `<p class="pl-real">${escapeHtml(p.real_name)}</p>` : '';
  const meta = [p.country, p.jersey_number != null ? `#${p.jersey_number}` : '']
    .filter(Boolean)
    .map(x => `<span>${escapeHtml(String(x))}</span>`)
    .join('');
  const desc = p.description
    ? `<p class="pl-desc">${escapeHtml(p.description)}</p>`
    : '';
  const social = p.social_url
    ? `<a class="pl-social" href="${escapeHtml(p.social_url)}" target="_blank" rel="noopener noreferrer">Profil social →</a>`
    : '';

  document.getElementById('playerModalInner').innerHTML = `
    <div class="pl-hero">${photo}</div>
    <div class="pl-body">
      ${role}
      <h2 class="pl-nick">${escapeHtml(p.nickname || '')}</h2>
      ${real}
      ${meta ? `<div class="pl-meta">${meta}</div>` : ''}
      ${desc || '<p class="pl-desc" style="opacity:.5">Pas encore de description.</p>'}
      ${social}
    </div>`;

  const overlay = document.getElementById('playerModalOverlay');
  overlay.classList.add('open');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9300;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;opacity:1;pointer-events:all;';
  document.body.style.overflow = 'hidden';
  _open = true;
}

export function closePlayerModal() {
  const overlay = document.getElementById('playerModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
  _open = false;
}

export function bindPlayerCards(container, players) {
  if (!container) return;
  container.querySelectorAll('[data-player-id]').forEach(el => {
    el.addEventListener('click', () => {
      const p = players.find(x => String(x.id) === String(el.dataset.playerId));
      if (p) openPlayerModal(p);
    });
  });
}
