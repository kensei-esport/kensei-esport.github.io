/**
 * shop.js — Boutique 100% dynamique depuis Supabase
 * Produits par catégorie, modal avec carrousel d'images, achat externe.
 */
import { supabase, escapeHtml } from './auth.js';
import { initNavbar } from './navbar.js';
import { applyTranslations } from './i18n.js';

applyTranslations();
initNavbar();
document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });

const CAT_LABELS = {
  jerseys:'Maillots', hoodies:'Sweats & Hoodies', accessories:'Accessoires', collab:'Collaborations'
};
const CAT_ORDER = ['jerseys','hoodies','accessories','collab'];
const shopMain  = document.getElementById('shopMain');
let _imgs = [], _idx = 0;

(async function () {
  const { data } = await supabase
    .from('products')
    .select('id,name,description,price,currency,image_url,buy_url,category,is_available,sort_order,product_images(id,image_url,alt_text,sort_order)')
    .order('sort_order').order('created_at', { ascending: false });

  if (!shopMain) return;
  const products = data || [];

  const byCategory = {};
  products.forEach(p => { (byCategory[p.category||'other']||=[]).push(p); });

  const cats = [
    ...CAT_ORDER.filter(c => byCategory[c]),
    ...Object.keys(byCategory).filter(c => !CAT_ORDER.includes(c))
  ];

  if (!cats.length) {
    shopMain.innerHTML = '<p class="placeholder" style="padding:4rem;text-align:center">La boutique est en cours de mise à jour.</p>';
    return;
  }

  shopMain.innerHTML = cats.map(cat => `
    <section class="section" id="cat-${escapeHtml(cat)}">
      <div class="container">
        <div class="section__header"><div>
          <p class="section__label">${escapeHtml(CAT_LABELS[cat]||cat)}</p>
          <h2>${escapeHtml(CAT_LABELS[cat]||cat)}</h2>
        </div></div>
        <div class="products-grid">${byCategory[cat].map(renderCard).join('')}</div>
      </div>
    </section>`).join('');

  shopMain.addEventListener('click', e => {
    const card = e.target.closest('[data-pid]');
    if (!card) return;
    const p = products.find(x => x.id === card.dataset.pid);
    if (p) openModal(p);
  });
}());

function renderCard(p) {
  const img = p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy"/>`
    : '<div style="height:100%;display:flex;align-items:center;justify-content:center;opacity:.25"><svg width="40"height="40"viewBox="0 0 24 24"fill="none"stroke="currentColor"stroke-width="1.5"><rect x="3"y="3"width="18"height="18"rx="2"/><circle cx="8.5"cy="8.5"r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>';
  const badge = !p.is_available ? '<span class="product-card__badge--sold-out">Épuisé</span>' : '';
  const extra = (p.product_images||[]).length;
  const hint  = extra > 0 ? `<span class="product-card__imgs-count">+${extra+1} photos</span>` : '';
  const price = p.price != null ? `<p class="product-card__price">${Number(p.price).toFixed(2)} ${escapeHtml(p.currency||'EUR')}</p>` : '';
  return `<div class="product-card" data-pid="${escapeHtml(p.id)}" style="cursor:pointer">
    <div class="product-card__img-wrap">${img}${badge}${hint}</div>
    <div class="product-card__body">
      <h3 class="product-card__name">${escapeHtml(p.name)}</h3>
      ${price}
      <button class="btn btn--ghost btn--sm" style="margin-top:.5rem">Voir le produit</button>
    </div></div>`;
}

