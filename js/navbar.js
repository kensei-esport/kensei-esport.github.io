/**
 * navbar.js — Logique de la navbar (dropdowns, burger, scroll, langue, profil)
 */
import { getLang, setLang, t, applyTranslations } from './i18n.js';
import { getSession, logout } from './auth.js';

const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English'  },
];

export async function initNavbar() {
  applyTranslations();
  handleScroll();
  initBurger();
  initLangSelector();
  await initProfileBtn();
  initMobileAccordions();
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
