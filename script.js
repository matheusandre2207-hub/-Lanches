// ═══════════════════════════════════════════════════════════════
// +LANCHES — script.js v2  (ES Module)
// ═══════════════════════════════════════════════════════════════

import { initializeApp }    from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ── SUBSTITUA COM SUAS CREDENCIAIS ──────────────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ────────────────────────────────────────────────────────────────

const DEMO_MODE = firebaseConfig.apiKey === 'YOUR_API_KEY';
let auth = null;
if (!DEMO_MODE) {
  try { auth = getAuth(initializeApp(firebaseConfig)); }
  catch (e) { console.warn('[+Lanches] Firebase:', e.message); }
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let currentUser     = null;
let currentRole     = null;
let activeCategory  = 'todos';
let cart            = [];
let orderHistory    = JSON.parse(localStorage.getItem('plusLanches_orders')) || [];
let bannerTimer     = null;
let currentBannerIdx= 0;

let storeData = JSON.parse(localStorage.getItem('plusLanches_store')) || {
  id: 'store_1',
  name: 'Açaí do Bairro',
  img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80'
};

let products = JSON.parse(localStorage.getItem('plusLanches_products')) || [
  { id:1, storeId:'store_1', name:'Açaí Tradicional 500ml', desc:'Açaí puro com granola, leite em pó e morangos frescos.', price:22.00, img:'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80', category:'doces', featured:true },
  { id:2, storeId:'store_1', name:'X-Bacon Especial', desc:'Hambúrguer artesanal 180g com queijo cheddar e bacon crocante.', price:26.90, img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category:'lanches', featured:true },
  { id:3, storeId:'store_1', name:'Combo Família', desc:'2 hambúrgueres + 2 batatas médias + 2 refrigerantes.', price:54.90, img:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', category:'combos', featured:false },
  { id:4, storeId:'store_1', name:'Refrigerante 600ml', desc:'Gelado e refrescante. Escolha sua marca favorita.', price:7.00, img:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', category:'bebidas', featured:false }
];

let stories = JSON.parse(localStorage.getItem('plusLanches_stories')) || [
  { id:1, title:'Promo do Dia',  img:null, gradient:['#D81B60','#9C1B50'], productId:null, active:true },
  { id:2, title:'Novidade',      img:null, gradient:['#4A154B','#6B1B68'], productId:null, active:true },
  { id:3, title:'Combos',        img:null, gradient:['#1B3A4A','#2D6A7F'], productId:null, active:true },
  { id:4, title:'Bebidas',       img:null, gradient:['#1B4A2D','#2D7F4A'], productId:null, active:true },
  { id:5, title:'Doces',         img:null, gradient:['#7B5C00','#BF8A00'], productId:null, active:true },
];

let banners = JSON.parse(localStorage.getItem('plusLanches_banners')) || [
  { id:1, title:'Açaí Especial 500ml', subtitle:'Com granola, morango e leite em pó', price:'R$ 22,00', img:'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80', active:true },
  { id:2, title:'X-Bacon Especial',    subtitle:'Blend artesanal 180g + cheddar + bacon', price:'R$ 26,90', img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', active:true },
];

const CATEGORIES = [
  { id:'todos',   label:'Todos',   icon:'#ic-grid'  },
  { id:'lanches', label:'Lanches', icon:'#ic-burger'},
  { id:'bebidas', label:'Bebidas', icon:'#ic-cup'   },
  { id:'doces',   label:'Doces',   icon:'#ic-cake'  },
  { id:'combos',  label:'Combos',  icon:'#ic-bag'   },
  { id:'porcoes', label:'Porções', icon:'#ic-tag'   },
];

const DISCOVER = [
  { id:'popular',   icon:'#ic-fire',   title:'Mais pedidos',  desc:'Os queridinhos',        color:'#C62828', bg:'#FFEBEE' },
  { id:'promocoes', icon:'#ic-tag',    title:'Promoções',     desc:'Descontos imperdíveis',  color:'#E65100', bg:'#FFF3E0' },
  { id:'novidades', icon:'#ic-star',   title:'Novidades',     desc:'Acabou de chegar',       color:'#4A154B', bg:'#F5EEF5' },
  { id:'combos',    icon:'#ic-bag',    title:'Combos',        desc:'Melhor custo-benefício', color:'#1B4A2D', bg:'#E8F5E9' },
  { id:'bebidas',   icon:'#ic-cup',    title:'Bebidas',       desc:'Frias e refrescantes',   color:'#006064', bg:'#E0F7FA' },
  { id:'doces',     icon:'#ic-cake',   title:'Doces',         desc:'Sobremesas irresistíveis',color:'#880E4F', bg:'#FCE4EC' },
  { id:'porcoes',   icon:'#ic-burger', title:'Lanches',       desc:'Smash, clássico e mais', color:'#33691E', bg:'#F1F8E9' },
  { id:'favoritos', icon:'#ic-heart',  title:'Favoritos',     desc:'Seus escolhidos',        color:'#AD1457', bg:'#FCE4EC' },
];

// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER
// ═══════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('[SW] scope:', r.scope))
      .catch(e => console.error('[SW] error:', e))
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY API — Back button navigation
// ═══════════════════════════════════════════════════════════════
history.replaceState({ screen: 'screen-loading' }, '');

window.addEventListener('popstate', e => {
  const screen = e.state?.screen;
  if (screen && screen !== 'screen-loading') {
    _applyScreen(screen);
  }
  // If no state or loading → browser handles (exit PWA / go to prev page)
});

/**
 * Navigate to a screen, managing browser history.
 * @param {string} id          - Screen element id
 * @param {object} opts
 * @param {boolean} opts.replace - Use replaceState instead of pushState
 */
function switchScreen(id, opts = {}) {
  const { replace = false } = opts;
  _applyScreen(id);
  if (replace) {
    history.replaceState({ screen: id }, '');
  } else {
    history.pushState({ screen: id }, '');
  }
}

function _applyScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  // Main navbar (seller + role screens)
  const showNavbar = ['screen-role', 'screen-vendedor'].includes(id);
  document.getElementById('app-header').style.display = showNavbar ? '' : 'none';

  // Bottom nav (client screens)
  const clientScreens = ['screen-home','screen-search','screen-cliente','screen-cart','screen-orders','screen-profile'];
  const isClient = clientScreens.includes(id);
  document.getElementById('bottom-nav').style.display = isClient ? 'flex' : 'none';

  // Floating cart button (store menu screen only)
  document.getElementById('cart-floating-btn').style.display =
    id === 'screen-cliente' ? 'flex' : 'none';

  // Home mode — removes main-content padding so home is full-width
  document.getElementById('main-content').classList.toggle('home-mode', id === 'screen-home');

  // Update bottom nav active state
  _updateBottomNav(id);

  // Screen-specific setup
  if (id === 'screen-home')    { _loadHomeScreen(); }
  if (id === 'screen-cliente') { _loadClientStore(); updateCartCount(); }
  if (id === 'screen-profile') { _loadProfile(); }
  if (id === 'screen-orders')  { _loadOrders(); }
  if (id === 'screen-vendedor'){ _loadSellerPanel(); }
  if (id === 'screen-search')  { setTimeout(() => document.getElementById('search-main-input')?.focus(), 200); }

  window.scrollTo(0, 0);
}

function _updateBottomNav(id) {
  const map = {
    'screen-home':    'nav-home',
    'screen-search':  'nav-search',
    'screen-cart':    'nav-orders',
    'screen-orders':  'nav-orders',
    'screen-profile': 'nav-profile',
  };
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const active = map[id];
  if (active) document.getElementById(active)?.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// FIREBASE AUTH STATE
// ═══════════════════════════════════════════════════════════════
if (DEMO_MODE) {
  setTimeout(() => {
    _hideLoading();
    switchScreen('screen-role', { replace: true });
    showToast('Modo demo — configure o Firebase para login real', 'warning');
  }, 800);
} else {
  onAuthStateChanged(auth, user => {
    currentUser = user;
    _hideLoading();
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      document.getElementById('user-greeting').textContent = name;
      updateHeaderButtons();
      const cur = document.querySelector('.screen.active')?.id;
      if (!cur || cur === 'screen-loading' || cur === 'screen-login') {
        switchScreen('screen-role', { replace: true });
      }
    } else {
      switchScreen('screen-login', { replace: true });
    }
  });
}

function _hideLoading() {
  const el = document.getElementById('screen-loading');
  el.style.transition = 'opacity .35s ease';
  el.style.opacity = '0';
  setTimeout(() => el.classList.remove('active'), 380);
}

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
function updateHeaderButtons() {
  document.getElementById('header-actions').innerHTML = `
    <button class="btn-logout" onclick="logout()">
      <svg class="icon-sm"><use href="#ic-logout"/></svg>
      Sair
    </button>`;
}

// ═══════════════════════════════════════════════════════════════
// AUTH — tab switch
// ═══════════════════════════════════════════════════════════════
function switchAuthTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`tab-${t}`).setAttribute('aria-selected', t === tab);
    document.getElementById(`form-${t}`).classList.toggle('hidden', t !== tab);
  });
  document.getElementById('form-forgot').classList.add('hidden');
  document.getElementById('auth-tabs').style.display = '';
  _clearErrors();
}

