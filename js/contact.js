import { initNavbar } from './navbar.js';
import { applyTranslations, t } from './i18n.js';
import { supabase, escapeHtml } from './auth.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const form       = document.getElementById('contactForm');
const successEl  = document.getElementById('formSuccess');
const errorEl    = document.getElementById('formError');
const errorMsgEl = document.getElementById('formErrorMsg');
const submitBtn  = document.getElementById('submitBtn');

if (!form) throw new Error('contactForm not found');

function showSuccess() {
  successEl.hidden = false;
  errorEl.hidden   = true;
}
function showError(msg) {
  if (errorMsgEl) errorMsgEl.textContent = msg;
  errorEl.hidden   = false;
  successEl.hidden = true;
}
function clearMsgs() {
  successEl.hidden = true;
  errorEl.hidden   = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsgs();
  submitBtn.disabled = true;

  const name    = document.getElementById('name').value.trim();
  const email   = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !subject || !message) {
    showError(t('auth_fill'));
    submitBtn.disabled = false;
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showError('Adresse e-mail invalide.');
    submitBtn.disabled = false;
    return;
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert([{
      name:    escapeHtml(name),
      email:   escapeHtml(email),
      subject: escapeHtml(subject),
      message: escapeHtml(message),
    }]);

  if (error) {
    showError(t('contact_error'));
  } else {
    form.reset();
    showSuccess();
  }
  submitBtn.disabled = false;
});
