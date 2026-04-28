/**
 * main.js — Script commun à toutes les pages publiques
 */
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();

document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});