function showForgotPassword() {
  document.getElementById('form-login').classList.add('hidden');
  document.getElementById('form-forgot').classList.remove('hidden');
  document.getElementById('auth-tabs').style.display = 'none';
}
function hideForgotPassword() {
  document.getElementById('form-forgot').classList.add('hidden');
  document.getElementById('form-login').classList.remove('hidden');
  document.getElementById('auth-tabs').style.display = '';
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  btn.querySelector('use').setAttribute('href', show ? '#ic-eye-off' : '#ic-eye');
}

// ── Error helpers ──
function _clearErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.input-error-msg').forEach(el => el.remove());
}
function _setInputError(id, msg) {
  const input = document.getElementById(id);
  if (!input) return;
  input.classList.add('input-error');
  if (msg) {
    const wrap = input.closest('.form-group');
    if (wrap && !wrap.querySelector('.input-error-msg')) {
      const span = Object.assign(document.createElement('span'), { className:'input-error-msg', textContent: msg });
      wrap.appendChild(span);
    }
  }
}
function _fbMsg(code) {
  return ({
    'auth/user-not-found':       'Nenhuma conta com este e-mail.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/invalid-credential':   'E-mail ou senha incorretos.',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/weak-password':        'Senha precisa ter ao menos 6 caracteres.',
    'auth/too-many-requests':    'Muitas tentativas. Aguarde e tente novamente.',
    'auth/network-request-failed':'Erro de rede. Verifique sua conexão.',
  })[code] || 'Erro inesperado. Tente novamente.';
}

