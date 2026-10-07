/* PACELINE — interactions: mobile nav, hero slider, product filter, wishlist, newsletter, stat counters */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile nav */
  const burger = $('#burger'), nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
  });

  /* Hero slider (auto-advance, pauses on hover/focus, respects reduced motion) */
  const slides = $$('.hero__slide'), dots = $$('.dots button');
  if (slides.length) {
    let i = 0, timer;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === i));
    };
    const start = () => { if (!reduced) timer = setInterval(() => show(i + 1), 5000); };
    const stop = () => clearInterval(timer);
    dots.forEach((d, k) => d.addEventListener('click', () => { stop(); show(k); start(); }));
    const hero = $('.hero');
    ['mouseenter', 'focusin'].forEach(ev => hero.addEventListener(ev, stop));
    ['mouseleave', 'focusout'].forEach(ev => hero.addEventListener(ev, start));
    start();
  }

  /* Product filter tabs */
  const tabs = $$('.tab'), products = $$('.product');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    const f = t.dataset.filter;
    products.forEach(p => p.hidden = !p.dataset.tags.split(' ').includes(f));
    if (!products.some(p => !p.hidden)) products.forEach(p => p.hidden = false); // never show an empty grid
  }));

  /* Wishlist toggle */
  /* wishlist toggles are bound in bindProducts() below */

  /* Newsletter validation */
  const form = $('#news-form'), msg = $('#news-msg');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#email');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    msg.classList.toggle('err', !ok);
    msg.textContent = ok ? 'Thanks! Check your inbox for your 10% code.' : 'Please enter a valid email address.';
    input.setAttribute('aria-invalid', !ok);
    if (ok) form.reset(); else input.focus();
  });

  /* Count-up stats when scrolled into view */
  const stats = $$('[data-count]');
  if (stats.length && 'IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      const t0 = performance.now();
      const tick = t => { const p = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(end * p) + (p === 1 ? suf : ''); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: .6 });
    stats.forEach(s => io.observe(s));
  }
})();

