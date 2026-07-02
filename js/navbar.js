/**
 * navbar.js — Logique de la navbar (dropdowns, burger, scroll, langue, profil)
 */
import { getLang, setLang, t, applyTranslations } from './i18n.js';
import { getSession, logout, supabase } from './auth.js';

const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English'  },
];

export async function initNavbar() {
  applyTranslations();
  handleScroll();
  initBurger();
  initLangSelector();
  injectPlatformBtn();
  populateTeamsDropdown(); // async, non-bloquant
  await initProfileBtn();
  initMobileAccordions();
}

/* --- Teams dropdown dynamique --- */
const TEAM_ICONS = {
  valorant: '/assets/images/valo_logo.png',
  eva:      '/assets/images/games/eva.png',
  lol:      '/assets/images/games/lol.png',
  rl:       '/assets/images/games/rl.png',
  cs2:      '/assets/images/games/cs2.png',
  eafc:     '/assets/images/games/eafc.png',
};

async function populateTeamsDropdown() {
  try {
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, game, logo_url')
      .eq('is_active', true)
      .order('game').order('name');

    if (!teams?.length) return;

    // ── Desktop mega-dropdown ────────────────────────────────────
    const dropdown = document.querySelector('.nav-dropdown--mega');
    if (dropdown) {
      const allLink = `<a href="/pages/teams.html" class="nav-dropdown__link">
        <span class="nav-dropdown__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
        <span class="nav-dropdown__text"><strong>Toutes les équipes</strong></span>
      </a>`;

      const teamLinks = teams.map(t => {
        const logo = t.logo_url || TEAM_ICONS[t.game] || '';
        const iconHtml = logo
          ? `<img src="${logo}" alt="${t.name}" width="18" height="18" style="border-radius:2px" />`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
        return `<a href="/pages/team.html?id=${t.id}" class="nav-dropdown__link">
          <span class="nav-dropdown__icon">${iconHtml}</span>
          <span class="nav-dropdown__text"><strong>${t.name}</strong></span>
        </a>`;
      }).join('');

      dropdown.innerHTML = allLink + teamLinks;
    }

    // ── Mobile sub-menu ──────────────────────────────────────────
    // Trouver le sous-menu Teams dans le menu mobile
    const mobileTeamBtn = Array.from(
      document.querySelectorAll('.mobile-nav-trigger')
    ).find(el => el.textContent.trim().startsWith('Team') || el.querySelector('[data-i18n="nav_teams"]'));

    if (mobileTeamBtn) {
      const sub = mobileTeamBtn.nextElementSibling;
      if (sub && sub.classList.contains('mobile-nav-sub')) {
        sub.innerHTML =
          `<a href="/pages/teams.html">Toutes les équipes</a>`
          + teams.map(t => `<a href="/pages/team.html?id=${t.id}">${t.name}</a>`).join('');
      }
    }
  } catch { /* fail silently */ }
}

/* --- Platform button --- */
function injectPlatformBtn() {
  const right = document.querySelector('.navbar__right');
  if (!right || document.querySelector('.platform-btn')) return; // already injected
  const a = document.createElement('a');
  a.href      = '/pages/dashboard.html';
  a.className = 'platform-btn';
  a.innerHTML =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
    + '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>'
    + '</svg>'
    + '<span>Espace Joueur</span>';
  // Insert before lang-selector
  const langSel = right.querySelector('#langSelector');
  right.insertBefore(a, langSel || right.firstChild);
}

/* --- Scroll effect --- */
function handleScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* --- Burger / mobile menu --- */
function initBurger() {
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('mobileMenu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Ferme au clic sur un lien
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* --- Mobile accordions --- */
function initMobileAccordions() {
  document.querySelectorAll('.mobile-nav-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const sub = trigger.nextElementSibling;
      if (!sub) return;
      const open = trigger.classList.toggle('open');
      sub.classList.toggle('open', open);
    });
  });
}

/* --- Language selector --- */
function initLangSelector() {
  const current = getLang();

  // Desktop
  const desktopSel = document.getElementById('langSelector');
  if (desktopSel) {
    const btn      = desktopSel.querySelector('.lang-btn');
    const dropdown = desktopSel.querySelector('.lang-dropdown');

    // Render current
    const cur = LANGS.find(l => l.code === current) || LANGS[0];
    const flagEl = btn?.querySelector('.lang-flag');
    if (flagEl) flagEl.textContent = cur.code.toUpperCase();

    // Render options
    if (dropdown) {
      dropdown.innerHTML = LANGS.map(l => `
        <div class="lang-option ${l.code === current ? 'active' : ''}" data-lang="${l.code}">
          <span class="lang-option__code">${l.code.toUpperCase()}</span>
          <span class="lang-option__label">${l.label}</span>
        </div>
      `).join('');
      dropdown.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => setLang(opt.dataset.lang));
      });
    }

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      desktopSel.classList.toggle('open');
    });
    document.addEventListener('click', () => desktopSel.classList.remove('open'));
  }

  // Mobile
  document.querySelectorAll('.mobile-lang-opt').forEach(opt => {
    if (opt.dataset.lang === current) opt.classList.add('active');
    opt.addEventListener('click', () => setLang(opt.dataset.lang));
  });
}

/* --- Profile button --- */
async function initProfileBtn() {
  const profileBtn = document.getElementById('profileBtn');
  if (!profileBtn) return;

  const session = await getSession();
  if (session) {
    const nameEl = profileBtn.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = session.user.email.split('@')[0];
    profileBtn.addEventListener('click', () => {
      window.location.href = '/pages/dashboard.html';
    });
  } else {
    profileBtn.addEventListener('click', () => {
      window.location.href = '/pages/login.html';
    });
  }

  // Logout button in nav (if logged in)
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn && session) {
    logoutBtn.style.display = '';
    logoutBtn.addEventListener('click', logout);
  }
}
