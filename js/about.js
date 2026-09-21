/**
 * about.js — Charge les partenaires depuis Supabase
 */
import { supabase, escapeHtml } from './auth.js';

async function loadPartners() {
  const grid = document.getElementById('partnersGrid');
  if (!grid) return;

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  if (error || !data?.length) {
    grid.innerHTML = '<p class="placeholder">Aucun partenaire pour le moment.</p>';
    return;
  }

  grid.innerHTML = data.map(p => {
    const name = p.name || p.title || p.label || '';
    const url  = p.website_url || p.url || p.website || p.link || '';
    const logoSrc = p.logo_url || p.logo || p.image_url || '';
    const logo = logoSrc
      ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(name)}" />`
      : `<span class="partner-card__fallback">${escapeHtml((name || '?').slice(0, 1))}</span>`;
    const inner = `${logo}<span class="partner-card__name">${escapeHtml(name)}</span>`;
    if (url) {
      return `<a class="partner-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
    }
    return `<div class="partner-card">${inner}</div>`;
  }).join('');
}

loadPartners();
