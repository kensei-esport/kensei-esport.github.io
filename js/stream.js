/**
 * stream.js — Modal Live Stream Twitch
 * Importé depuis main.js (chargé sur toutes les pages).
 * 🔧 Modifier TWITCH_CHANNEL avec le vrai nom de chaîne Twitch.
 */

const TWITCH_CHANNEL = 'kensei_esport'; // ← remplace par ton vrai channel Twitch
const PARENT_DOMAIN  = 'kensei-esport.github.io';

// ── Injection du modal dans le DOM ──────────────────────────

function injectModal () {
  if (document.getElementById('streamModal')) return;

  const el = document.createElement('div');
  el.id = 'streamModal';
  el.className = 'stream-modal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Live Stream Kensei Esport');
  el.hidden = true;

  el.innerHTML = `
    <div class="stream-modal__backdrop"></div>
    <div class="stream-modal__panel" id="streamPanel">
      <div class="stream-modal__header">
        <div class="stream-modal__title">
          <span class="live-dot live-dot--lg"></span>
          <span>KENSEI LIVE</span>
        </div>
        <div class="stream-modal__header-actions">
          <a href="https://twitch.tv/${TWITCH_CHANNEL}"
             target="_blank" rel="noopener noreferrer"
             class="stream-modal__ext btn btn--ghost btn--sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z"/>
            </svg>
            Ouvrir sur Twitch
          </a>
          <button class="stream-modal__chat-btn btn btn--ghost btn--sm" id="streamChatBtn">Chat</button>
          <button class="stream-modal__close" aria-label="Fermer le stream">&times;</button>
        </div>
      </div>
      <div class="stream-modal__body" id="streamBody">
        <div class="stream-modal__player">
          <iframe id="twitchFrame"
            src=""
            width="100%" height="100%"
            allowfullscreen
            frameborder="0"
            scrolling="no"
            allow="autoplay; fullscreen">
          </iframe>
        </div>
        <iframe id="twitchChat"
          src=""
          class="stream-modal__chat"
          frameborder="0"
          scrolling="yes"
          hidden>
        </iframe>
      </div>
    </div>
  `;

  document.body.appendChild(el);

  el.querySelector('.stream-modal__backdrop').addEventListener('click', closeModal);
  el.querySelector('.stream-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Chat toggle
  let chatOpen = false;
  document.getElementById('streamChatBtn').addEventListener('click', () => {
    chatOpen = !chatOpen;
    const chatFrame = document.getElementById('twitchChat');
    const panel     = document.getElementById('streamPanel');
    panel.classList.toggle('stream-modal__panel--chat', chatOpen);
    chatFrame.hidden = !chatOpen;
    if (chatOpen && !chatFrame.src.includes('twitch.tv')) {
      chatFrame.src = `https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?parent=${PARENT_DOMAIN}&darkpopout`;
    }
    document.getElementById('streamChatBtn').textContent = chatOpen ? 'Masquer chat' : 'Chat';
  });
}

// ── Ouvrir / Fermer ─────────────────────────────────────────

function openModal () {
  injectModal();
  const modal = document.getElementById('streamModal');
  const iframe = document.getElementById('twitchFrame');
  if (!iframe.src.includes('twitch.tv')) {
    iframe.src = `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${PARENT_DOMAIN}&autoplay=true&muted=false`;
  }
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal () {
  const modal = document.getElementById('streamModal');
  if (!modal || modal.hidden) return;
  // Arrêter la lecture en réinitialisant le src
  const iframe = document.getElementById('twitchFrame');
  if (iframe) iframe.src = '';
  const chat = document.getElementById('twitchChat');
  if (chat) { chat.src = ''; chat.hidden = true; }
  const panel = document.getElementById('streamPanel');
  if (panel) panel.classList.remove('stream-modal__panel--chat');
  const chatBtn = document.getElementById('streamChatBtn');
  if (chatBtn) chatBtn.textContent = 'Chat';
  modal.hidden = true;
  document.body.style.overflow = '';
}

// ── Init ─────────────────────────────────────────────────────

export function initStream () {
  injectModal();
  document.querySelectorAll('[data-stream-open]').forEach(el => {
    el.addEventListener('click', openModal);
  });
}
