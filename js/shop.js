/* PACELINE — shop page: data-driven catalogue with category + brand filters (URL: shop.html?cat=apparel&brand=Nike) */
(() => {
  'use strict';
  const inr = n => '₹' + n.toLocaleString('en-IN');
  const S = 'assets/img/shoe.webp', A = 'assets/img/cat3.webp', X = 'assets/img/cat4.webp';
  // [brand, name, price(₹), image, categories, badge]
  const P = [
    ['Hoka', 'Cloudmonster 3 — Hyper Lily', 17999, S, 'footwear road men women', 'NEW'],
    ['Nike', 'Vaporfly 4 — Volt Ice', 21999, S, 'footwear road men women', 'NEW'],
    ['Hoka', 'Tecton X 4 — Frost / Tangerine', 18999, S, 'footwear trail men women', 'NEW'],
    ['Asics', 'Megablast — White / Orange Glow', 14999, S, 'footwear road men women sale', 'SALE'],
    ['Brooks', 'Ghost 16 — Neutral Daily Trainer', 12999, S, 'footwear road men women', ''],
    ['Salomon', 'Speedcross 6 — Trail Grip', 13499, S, 'footwear trail men', ''],
    ['Adidas', 'Adizero Boston 12 — Tempo', 11999, S, 'footwear road women sale', 'SALE'],
    ['On', 'Cloudsurfer — Cloud Cushion', 16999, S, 'footwear road men women', ''],
    ['Nike', 'Dri-FIT Run Tee — Breathable', 2499, A, 'apparel men', ''],
    ['Adidas', 'Own The Run Shorts', 2299, A, 'apparel men sale', 'SALE'],
    ['Puma', 'Run Favourite Tights', 2999, A, 'apparel women', ''],
    ['Nike', 'Swift Wind Jacket — Packable', 6499, A, 'apparel men women', 'NEW'],
    ['Salomon', 'Sense Aero Singlet', 2799, A, 'apparel trail men women', ''],
    ['Garmin', 'Forerunner 265 — GPS Watch', 38990, X, 'accessories', 'NEW'],
    ['Salomon', 'ADV Skin 12 — Running Vest', 11500, X, 'accessories trail', ''],
    ['Puma', 'Performance Cap', 1299, X, 'accessories sale', 'SALE']
  ];
  const CATS = [['all', 'All'], ['men', 'Men'], ['women', 'Women'], ['footwear', 'Footwear'], ['road', 'Road'], ['trail', 'Trail'], ['apparel', 'Apparel'], ['accessories', 'Accessories'], ['sale', 'Sale']];
  const BRANDS = [...new Set(P.map(p => p[0]))].sort();
  const q = new URLSearchParams(location.search);
  let cat = CATS.some(c => c[0] === q.get('cat')) ? q.get('cat') : (q.get('cat') === 'brands' ? 'all' : 'all');
  let brand = BRANDS.includes(q.get('brand')) ? q.get('brand') : '';
  const $ = s => document.querySelector(s);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const heart = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z"/></svg>';

  const chip = (label, on, attr) => `<button class="tab" ${attr} aria-pressed="${on}">${label}</button>`;
  function render() {
    $('#cats-bar').innerHTML = CATS.map(([k, l]) => chip(l, k === cat, `data-cat="${k}"`)).join('');
    $('#brands').innerHTML = '<span class="filters__label">Brands</span>' + chip('All brands', !brand, 'data-brand=""') + BRANDS.map(b => chip(b, b === brand, `data-brand="${b}"`)).join('');
    const list = P.filter(p => (cat === 'all' || p[4].split(' ').includes(cat)) && (!brand || p[0] === brand));
    const title = (cat === 'all' ? 'Shop all' : CATS.find(c => c[0] === cat)[1]) + (brand ? ' · ' + brand : '');
    $('#shop-title').textContent = title; document.title = title + ' — Paceline';
    $('#shop-count').textContent = list.length + ' product' + (list.length === 1 ? '' : 's');
    $('#none').hidden = !!list.length;
    $('#grid').innerHTML = list.map(([b, n, pr, img, , t]) => `<li class="product"><div class="product__img"><img src="${img}" alt="${esc(b + ' ' + n.split(' — ')[0])}" width="313" height="340" loading="lazy">${t ? `<span class="tag${t === 'SALE' ? ' tag--sale' : ''}">${t}</span>` : ''}<button class="wish" aria-pressed="false" aria-label="Add ${esc(n.split(' — ')[0])} to wishlist">${heart}</button></div><p class="product__brand">${b}</p><h3 class="product__name">${esc(n)}</h3><p class="product__price">${inr(pr)}</p></li>`).join('');
    // let main.js re-bind Add-to-bag / wishlist on the new cards
    document.dispatchEvent(new Event('products:rendered'));
    const u = new URL(location); cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat); brand ? u.searchParams.set('brand', brand) : u.searchParams.delete('brand'); history.replaceState(null, '', u);
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]'), b = e.target.closest('[data-brand]');
    if (c) { cat = c.dataset.cat; render(); }
    if (b) { brand = b.dataset.brand; render(); }
    if (e.target.id === 'reset') { cat = 'all'; brand = ''; render(); }
  });
  render();
  if (q.get('cat') === 'brands') { $('#brands').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#brands').classList.add('flash'); }
})();