// ── Login ──
async function handleLogin(e) {
  e.preventDefault();
  if (DEMO_MODE) { switchScreen('screen-role', { replace: true }); return; }
  _clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('btn-login-submit');
  _btnLoad(btn, true, 'Entrando...');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Login realizado!', 'success');
  } catch (err) {
    showToast(_fbMsg(err.code), 'error');
    if (['auth/user-not-found','auth/invalid-credential','auth/invalid-email'].includes(err.code))
      _setInputError('login-email', '');
    if (['auth/wrong-password','auth/invalid-credential'].includes(err.code))
      _setInputError('login-password', 'Senha incorreta');
  } finally { _btnLoad(btn, false, 'Entrar'); }
}

// ── Register ──
async function handleRegister(e) {
  e.preventDefault();
  if (DEMO_MODE) { switchScreen('screen-role', { replace: true }); return; }
  _clearErrors();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn      = document.getElementById('btn-register-submit');
  if (password !== confirm) {
    _setInputError('reg-confirm', 'As senhas não coincidem');
    showToast('As senhas não coincidem.', 'error'); return;
  }
  _btnLoad(btn, true, 'Criando conta...');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    showToast(`Bem-vindo, ${name || email.split('@')[0]}!`, 'success');
  } catch (err) {
    showToast(_fbMsg(err.code), 'error');
    if (err.code === 'auth/email-already-in-use') _setInputError('reg-email', 'E-mail já em uso');
    if (err.code === 'auth/weak-password') _setInputError('reg-password', 'Senha fraca');
  } finally { _btnLoad(btn, false, 'Criar Conta'); }
}

// ── Forgot ──
async function handleForgotPassword() {
  if (DEMO_MODE) { showToast('Configure o Firebase para usar esta função.', 'warning'); return; }
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { _setInputError('forgot-email', 'Digite seu e-mail'); return; }
  const btn = document.getElementById('btn-forgot-submit');
  _btnLoad(btn, true, 'Enviando...');
  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Link enviado! Verifique seu e-mail.', 'success');
    hideForgotPassword();
  } catch (err) { showToast(_fbMsg(err.code), 'error'); }
  finally { _btnLoad(btn, false, 'Enviar Link'); }
}

// ── Logout ──
async function logout() {
  cart = []; updateCartCount();
  if (DEMO_MODE || !auth) { switchScreen('screen-login', { replace: true }); return; }
  try { await signOut(auth); } catch (_) {}
}

function switchRole() {
  switchScreen('screen-role', { replace: true });
}

// ═══════════════════════════════════════════════════════════════
// ROLE SELECTION
// ═══════════════════════════════════════════════════════════════
function selectRole(role) {
  currentRole = role;
  if (role === 'vendedor') {
    updateHeaderButtons();
    switchScreen('screen-vendedor', { replace: true });
  } else {
    switchScreen('screen-home', { replace: true });
  }
}

// ═══════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════
function _loadHomeScreen() {
  _renderCategories();
  _renderBanners();
  _renderHighlights();
  _renderStories();
  _renderDiscover();
  _renderPopular();
}

