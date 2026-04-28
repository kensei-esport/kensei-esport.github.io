/**
 * shop.js — Chargement dynamique des produits depuis Supabase
 * Supporte buy_url : lien externe d'achat (Shopify, Printful, etc.)
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

var CATEGORIES = [
  { key: 'jerseys',     id: 'productsJerseys' },
  { key: 'hoodies',     id: 'productsHoodies' },
  { key: 'accessories', id: 'productsAcc'     },
  { key: 'collab',      id: 'productsCollab'  }
];

(async function () {
  var { data } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });

  var products = data || [];

  CATEGORIES.forEach(function (cat) {
    var container = document.getElementById(cat.id);
    if (!container) return;

    var items = products.filter(function (p) { return p.category === cat.key; });

    if (!items.length) {
      container.innerHTML = '<p class="placeholder">Collection bientôt disponible.</p>';
      return;
    }

    container.innerHTML = items.map(function (p) {
      var imgHtml = p.image_url
        ? '<img src="' + escapeHtml(p.image_url) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" />'
        : '';

      // Bouton d'achat : lien externe si buy_url, sinon bouton désactivé
      var btnHtml;
      if (p.is_available && p.buy_url) {
        btnHtml = '<a class="btn btn--primary btn--sm" href="' + escapeHtml(p.buy_url) + '" target="_blank" rel="noopener noreferrer">Acheter</a>';
      } else if (p.is_available) {
        btnHtml = '<button class="btn btn--primary btn--sm" disabled>Bientôt disponible</button>';
      } else {
        btnHtml = '<button class="btn btn--primary btn--sm" disabled>Épuisé</button>';
      }

      var priceHtml = (p.price != null)
        ? '<p class="product-card__price">' + Number(p.price).toFixed(2) + ' ' + escapeHtml(p.currency || 'EUR') + '</p>'
        : '';

      return '<div class="product-card">'
        + '<div class="product-card__img-wrap">' + imgHtml + '</div>'
        + '<div class="product-card__body">'
        + '<h3 class="product-card__name">' + escapeHtml(p.name) + '</h3>'
        + priceHtml
        + btnHtml
        + '</div>'
        + '</div>';
    }).join('');
  });
}());