function buildModal() {
  if (document.getElementById('shopProductModal')) return;
  const s = document.createElement('style');
  s.textContent=`
#shopProductModal{position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem;opacity:0;pointer-events:none;transition:opacity .25s;}
#shopProductModal.open{opacity:1;pointer-events:all;}
.pm-panel{width:100%;max-width:880px;max-height:88vh;background:#0d0d0d;border-radius:8px;display:flex;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);transform:scale(.97);transition:transform .3s cubic-bezier(.22,1,.36,1);position:relative;}
#shopProductModal.open .pm-panel{transform:scale(1);}
.pm-gallery{width:55%;flex-shrink:0;background:#111;display:flex;flex-direction:column;}
.pm-main-img{flex:1;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#111;}
.pm-main-img img{width:100%;height:100%;object-fit:contain;display:block;}
.pm-thumbs{display:flex;gap:.4rem;padding:.6rem;background:#0a0a0a;overflow-x:auto;flex-shrink:0;}
.pm-thumb{width:56px;height:56px;flex-shrink:0;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid transparent;opacity:.55;transition:all .15s;background:#1a1a1a;}
.pm-thumb.active{border-color:#f97316;opacity:1;}
.pm-thumb img{width:100%;height:100%;object-fit:cover;}
.pm-nav{position:absolute;top:42%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.15);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.1rem;transition:background .15s;z-index:2;}
.pm-nav:hover{background:rgba(255,255,255,.2);}
.pm-prev{left:.6rem;}.pm-next{right:45%;}
.pm-info{flex:1;padding:1.75rem 1.75rem 1.75rem;overflow-y:auto;display:flex;flex-direction:column;min-width:0;}
.pm-tag{font-size:.63rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#f97316;margin-bottom:.5rem;}
.pm-name{font-family:'Rajdhani',sans-serif;font-size:1.7rem;font-weight:800;color:#fff;line-height:1.1;margin-bottom:.7rem;}
.pm-price{font-family:'Rajdhani',sans-serif;font-size:2rem;font-weight:900;color:#f97316;margin-bottom:1rem;}
.pm-desc{font-size:.88rem;color:rgba(255,255,255,.5);line-height:1.7;flex:1;margin-bottom:1.5rem;white-space:pre-line;}
.pm-close{position:absolute;top:.6rem;right:.6rem;z-index:10;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.85rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,transform .2s;}
.pm-close:hover{background:rgba(255,255,255,.2);transform:rotate(90deg);}
.product-card__badge--sold-out{position:absolute;top:.6rem;left:.6rem;background:rgba(239,68,68,.85);color:#fff;font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.2rem .5rem;border-radius:4px;}
.product-card__imgs-count{position:absolute;bottom:.6rem;right:.6rem;background:rgba(0,0,0,.65);color:rgba(255,255,255,.8);font-size:.65rem;font-weight:600;padding:.15rem .45rem;border-radius:4px;}
@media(max-width:680px){.pm-panel{flex-direction:column;max-height:92vh;}.pm-gallery{width:100%;height:240px;}.pm-next{right:.6rem;top:42%;}}
`;
  document.head.appendChild(s);
  const m = document.createElement('div');
  m.id='shopProductModal';
  m.innerHTML=`<div class="pm-panel"><button class="pm-close" id="pmClose">×</button>
    <div class="pm-gallery">
      <div class="pm-main-img" id="pmMain"></div>
      <button class="pm-nav pm-prev" id="pmPrev">‹</button>
      <button class="pm-nav pm-next" id="pmNext">›</button>
      <div class="pm-thumbs" id="pmThumbs"></div>
    </div>
    <div class="pm-info">
      <p class="pm-tag"  id="pmTag"></p>
      <h2 class="pm-name" id="pmName"></h2>
      <p class="pm-price" id="pmPrice"></p>
      <p class="pm-desc"  id="pmDesc"></p>
      <div id="pmActions"></div>
    </div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if(e.target===m) closeModal(); });
  document.getElementById('pmClose').addEventListener('click', closeModal);
  document.getElementById('pmPrev').addEventListener('click', () => setImg(_idx-1));
  document.getElementById('pmNext').addEventListener('click', () => setImg(_idx+1));
  document.addEventListener('keydown', e => {
    if (!document.getElementById('shopProductModal')?.classList.contains('open')) return;
    if (e.key==='Escape') closeModal();
    if (e.key==='ArrowLeft')  setImg(_idx-1);
    if (e.key==='ArrowRight') setImg(_idx+1);
  });
}

function setImg(i) {
  if (!_imgs.length) return;
  _idx = (i+_imgs.length)%_imgs.length;
  const main = document.getElementById('pmMain');
  if (main) main.innerHTML = `<img src="${escapeHtml(_imgs[_idx])}" alt=""/>`;
  document.querySelectorAll('.pm-thumb').forEach((t,j) => t.classList.toggle('active', j===_idx));
  document.querySelectorAll('.pm-nav').forEach(n => n.style.display = _imgs.length>1?'':'none');
}

function openModal(p) {
  buildModal();
  _imgs = [];
  if (p.image_url) _imgs.push(p.image_url);
  (p.product_images||[]).sort((a,b)=>a.sort_order-b.sort_order)
    .forEach(x => { if(x.image_url && !_imgs.includes(x.image_url)) _imgs.push(x.image_url); });
  _idx = 0;

  document.getElementById('pmTag').textContent   = CAT_LABELS[p.category]||p.category||'';
  document.getElementById('pmName').textContent  = p.name||'';
  document.getElementById('pmPrice').textContent = p.price!=null
    ? `${Number(p.price).toFixed(2)} ${p.currency||'EUR'}` : '';
  document.getElementById('pmDesc').textContent  = p.description||'';

  const act = document.getElementById('pmActions');
  if (p.is_available && p.buy_url) {
    act.innerHTML = `<a class="btn btn--primary" href="${escapeHtml(p.buy_url)}" target="_blank" rel="noopener noreferrer" style="width:100%;justify-content:center;">Acheter maintenant</a>`;
  } else if (!p.is_available) {
    act.innerHTML = '<button class="btn btn--ghost" disabled style="width:100%;justify-content:center;opacity:.5">Épuisé</button>';
  } else {
    act.innerHTML = '<button class="btn btn--ghost" disabled style="width:100%;justify-content:center;opacity:.5">Bientôt disponible</button>';
  }

  const thumbs = document.getElementById('pmThumbs');
  thumbs.innerHTML = _imgs.map((src,i)=>
    `<div class="pm-thumb${i===0?' active':''}" data-idx="${i}"><img src="${escapeHtml(src)}" alt="" loading="lazy"/></div>`
  ).join('');
  thumbs.querySelectorAll('.pm-thumb').forEach(t => t.addEventListener('click', ()=>setImg(+t.dataset.idx)));

  setImg(0);
  document.getElementById('shopProductModal').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeModal() {
  const m = document.getElementById('shopProductModal');
  if(m){ m.classList.remove('open'); document.body.style.overflow=''; }
}