// ── Categories ──
function _renderCategories() {
  const el = document.getElementById('categories-scroll');
  el.innerHTML = CATEGORIES.map(c => `
    <button class="cat-btn ${c.id === activeCategory ? 'active' : ''}"
      onclick="filterCategory('${c.id}')" role="tab"
      aria-selected="${c.id === activeCategory}">
      <div class="cat-icon-wrap">
        <svg class="cat-icon"><use href="${c.icon}"/></svg>
      </div>
      ${c.label}
    </button>`).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  _renderCategories();
  _renderHighlights();
  _renderPopular();
}

// ── Banner Carousel ──
function _renderBanners() {
  const track = document.getElementById('banner-track');
  const dots  = document.getElementById('banner-dots');
  const active = banners.filter(b => b.active);
  if (!active.length) {
    // Default gradient banner when no banners exist
    track.innerHTML = `
      <div class="banner-slide" style="background:linear-gradient(135deg,var(--purple-main),var(--purple-light));">
        <div class="banner-slide-content">
          <span class="banner-tag">Bem-vindo</span>
          <div class="banner-title">+Lanches</div>
          <div class="banner-subtitle">Delivery de qualidade</div>
          <button class="banner-cta-btn" onclick="switchScreen('screen-cliente')">
            Ver cardápio <svg width="12" height="12"><use href="#ic-forward"/></svg>
          </button>
        </div>
      </div>`;
    dots.innerHTML = '';
    return;
  }

  track.innerHTML = active.map(b => `
    <div class="banner-slide" style="background:linear-gradient(135deg,var(--purple-main),var(--purple-dark));">
      ${b.img ? `<img src="${b.img}" class="banner-img" alt="${b.title}" loading="lazy">` : ''}
      <div class="banner-slide-content">
        <span class="banner-tag">Promoção</span>
        <div class="banner-title">${b.title}</div>
        ${b.subtitle ? `<div class="banner-subtitle">${b.subtitle}</div>` : ''}
        ${b.price    ? `<div class="banner-price">${b.price}</div>` : ''}
        <button class="banner-cta-btn" onclick="switchScreen('screen-cliente')">
          Pedir agora <svg width="12" height="12"><use href="#ic-forward"/></svg>
        </button>
      </div>
    </div>`).join('');

  dots.innerHTML = active.map((_, i) =>
    `<button class="banner-dot ${i===0?'active':''}" onclick="scrollToBanner(${i})" aria-label="Banner ${i+1}"></button>`
  ).join('');

  // Auto-scroll
  clearInterval(bannerTimer);
  if (active.length > 1) {
    currentBannerIdx = 0;
    bannerTimer = setInterval(() => {
      currentBannerIdx = (currentBannerIdx + 1) % active.length;
      scrollToBanner(currentBannerIdx);
    }, 4500);
  }

  // Sync dots on manual scroll
  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / track.offsetWidth);
    _setBannerDot(idx);
  }, { passive: true });
}

function scrollToBanner(idx) {
  const track = document.getElementById('banner-track');
  track.scrollTo({ left: idx * track.offsetWidth, behavior:'smooth' });
  _setBannerDot(idx);
  currentBannerIdx = idx;
}

function _setBannerDot(idx) {
  document.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i===idx));
}

// ── Highlights (Destaques) ──
function _renderHighlights() {
  const el = document.getElementById('highlights-list');
  let items = products.filter(p => p.storeId === storeData.id && p.featured);
  if (activeCategory !== 'todos') items = products.filter(p => p.storeId === storeData.id && p.category === activeCategory);
  if (!items.length) items = products.filter(p => p.storeId === storeData.id).slice(0, 6);

  el.innerHTML = items.map(p => `
    <div class="highlight-card">
      <img src="${p.img}" class="highlight-img" alt="${p.name}" loading="lazy">
      <div class="highlight-info">
        <div class="highlight-name">${p.name}</div>
        <div class="highlight-price">R$ ${_fmt(p.price)}</div>
        <button class="highlight-add-btn" onclick="addToCart(${p.id})" aria-label="Adicionar ${p.name}">
          <svg><use href="#ic-plus"/></svg>
        </button>
      </div>
    </div>`).join('');
}

// ── Stories ──
function _renderStories() {
  const el = document.getElementById('stories-list');
  const activeStories = stories.filter(s => s.active);
  const section = document.getElementById('stories-section');

  if (!activeStories.length) { section.style.display = 'none'; return; }
  section.style.display = '';

  el.innerHTML = activeStories.map(s => `
    <div class="story-item" onclick="${s.productId ? `addToCart(${s.productId})` : "switchScreen('screen-cliente')"}"
      role="button" tabindex="0" aria-label="${s.title}">
      <div class="story-thumb">
        ${s.img
          ? `<img src="${s.img}" alt="${s.title}">`
          : `<div class="story-gradient" style="background:linear-gradient(135deg,${s.gradient[0]},${s.gradient[1]})"></div>`}
        <div class="story-title-over"><span>${s.title}</span></div>
      </div>
      <span class="story-label">${s.title}</span>
    </div>`).join('');
}

