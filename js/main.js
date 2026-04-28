/**
 * main.js — Script commun à toutes les pages publiques
 */
import { initNavbar } from './navbar.js';
import { t } from './i18n.js';

// Navbar
initNavbar();

// Année footer
document.querySelectorAll('.js-year').forEach(el => {
  el.textContent = new Date().getFullYear();
});
