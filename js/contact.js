import { initNavbar } from './navbar.js';
import { applyTranslations, t } from './i18n.js';
import { supabase, escapeHtml } from './auth.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const form = document.getElementById('contactForm');
if (!form) throw new Error('contactForm not found');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('contactBtn');
  const errEl = document.getElementById('contactError');
  const successEl = document.getElementById('contactSuccess');

  errEl.textContent = '';
  successEl.textContent = '';
  btn.disabled = true;

  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const subject = document.getElementById('cSubject').value;
  const message = document.getElementById('cMsg').value.trim();

  // Basic validation at boundary
  if (!name || !email || !subject || !message) {
    errEl.textContent = t('contact_error_required') || 'Veuillez remplir tous les champs.';
    btn.disabled = false;
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    errEl.textContent = t('contact_error_email') || 'Adresse e-mail invalide.';
    btn.disabled = false;
    return;
  }

  const { error } = await supabase
    .from('contact_messages')
    .insert([{
      name: escapeHtml(name),
      email: escapeHtml(email),
      subject: escapeHtml(subject),
      message: escapeHtml(message)
    }]);

  if (error) {
    errEl.textContent = t('contact_error_send') || 'Une erreur est survenue. Veuillez réessayer.';
    btn.disabled = false;
  } else {
    form.reset();
    successEl.textContent = t('contact_success') || 'Message envoyé avec succès. Nous vous répondrons rapidement.';
    btn.disabled = false;
  }
});