// ── Discover ──
function _renderDiscover() {
  document.getElementById('discover-grid').innerHTML = DISCOVER.map(d => `
    <div class="discover-card" onclick="filterCategory('${d.id}')" role="button" tabindex="0">
      <div class="discover-icon-wrap" style="background:${d.bg}">
        <svg style="color:${d.color}"><use href="${d.icon}"/></svg>
      </div>
      <div class="discover-card-info">
        <div class="discover-card-title">${d.title}</div>
        <div class="discover-card-desc">${d.desc}</div>
      </div>
    </div>`).join('');
}

// ── Popular (filtered products list) ──
function _renderPopular() {
  const el    = document.getElementById('popular-list');
  const title = document.getElementById('popular-title');
  let items   = products.filter(p => p.storeId === storeData.id);

  if (activeCategory !== 'todos') {
    items = items.filter(p => p.category === activeCategory);
    title.textContent = CATEGORIES.find(c => c.id === activeCategory)?.label || 'Produtos';
  } else {
    title.textContent = 'Mais pedidos';
  }

  if (!items.length) {
    el.innerHTML = '<div class="empty-state">Nenhum produto nesta categoria ainda.</div>';
    return;
  }
  el.innerHTML = items.map(p => `
    <div class="popular-item">
      <img src="${p.img}" class="popular-img" alt="${p.name}" loading="lazy">
      <div class="popular-info">
        <div class="popular-name">${p.name}</div>
        <div class="popular-desc">${p.desc}</div>
        <div class="popular-price">R$ ${_fmt(p.price)}</div>
      </div>
      <button class="popular-add-btn" onclick="addToCart(${p.id})" aria-label="Adicionar ${p.name}">
        <svg><use href="#ic-plus"/></svg>
      </button>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════
function goToSearch() {
  switchScreen('screen-search');
  document.getElementById('search-results').innerHTML = `
    <div class="search-empty">
      <svg><use href="#ic-search"/></svg>
      <p>Digite para buscar no cardápio</p>
    </div>`;
}

function searchProducts(query) {
  const el = document.getElementById('search-results');
  if (!query?.trim()) {
    el.innerHTML = `<div class="search-empty"><svg><use href="#ic-search"/></svg><p>Digite para buscar</p></div>`;
    return;
  }
  const q     = query.toLowerCase();
  const found = products.filter(p =>
    p.storeId === storeData.id &&
    (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
  );
  if (!found.length) {
    el.innerHTML = `<div class="search-empty"><svg><use href="#ic-search"/></svg><p>Nenhum resultado para "${query}"</p></div>`;
    return;
  }
  el.innerHTML = found.map(p => `
    <div class="popular-item" style="margin-bottom:10px">
      <img src="${p.img}" class="popular-img" alt="${p.name}" loading="lazy">
      <div class="popular-info">
        <div class="popular-name">${p.name}</div>
        <div class="popular-desc">${p.desc}</div>
        <div class="popular-price">R$ ${_fmt(p.price)}</div>
      </div>
      <button class="popular-add-btn" onclick="addToCart(${p.id})" aria-label="Adicionar ${p.name}">
        <svg><use href="#ic-plus"/></svg>
      </button>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// CLIENT — Store View
// ═══════════════════════════════════════════════════════════════
function _loadClientStore() {
  document.getElementById('client-store-header').innerHTML = `
    <img src="${storeData.img}" class="store-banner-img" alt="${storeData.name}">
    <div class="store-banner-info">
      <h2>${storeData.name}</h2>
      <span class="store-status-badge">
        <span class="status-dot"></span> Aberto · Entrega e Retirada
      </span>
    </div>`;
  const list = document.getElementById('client-products-list');
  const items= products.filter(p => p.storeId === storeData.id);
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Cardápio vazio. Volte em breve!</div>'; return;
  }
  list.innerHTML = items.map(p => `
    <div class="product-card">
      <img src="${p.img}" class="product-img" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-price">R$ ${_fmt(p.price)}</div>
        <button class="btn-add-cart" onclick="addToCart(${p.id})">
          <svg width="15" height="15"><use href="#ic-plus"/></svg> Adicionar
        </button>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════
function addToCart(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  cart.push(p);
  updateCartCount();
  showToast(`${p.name} adicionado!`, 'success');
  const badge = document.getElementById('cart-count');
  badge.classList.add('bump');
  badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once:true });
}

function updateCartCount() {
  const n = cart.length;
  document.getElementById('cart-count').textContent = n;
  // Nav badge
  const navBadge = document.getElementById('nav-orders-badge');
  if (navBadge) { navBadge.textContent = n; navBadge.classList.toggle('hidden', n === 0); }
}

function goToCart() {
  renderCart();
  switchScreen('screen-cart');
}

function renderCart() {
  const list  = document.getElementById('cart-items-list');
  const total = document.getElementById('cart-total-value');
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty">Sua sacola está vazia.</div>';
    total.textContent = 'R$ 0,00'; return;
  }
  let sub = 0;
  list.innerHTML = cart.map((item,i) => {
    sub += item.price;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">R$ ${_fmt(item.price)}</div>
        </div>
        <button class="btn-remove-cart" onclick="removeFromCart(${i})" aria-label="Remover">
          <svg><use href="#ic-trash"/></svg>
        </button>
      </div>`;
  }).join('');
  const orderType   = document.querySelector('input[name="order-type"]:checked')?.value || 'entrega';
  const deliveryFee = orderType === 'entrega' ? 5 : 0;
  if (orderType === 'entrega') {
    list.innerHTML += `<div class="cart-delivery-row"><span>Taxa de entrega</span><span>R$ 5,00</span></div>`;
  }
  total.textContent = `R$ ${_fmt(sub + deliveryFee)}`;
}