/* ==========================================================================
   Interactive UI layer: search, account, cart, booking, toast, link routing
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const inr = n => '₹' + n.toLocaleString('en-IN');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Toast */
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let tt;
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2600); };

  /* Dialog factory (native <dialog>: focus trap + Esc built in) */
  const mk = (id, html, cls = '') => {
    const d = document.createElement('dialog');
    d.id = id; d.className = cls; d.setAttribute('aria-labelledby', id + '-h');
    d.innerHTML = `<div class="dlg">${html}<button class="icon-btn dlg__x" aria-label="Close" data-close>✕</button></div>`;
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    document.body.append(d); return d;
  };

  /* ---- Cart (persisted) ---- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('pl-cart')) || []; } catch (e) {}
  const save = () => { try { localStorage.setItem('pl-cart', JSON.stringify(cart)); } catch (e) {} };
  const cartDlg = mk('cart', `<h2 id="cart-h">Your bag</h2><div class="cart-list" id="cart-list"></div><div class="cart-total"><span>Total</span><span id="cart-total">₹0</span></div><button class="btn btn--dark" id="checkout">Checkout <span aria-hidden="true">→</span></button>`, 'drawer');
  const badge = $('.badge'), cartBtn = $('[aria-label^="Cart"]');
  const renderCart = () => {
    const n = cart.reduce((a, i) => a + i.q, 0);
    if (badge) { badge.textContent = n; badge.hidden = !n; }
    cartBtn?.setAttribute('aria-label', `Cart, ${n} item${n === 1 ? '' : 's'}`);
    $('#cart-list').innerHTML = cart.length ? cart.map((i, k) => `<div class="cart-item"><img src="${esc(i.img || 'assets/img/shoe.webp')}" alt=""><div><h3>${esc(i.name)}</h3><p>${esc(i.brand)} · ${inr(i.price)}</p><div class="qty"><button data-q="${k}" data-d="-1" aria-label="Decrease quantity">−</button><span aria-live="polite">${i.q}</span><button data-q="${k}" data-d="1" aria-label="Increase quantity">+</button></div></div><button class="rm" data-rm="${k}">Remove</button></div>`).join('') : '<p class="cart-empty">Your bag is empty. Go find your next pair.</p>';
    $('#cart-total').textContent = inr(cart.reduce((a, i) => a + i.price * i.q, 0));
  };
  $('#cart-list').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
    if (q) { const it = cart[+q.dataset.q]; it.q += +q.dataset.d; if (it.q < 1) cart.splice(+q.dataset.q, 1); }
    if (r) cart.splice(+r.dataset.rm, 1);
    save(); renderCart();
  });
  $('#checkout').addEventListener('click', () => { if (!cart.length) return say('Add something to your bag first.'); cart = []; save(); renderCart(); cartDlg.close(); say('Order placed (demo). Thanks for running with us!'); });
  cartBtn?.addEventListener('click', () => { renderCart(); cartDlg.showModal(); });

  /* Add-to-cart buttons injected into product cards (re-run when shop.js re-renders the grid) */
  const bindProducts = () => $$('.product').forEach(p => {
    if ($('.add', p)) return;
    const name = $('.product__name', p).textContent, brand = $('.product__brand', p).textContent;
    const price = +$('.product__price', p).textContent.replace(/\D/g, '');
    const img = $('img', p).getAttribute('src');
    const b = document.createElement('button');
    b.className = 'add'; b.textContent = 'Add to bag'; b.setAttribute('aria-label', `Add ${name} to bag`);
    b.addEventListener('click', () => {
      const ex = cart.find(i => i.name === name);
      ex ? ex.q++ : cart.push({ name, brand, price, q: 1, img });
      save(); renderCart(); say(`Added: ${name}`);
      badge?.classList.remove('bump'); void badge?.offsetWidth; badge?.classList.add('bump');
    });
    p.append(b);
    $('.wish', p)?.addEventListener('click', e => e.currentTarget.setAttribute('aria-pressed', e.currentTarget.getAttribute('aria-pressed') !== 'true'));
  });
  bindProducts();
  document.addEventListener('products:rendered', bindProducts);
  renderCart();

  /* ---- Search ---- */
  const index = [['Home', 'index.html'], ['About / Our Story', 'about.html'], ['Road Running', 'index.html#cats'], ['Trail Running', 'index.html#cats'], ['New arrivals', 'index.html#arrivals'], ['Apparel', 'shop.html?cat=apparel'], ['Footwear', 'shop.html?cat=footwear'], ['Accessories', 'shop.html?cat=accessories'], ['Brands', 'shop.html?cat=brands'], ['Sale', 'shop.html?cat=sale'], ...['Hoka','Nike','Asics','Brooks','Salomon','Adidas','On','Puma','Garmin'].map(b => [b + ' (brand)', 'shop.html?brand=' + b]), ...$$('.product').map(p => [$('.product__name', p).textContent, 'index.html#arrivals']), ['Meet the founders', 'about.html#founders'], ['Visit us in Bengaluru', 'about.html#visit']];
  const sDlg = mk('search', `<h2 id="search-h">Search Paceline</h2><label class="field">Search shoes, kit or pages<input id="q" type="search" placeholder="e.g. Vaporfly, trail, founders" autocomplete="off"></label><div class="results" id="results" aria-live="polite"></div>`);
  const results = $('#results');
  const draw = v => {
    const m = index.filter(([t]) => t.toLowerCase().includes(v.toLowerCase())).slice(0, 8);
    results.innerHTML = m.length ? m.map(([t, h]) => `<a href="${h}">${esc(t)} <small>→</small></a>`).join('') : `<p class="cart-empty">No results for “${esc(v)}”.</p>`;
  };
  $('#q').addEventListener('input', e => draw(e.target.value.trim()));
  $('[aria-label="Search"]')?.addEventListener('click', () => { sDlg.showModal(); draw(''); $('#q').focus(); });

  /* ---- Account ---- */
  const aDlg = mk('account', `<h2 id="account-h">Welcome back</h2><p>Sign in to track orders and save favourites.</p><form id="login" novalidate><label class="field">Email<input type="email" id="le" autocomplete="email"></label><label class="field">Password<input type="password" id="lp" autocomplete="current-password"></label><button class="btn btn--dark" type="submit">Sign in</button><p class="dlg__msg" id="lm" role="status"></p></form>`);
  $('[aria-label="Account"]')?.addEventListener('click', () => aDlg.showModal());
  $('#login').addEventListener('submit', e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#le').value) && $('#lp').value.length >= 6;
    $('#lm').textContent = ok ? 'Signed in (demo). Welcome back!' : 'Enter a valid email and a password of 6+ characters.';
    if (ok) setTimeout(() => aDlg.close(), 900);
  });

  /* ---- Gait analysis booking ---- */
  const bDlg = mk('book', `<h2 id="book-h">Book a gait analysis</h2><p>Free, 20 minutes, every Saturday at our Bengaluru store.</p><form id="bookf" novalidate><label class="field">Name<input id="bn" autocomplete="name"></label><label class="field">Email<input type="email" id="be" autocomplete="email"></label><label class="field">Date<input type="date" id="bd"></label><button class="btn btn--dark" type="submit">Confirm booking</button><p class="dlg__msg" id="bm" role="status"></p></form>`);
  $('#bd').min = new Date().toISOString().slice(0, 10);
  $('#bookf').addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('#bn').value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#be').value) && $('#bd').value;
    $('#bm').textContent = ok ? `Booked for ${$('#bd').value}. See you there!` : 'Please fill in your name, a valid email and a date.';
    if (ok) setTimeout(() => { bDlg.close(); e.target.reset(); }, 1200);
  });

  /* ---- Route every placeholder link so nothing is dead ---- */
  const home = /index\.html/.test(location.pathname) || location.pathname.endsWith('/');
  const go = h => home && h.startsWith('index.html#') ? h.slice(10) : h;
  const map = { 'View all collections': 'index.html#cats', 'Shop footwear': 'shop.html?cat=footwear', 'Shop new arrivals': 'index.html#arrivals', 'Sale': 'index.html#arrivals', "Men's": 'index.html#explore', 'Women\'s': 'index.html#explore', 'Newsletter': '#email', 'Store · Bengaluru': 'about.html#visit', 'Gait Analysis': 'book' };
  $$('a[href="#"]').forEach(a => {
    const label = a.textContent.replace(/[→\s]+$/, '').replace(/^Shop\s+(?=Road|Trail|Apparel|Accessories)/i, '').trim();
    const t = map[a.textContent.replace(/[→]/g, '').trim()] || map[label];
    if (t === 'book') a.addEventListener('click', e => { e.preventDefault(); bDlg.showModal(); });
    else if (t) a.setAttribute('href', go(t));
    else a.addEventListener('click', e => { e.preventDefault(); say(`“${label || 'This page'}” is a demo link — coming soon.`); });
  });
  $$('a.btn').forEach(a => { if (/gait/i.test(a.textContent)) a.addEventListener('click', e => { e.preventDefault(); bDlg.showModal(); }); });
})();
