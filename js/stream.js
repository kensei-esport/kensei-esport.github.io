/**
 * stream.js — Live Stream Twitch
 * Redirige vers /pages/live.html et affiche un badge LIVE dans la navbar
 * quand le stream kenseiesport est en direct.
 */

const TWITCH_CHANNEL = 'kenseiesport';

// ── Init ─────────────────────────────────────────────────────

export function initStream() {
  // Any remaining data-stream-open elements → redirect to live page
  document.querySelectorAll('[data-stream-open]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/pages/live.html';
    });
  });

  // Check Twitch live status and inject navbar badge
  checkLiveStatus();
}

// ── Live status check ─────────────────────────────────────────

async function checkLiveStatus() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${TWITCH_CHANNEL}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return;
    const data = await res.json();
    const isLive = data?.[0]?.stream != null;

    if (isLive) {
      showLiveBadge();
    }
  } catch {
    // Silently fail — no badge shown
  }
}

// ── Live badge in navbar ──────────────────────────────────────

function showLiveBadge() {
  const right = document.querySelector('.navbar__right');
  if (!right || document.getElementById('navLiveBadge')) return;

  const badge = document.createElement('a');
  badge.id = 'navLiveBadge';
  badge.href = '/pages/live.html';
  badge.className = 'nav-live-badge';
  badge.title = 'Kensei Esport est en direct sur Twitch !';
  badge.innerHTML = '<span class="live-dot live-dot--sm"></span><span class="nav-live-badge__label">LIVE</span>';
  right.insertAdjacentElement('afterbegin', badge);

  // Also show the dot inside the About dropdown live link
  const streamDot = document.getElementById('navStreamDot');
  if (streamDot) streamDot.style.display = '';
}