function removeFromCart(index) { cart.splice(index,1); renderCart(); updateCartCount(); }

// ── Checkout ──
async function checkout() {
  if (!cart.length) { showToast('Sua sacola está vazia!', 'error'); return; }
  const btn      = document.getElementById('btn-checkout');
  const orderType= document.querySelector('input[name="order-type"]:checked').value;
  const payment  = document.querySelector('input[name="payment"]:checked').value;
  _btnLoad(btn, true, 'Processando...');
  await new Promise(r => setTimeout(r, 1200));

  // Save to history
  const sub = cart.reduce((s,i) => s+i.price, 0);
  const fee  = orderType === 'entrega' ? 5 : 0;
  orderHistory.unshift({
    id: Date.now(), date: new Date().toLocaleDateString('pt-BR'),
    items: cart.map(i => i.name), total: sub+fee,
    type: orderType, payment, status:'Entregue'
  });
  localStorage.setItem('plusLanches_orders', JSON.stringify(orderHistory));

  _btnLoad(btn, false, 'Finalizar Pedido');
  showToast(`Pedido feito! ${orderType==='entrega'?'Entrega':'Retirada'} · ${payment}`, 'success');
  cart = []; updateCartCount();
  setTimeout(() => switchScreen('screen-home'), 600);
}

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════
function goToOrders() { switchScreen('screen-orders'); }

