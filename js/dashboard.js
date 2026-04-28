import { supabase, requireAuth, logout, escapeHtml } from './auth.js';
import { applyTranslations } from './i18n.js';

applyTranslations();

// Protect page
const session = await requireAuth('/pages/login.html');

const user = session.user;

// Display user info
const emailEl = document.getElementById('userEmail');
const greetEl = document.getElementById('userGreet');
if (emailEl) emailEl.textContent = escapeHtml(user.email.split('@')[0]);
if (greetEl) greetEl.textContent = escapeHtml(user.email.split('@')[0]);

// Year
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logout();
    window.location.href = '/index.html';
  });
}
