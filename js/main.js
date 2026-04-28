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
