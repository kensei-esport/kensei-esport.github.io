/**
 * main.js — Script commun à toutes les pages publiques
 */
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';
import { initStream } from './stream.js';

applyTranslations();
initNavbar();
initStream();

document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// "Arrive bientôt" popup for unfinished social links
(function () {
  const modal = document.createElement('div');
  modal.id = 'soonModalGlobal';
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Arrive bientôt');
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.7);align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:var(--surface-2,#1e1e1e);border:1px solid var(--border-light,#333);border-radius:16px;padding:2.5rem 2rem;max-width:340px;width:90%;text-align:center;position:relative;">
      <button id="soonModalClose" aria-label="Fermer" style="position:absolute;top:.75rem;right:1rem;background:none;border:none;color:#888;font-size:1.5rem;cursor:pointer;line-height:1;">×</button>
      <div style="font-size:2.5rem;margin-bottom:.75rem">🚀</div>
      <h3 style="font-family:Rajdhani,sans-serif;font-size:1.3rem;font-weight:700;margin-bottom:.5rem;color:#fff">Arrive bientôt !</h3>
      <p style="color:#aaa;font-size:.88rem;line-height:1.6;margin:0">On prépare ça activement. Suis-nous sur nos autres réseaux pour ne rien rater du lancement.</p>
      <button id="soonModalOk" style="margin-top:1.5rem;width:100%;padding:.7rem 1.5rem;border-radius:8px;border:none;background:#FF6B1A;color:#fff;font-weight:700;font-size:.9rem;cursor:pointer;font-family:Rajdhani,sans-serif;letter-spacing:.05em;">OK</button>
    </div>`;
  document.body.appendChild(modal);

  function openSoon() { modal.style.display = 'flex'; }
  function closeSoon() { modal.style.display = 'none'; }

  modal.addEventListener('click', function (e) { if (e.target === modal) closeSoon(); });
  document.getElementById('soonModalClose').addEventListener('click', closeSoon);
  document.getElementById('soonModalOk').addEventListener('click', closeSoon);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSoon(); });

  document.querySelectorAll('.js-soon').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openSoon(); });
  });
})();