function _loadOrders() {
  const el = document.getElementById('orders-content');
  if (!orderHistory.length) {
    el.innerHTML = `
      <div class="empty-state">
        <svg><use href="#ic-orders"/></svg>
        <p style="font-weight:600;font-size:.95rem;color:var(--text-dark);margin-bottom:6px">Nenhum pedido ainda</p>
        <p>Faça seu primeiro pedido e ele aparecerá aqui!</p>
        <button class="btn-primary" style="margin:16px auto 0;display:flex" onclick="switchScreen('screen-home')">
          <svg class="icon-sm"><use href="#ic-home"/></svg> Ir ao Cardápio
        </button>
      </div>`; return;
  }
  el.innerHTML = orderHistory.map(o => `
    <div class="order-history-card">
      <div class="order-history-header">
        <div>
          <div style="font-size:.85rem;font-weight:600;color:var(--text-dark)">${o.date}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${o.type==='entrega'?'Entrega':'Retirada'} · ${o.payment}</div>
        </div>
        <span class="order-status-badge delivered">${o.status||'Entregue'}</span>
      </div>
      <div class="order-history-body">
        ${o.items.map(name=>`<div class="order-history-item">• ${name}</div>`).join('')}
        <div class="order-history-total">R$ ${_fmt(o.total)}</div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════
function goToProfile() { switchScreen('screen-profile'); }

function _loadProfile() {
  const name  = currentUser?.displayName || (DEMO_MODE ? 'Usuário Demo' : 'Visitante');
  const email = currentUser?.email || (DEMO_MODE ? 'demo@pluslanches.app' : '');
  const initials = name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('profile-avatar').textContent = initials || '?';
  document.getElementById('profile-name').textContent   = name;
  document.getElementById('profile-email').textContent  = email;
}

// ═══════════════════════════════════════════════════════════════
// SELLER PANEL
// ═══════════════════════════════════════════════════════════════
function _loadSellerPanel() {
  document.getElementById('store-name').value = storeData.name || '';
  _renderSellerProducts();
  _renderSellerBanners();
  _renderSellerStories();
}

// ── Store ──
async function saveStore(e) {
  e.preventDefault();
  const fileInput = document.getElementById('store-img');
  const btn = e.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Salvando...');
  try {
    if (fileInput.files.length) storeData.img = await _fileToBase64(fileInput.files[0]);
    storeData.name = document.getElementById('store-name').value.trim();
    storeData.id   = storeData.id || 'store_1';
    localStorage.setItem('plusLanches_store', JSON.stringify(storeData));
    showToast('Loja salva!', 'success');
  } catch (_) { showToast('Erro ao salvar.', 'error'); }
  finally { _btnLoad(btn, false, 'Salvar Loja'); }
}

// ── Products ──
async function addItem(e) {
  e.preventDefault();
  const fileInput = document.getElementById('item-img');
  if (!fileInput.files.length) { showToast('Selecione uma imagem para o produto.', 'error'); return; }
  const btn = e.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Adicionando...');
  try {
    products.push({
      id:       Date.now(),
      storeId:  storeData.id,
      name:     document.getElementById('item-name').value.trim(),
      desc:     document.getElementById('item-desc').value.trim(),
      category: document.getElementById('item-category').value,
      price:    parseFloat(document.getElementById('item-price').value),
      img:      await _fileToBase64(fileInput.files[0]),
      featured: document.getElementById('item-featured').checked
    });
    _saveProducts();
    e.target.reset();
    _resetPreview('item-img-preview', 'item-img-label', 'Foto');
    _renderSellerProducts();
    showToast('Item adicionado!', 'success');
  } catch (_) { showToast('Erro ao adicionar.', 'error'); }
  finally { _btnLoad(btn, false, 'Cadastrar Item'); }
}

function removeProduct(id) {
  if (!confirm('Remover este produto?')) return;
  products = products.filter(p => p.id !== id);
  _saveProducts(); _renderSellerProducts();
  showToast('Produto removido.', 'info');
}

function toggleFeatured(id) {
  const p = products.find(x => x.id === id);
  if (p) { p.featured = !p.featured; _saveProducts(); }
}

function _saveProducts() { localStorage.setItem('plusLanches_products', JSON.stringify(products)); }

function _renderSellerProducts() {
  const el   = document.getElementById('seller-products-list');
  const mine = products.filter(p => p.storeId === storeData.id);
  if (!mine.length) { el.innerHTML = '<div class="empty-state">Nenhum produto cadastrado.</div>'; return; }
  el.innerHTML = mine.map(p => `
    <div class="product-card">
      <img src="${p.img}" class="product-img" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-price">R$ ${_fmt(p.price)}</div>
        <label class="featured-toggle">
          <input type="checkbox" ${p.featured?'checked':''} onchange="toggleFeatured(${p.id})">
          <span>Destaque na Home</span>
        </label>
        <button class="btn-danger" onclick="removeProduct(${p.id})">
          <svg><use href="#ic-trash"/></svg> Remover
        </button>
      </div>
    </div>`).join('');
}

// ── Banners ──
async function addBanner(e) {
  e.preventDefault();
  const fileInput = document.getElementById('banner-img');
  const btn = e.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Adicionando...');
  try {
    banners.push({
      id:       Date.now(),
      title:    document.getElementById('banner-title').value.trim(),
      subtitle: document.getElementById('banner-subtitle').value.trim(),
      price:    document.getElementById('banner-price').value.trim(),
      img:      fileInput.files.length ? await _fileToBase64(fileInput.files[0]) : null,
      active:   true
    });
    localStorage.setItem('plusLanches_banners', JSON.stringify(banners));
    e.target.reset();
    _resetPreview('banner-img-preview', 'banner-img-label', 'Escolher imagem');
    _renderSellerBanners();
    showToast('Banner adicionado!', 'success');
  } catch (_) { showToast('Erro ao adicionar banner.', 'error'); }
  finally { _btnLoad(btn, false, 'Adicionar Banner'); }
}

function removeBanner(id) {
  banners = banners.filter(b => b.id !== id);
  localStorage.setItem('plusLanches_banners', JSON.stringify(banners));
  _renderSellerBanners(); showToast('Banner removido.', 'info');
}

function _renderSellerBanners() {
  const el = document.getElementById('banners-list');
  if (!banners.length) { el.innerHTML = '<div class="empty-state" style="padding:12px 0">Nenhum banner. Adicione acima.</div>'; return; }
  el.innerHTML = banners.map(b => `
    <div class="banner-mgr-item">
      ${b.img ? `<img src="${b.img}" class="story-mgr-thumb" alt="${b.title}">` : `<div class="story-mgr-thumb"></div>`}
      <div class="story-mgr-info">
        <div class="story-mgr-title">${b.title}</div>
        ${b.price ? `<div class="story-mgr-meta">${b.price}</div>` : ''}
      </div>
      <button class="btn-remove-cart" onclick="removeBanner(${b.id})"><svg><use href="#ic-trash"/></svg></button>
    </div>`).join('');
}

// ── Stories ──
async function addStory(e) {
  e.preventDefault();
  const fileInput = document.getElementById('story-img');
  const btn = e.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Adicionando...');
  const GRADS = [
    ['#D81B60','#9C1B50'], ['#4A154B','#6B1B68'], ['#1B3A4A','#2D6A7F'],
    ['#1B4A2D','#2D7F4A'], ['#7B5C00','#BF8A00'], ['#C62828','#E53935']
  ];
  const grad = GRADS[stories.length % GRADS.length];
  try {
    stories.push({
      id:       Date.now(),
      title:    document.getElementById('story-title').value.trim(),
      img:      fileInput.files.length ? await _fileToBase64(fileInput.files[0]) : null,
      gradient: grad,
      productId:null, active:true
    });
    localStorage.setItem('plusLanches_stories', JSON.stringify(stories));
    e.target.reset();
    _resetPreview('story-img-preview', 'story-img-label', 'Escolher imagem');
    _renderSellerStories();
    showToast('Story adicionado!', 'success');
  } catch (_) { showToast('Erro ao adicionar story.', 'error'); }
  finally { _btnLoad(btn, false, 'Adicionar Story'); }
}

function removeStory(id) {
  stories = stories.filter(s => s.id !== id);
  localStorage.setItem('plusLanches_stories', JSON.stringify(stories));
  _renderSellerStories(); showToast('Story removido.', 'info');
}

function _renderSellerStories() {
  const el = document.getElementById('stories-mgr-list');
  if (!stories.length) { el.innerHTML = '<div class="empty-state" style="padding:12px 0">Nenhum story. Adicione acima.</div>'; return; }
  el.innerHTML = stories.map(s => `
    <div class="story-mgr-item">
      <div class="story-mgr-thumb" style="background:linear-gradient(135deg,${s.gradient[0]},${s.gradient[1]})">
        ${s.img ? `<img src="${s.img}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : ''}
      </div>
      <div class="story-mgr-info">
        <div class="story-mgr-title">${s.title}</div>
        <div class="story-mgr-meta">${s.active ? 'Ativo' : 'Inativo'}</div>
      </div>
      <button class="btn-remove-cart" onclick="removeStory(${s.id})"><svg><use href="#ic-trash"/></svg></button>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function previewImage(input, previewId, wrapId, labelId) {
  if (!input.files?.length) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById(previewId);
    if (preview) { preview.src = e.target.result; preview.classList.add('visible'); }
    const label = document.getElementById(labelId);
    if (label) label.textContent = input.files[0].name;
  };
  reader.readAsDataURL(input.files[0]);
}

function _resetPreview(previewId, labelId, defaultLabel) {
  const p = document.getElementById(previewId);
  if (p) { p.src=''; p.classList.remove('visible'); }
  const l = document.getElementById(labelId);
  if (l) l.textContent = defaultLabel;
}

function _fileToBase64(file) {
  return new Promise((res,rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result);
    r.onerror = rej;
  });
}

function _btnLoad(btn, loading, label) {
  const span = btn?.querySelector('.btn-label');
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
  if (span && label) span.textContent = label;
}

function _fmt(n) { return Number(n).toFixed(2).replace('.', ','); }

function showToast(message, type='info') {
  const container = document.getElementById('toast-container');
  const iconMap   = { success:'#ic-check', error:'#ic-x', warning:'#ic-pix', info:'#ic-check' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<svg width="16" height="16"><use href="${iconMap[type]||'#ic-check'}"/></svg><span>${message}</span>`;
  container.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')));
  setTimeout(() => {
    t.classList.remove('visible');
    t.addEventListener('transitionend', () => t.remove(), { once:true });
  }, 3600);
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL SCOPE (onclick= handlers)
// ═══════════════════════════════════════════════════════════════
Object.assign(window, {
  switchScreen, switchAuthTab, handleLogin, handleRegister,
  handleForgotPassword, showForgotPassword, hideForgotPassword,
  togglePassword, selectRole, logout, switchRole,
  saveStore, addItem, removeProduct, toggleFeatured,
  addBanner, removeBanner, addStory, removeStory,
  previewImage, filterCategory, searchProducts,
  addToCart, goToCart, renderCart, removeFromCart, checkout,
  goToSearch, goToOrders, goToProfile,
  scrollToBanner, showToast, updateCartCount,
});