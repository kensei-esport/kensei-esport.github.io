import { supabase, requireAuth, logout, escapeHtml } from './auth.js';
import { applyTranslations, t } from './i18n.js';
import { initNavbar } from './navbar.js';

applyTranslations();

const session = await requireAuth('/pages/login.html');
const user    = session.user;

initNavbar();
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const GAME_LABELS = {
  valorant: 'Valorant',
  lol:      'League of Legends',
  rl:       'Rocket League',
  cs2:      'CS2',
  eafc:     'EA Sports FC',
};

// Load fan profile
const { data: profile } = await supabase
  .from('fan_profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

if (!profile) { window.location.href = '/pages/setup.html'; }

const displayName = escapeHtml(profile.display_name || profile.username || user.email.split('@')[0]);
const username    = escapeHtml(profile.username);

// Greeting
const greetEl = document.getElementById('dashGreeting');
if (greetEl) greetEl.textContent = 'Bienvenue, ' + displayName;

// Navbar username
const dashUsernameEl = document.getElementById('dashUsername');
if (dashUsernameEl) dashUsernameEl.textContent = displayName;

// Fan ID: KS-YYYY-XXXXXX
const fanYear  = new Date(profile.fan_since || profile.created_at).getFullYear();
const fanHex   = user.id.replace(/-/g, '').substring(0, 6).toUpperCase();
const fanId    = `KS-${fanYear}-${fanHex}`;

const fanIdEl = document.getElementById('fanIdBadge');
if (fanIdEl) fanIdEl.textContent = fanId;

// Avatar initials
const avatarEl = document.getElementById('fanCardAvatar');
if (avatarEl) {
  if (profile.avatar_url) {
    avatarEl.innerHTML = `<img src="${profile.avatar_url}" alt="${username}" />`;
  } else {
    const initial = (profile.display_name || profile.username || '?').charAt(0).toUpperCase();
    avatarEl.innerHTML = `<span>${escapeHtml(initial)}</span>`;
  }
}

// Username & display name
const usernameEl    = document.getElementById('fanCardUsername');
const displayNameEl = document.getElementById('fanCardDisplayName');
if (usernameEl)    usernameEl.textContent    = '@' + username;
if (displayNameEl) displayNameEl.textContent = displayName;

// Fan since
const sinceEl = document.getElementById('fanCardSince');
if (sinceEl) {
  const d = new Date(profile.fan_since || profile.created_at);
  sinceEl.textContent = 'Fan depuis ' + d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Fav game
const gameEl = document.getElementById('fanCardGame');
if (gameEl) {
  gameEl.textContent = GAME_LABELS[profile.favorite_game] ?? '—';
}

// QR code via api.qrserver.com
const profileUrl = `https://kensei-esport.github.io/pages/fan.html?u=${encodeURIComponent(profile.username)}`;
const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=6&data=${encodeURIComponent(profileUrl)}`;
const qrImg = document.getElementById('fanQrImg');
if (qrImg) qrImg.src = qrUrl;

// Public link
const pubLink = document.getElementById('fanPublicLink');
if (pubLink) {
  pubLink.href        = profileUrl;
  pubLink.textContent = profileUrl.replace('https://', '');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logout();
    window.location.href = '/index.html';
  });
}

// ══ GESTION TWEETS ════════════════════════════════════════════════════════════

function renderTweetList(tweets) {
  const list = document.getElementById('tweetList');
  if (!list) return;
  if (!tweets.length) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--text-muted)">Aucun tweet pour l\'instant.</p>';
    return;
  }
  list.innerHTML = tweets.map(t => `
    <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.75rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius)">
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-size:.85rem;line-height:1.55;color:var(--text-secondary)">${escapeHtml(t.text)}</p>
        <p style="margin:.35rem 0 0;font-size:.75rem;color:var(--text-muted)">
          ${new Date(t.posted_at).toLocaleDateString('fr-FR', { day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' })}
          · ♥ ${t.likes} · 🔁 ${t.retweets}
          ${t.tweet_id ? `· <a href="https://x.com/KenseiEsport/status/${t.tweet_id}" target="_blank" rel="noopener" style="color:var(--orange)">Voir sur X</a>` : ''}
        </p>
      </div>
      <button data-id="${t.id}" class="btn-del-tweet" title="Supprimer"
        style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1rem;padding:.25rem .4rem;flex-shrink:0">✕</button>
    </div>`).join('');

  list.querySelectorAll('.btn-del-tweet').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('Supprimer ce tweet du site ?')) return;
      await supabase.from('tweets').delete().eq('id', id);
      await loadTweetManager();
    });
  });
}

async function loadTweetManager() {
  const { data } = await supabase
    .from('tweets')
    .select('id, tweet_id, text, photo_url, likes, retweets, posted_at')
    .order('posted_at', { ascending: false })
    .limit(20);
  renderTweetList(data ?? []);
}

const tweetForm = document.getElementById('tweetForm');
if (tweetForm) {
  await loadTweetManager();

  tweetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg   = document.getElementById('tweetFormMsg');
    const text  = document.getElementById('tweetText').value.trim();
    const photo = document.getElementById('tweetPhotoUrl').value.trim() || null;
    const xid   = document.getElementById('tweetXId').value.trim() || null;
    if (!text) return;

    msg.textContent = 'Publication…';
    const { error } = await supabase.from('tweets').insert({
      text,
      photo_url: photo,
      tweet_id: xid,
      posted_at: new Date().toISOString(),
    });
    if (error) {
      msg.textContent = 'Erreur : ' + error.message;
    } else {
      msg.textContent = 'Publié ✓';
      tweetForm.reset();
      await loadTweetManager();
      setTimeout(() => { msg.textContent = ''; }, 3000);
    }
  });
}
