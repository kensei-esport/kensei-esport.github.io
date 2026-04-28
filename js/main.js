/**
 * main.js — Scripts communs à toutes les pages publiques
 */

import { getSession, updateNavAuth } from './auth.js';

// Année dans le footer
document.querySelectorAll('#year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Mise à jour de la navbar
getSession().then(updateNavAuth);
