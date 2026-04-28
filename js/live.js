/**
 * live.js — Page Live Stream Twitch
 */

const TWITCH_CHANNEL = 'kenseiesport';

document.addEventListener('DOMContentLoaded', () => {
  const hostname = window.location.hostname || 'kensei-esport.github.io';
  const parent = encodeURIComponent(hostname);

  // Inject player iframe
  const playerFrame = document.getElementById('twitchPlayer');
  if (playerFrame) {
    playerFrame.src = `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${hostname}&autoplay=true`;
  }

  // Inject chat iframe
  const chatFrame = document.getElementById('twitchChat');
  if (chatFrame) {
    chatFrame.src = `https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?parent=${hostname}&darkpopout`;
  }

  // Chat toggle
  const chatToggle = document.getElementById('chatToggle');
  const chatPanel  = document.getElementById('liveChat');
  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      const hidden = chatPanel.classList.toggle('live-page__chat--hidden');
      chatToggle.classList.toggle('active', !hidden);
    });
  }

  // Live status check
  checkLiveStatus();
});

async function checkLiveStatus() {
  const dot   = document.getElementById('liveStatusDot');
  const meta  = document.getElementById('liveMeta');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${TWITCH_CHANNEL}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return;
    const data = await res.json();
    const stream = data?.[0]?.stream;

    if (stream) {
      if (dot) dot.style.display = '';
      if (meta) {
        meta.innerHTML = `
          <span class="live-page__game">${escHtml(stream.game ?? '')}</span>
          <span class="live-page__viewers">${(stream.viewers ?? 0).toLocaleString('fr-FR')} spectateurs</span>
        `;
      }
    } else {
      if (dot) dot.style.display = 'none';
      if (meta) meta.innerHTML = '<span class="live-page__offline">Le stream est actuellement hors ligne.</span>';
    }
  } catch {
    // Silently ignore — the Twitch player will show its own offline screen
  }
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
