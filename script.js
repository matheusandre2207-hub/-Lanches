// ═══════════════════════════════════════════════════════════════
// +LANCHES — script.js (ES Module)
// ═══════════════════════════════════════════════════════════════
//
// ⚠️  CONFIGURAÇÃO FIREBASE
// Acesse: https://console.firebase.google.com
// Crie um projeto → Adicionar app Web → copie o firebaseConfig abaixo.
// Depois ative: Authentication → Métodos de login → E-mail/senha
// ═══════════════════════════════════════════════════════════════

import { initializeApp }               from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ── SUBSTITUA COM SUAS CREDENCIAIS ─────────────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ───────────────────────────────────────────────────────────────

const DEMO_MODE = firebaseConfig.apiKey === 'YOUR_API_KEY';

let auth = null;
if (!DEMO_MODE) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.warn('[+Lanches] Firebase init failed:', e.message);
  }
}

// ─── App State ────────────────────────────────────────────────
let currentUser  = null;
let currentRole  = null;
let selectedStoreId = null;
let cart = [];

let storeData = JSON.parse(localStorage.getItem('plusLanches_store')) || {
  id: 'store_1',
  name: 'Açaí do Bairro',
  img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80'
};

let products = JSON.parse(localStorage.getItem('plusLanches_products')) || [
  {
    id: 1,
    storeId: 'store_1',
    name: 'Açaí Tradicional 500ml',
    desc: 'Açaí puro com granola, leite em pó e morangos frescos.',
    price: 22.00,
    img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80'
  }
];

// ─── Service Worker ───────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('[SW] Registered:', r.scope))
      .catch(e => console.error('[SW] Error:', e));
  });
}

// ─── Firebase Auth State ──────────────────────────────────────
if (DEMO_MODE) {
  // Modo Demo: sem Firebase — acesso direto para testes
  setTimeout(() => {
    updateHeaderButtons();
    document.getElementById('user-greeting').textContent = 'Demo';
    _hideLoading();
    switchScreen('screen-role');
    showToast('Modo demo — configure o Firebase para login real', 'warning');
  }, 900);
} else {
  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      document.getElementById('user-greeting').textContent = name;
      updateHeaderButtons();
      const cur = document.querySelector('.screen.active')?.id;
      if (!cur || cur === 'screen-loading' || cur === 'screen-login') {
        switchScreen('screen-role');
      }
    } else {
      if (document.querySelector('.screen.active')?.id === 'screen-loading') {
        switchScreen('screen-login');
      }
    }
    _hideLoading();
  });
}

// ─── Loading ──────────────────────────────────────────────────
function _hideLoading() {
  const el = document.getElementById('screen-loading');
  el.style.transition = 'opacity .4s ease';
  el.style.opacity = '0';
  setTimeout(() => el.classList.remove('active'), 420);
}

// ─── Screen Navigation ────────────────────────────────────────
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s.id !== id) s.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  const noHeader = ['screen-loading', 'screen-login'];
  document.getElementById('app-header').style.display =
    noHeader.includes(id) ? 'none' : '';

  const cartBtn = document.getElementById('cart-floating-btn');
  cartBtn.style.display = id === 'screen-cliente' ? 'flex' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Header ───────────────────────────────────────────────────
function updateHeaderButtons() {
  document.getElementById('header-actions').innerHTML = `
    <button class="btn-logout" onclick="logout()">
      <svg class="icon-sm"><use href="#ic-logout"/></svg>
      Sair
    </button>`;
}

// ─── Auth: Tab Switch ─────────────────────────────────────────
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

// ─── Auth: Forgot password ────────────────────────────────────
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

// ─── Auth: Password Toggle ────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const use   = btn.querySelector('use');
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  use.setAttribute('href', show ? '#ic-eye-off' : '#ic-eye');
}

// ─── Auth: Error helpers ──────────────────────────────────────
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
      const span = document.createElement('span');
      span.className = 'input-error-msg';
      span.textContent = msg;
      wrap.appendChild(span);
    }
  }
}
function _fbMsg(code) {
  const map = {
    'auth/user-not-found':        'Nenhuma conta com este e-mail.',
    'auth/wrong-password':        'Senha incorreta.',
    'auth/invalid-credential':    'E-mail ou senha incorretos.',
    'auth/invalid-email':         'E-mail inválido.',
    'auth/email-already-in-use':  'Este e-mail já está cadastrado.',
    'auth/weak-password':         'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests':     'Muitas tentativas. Aguarde e tente novamente.',
    'auth/network-request-failed':'Erro de rede. Verifique sua conexão.',
  };
  return map[code] || 'Ocorreu um erro. Tente novamente.';
}

// ─── Auth: Login ──────────────────────────────────────────────
async function handleLogin(event) {
  event.preventDefault();
  if (DEMO_MODE) { switchScreen('screen-role'); return; }
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
  } finally {
    _btnLoad(btn, false, 'Entrar');
  }
}

// ─── Auth: Register ───────────────────────────────────────────
async function handleRegister(event) {
  event.preventDefault();
  if (DEMO_MODE) { switchScreen('screen-role'); return; }
  _clearErrors();

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn      = document.getElementById('btn-register-submit');

  if (password !== confirm) {
    _setInputError('reg-confirm', 'As senhas não coincidem');
    showToast('As senhas não coincidem.', 'error');
    return;
  }

  _btnLoad(btn, true, 'Criando conta...');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    showToast(`Bem-vindo, ${name || email.split('@')[0]}!`, 'success');
  } catch (err) {
    showToast(_fbMsg(err.code), 'error');
    if (err.code === 'auth/email-already-in-use') _setInputError('reg-email', 'E-mail já em uso');
    if (err.code === 'auth/weak-password')         _setInputError('reg-password', 'Senha fraca');
  } finally {
    _btnLoad(btn, false, 'Criar Conta');
  }
}

// ─── Auth: Forgot ─────────────────────────────────────────────
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
  } catch (err) {
    showToast(_fbMsg(err.code), 'error');
  } finally {
    _btnLoad(btn, false, 'Enviar Link');
  }
}

// ─── Auth: Logout ─────────────────────────────────────────────
async function logout() {
  cart = [];
  updateCartCount();
  currentRole = null;
  if (DEMO_MODE || !auth) {
    switchScreen('screen-login');
    return;
  }
  try {
    await signOut(auth);
    showToast('Saiu com sucesso.', 'success');
  } catch (_) { /* ignore */ }
}

// ─── Role Selection ───────────────────────────────────────────
function selectRole(role) {
  currentRole = role;
  if (role === 'vendedor') {
    _loadSellerPanel();
    switchScreen('screen-vendedor');
  } else {
    _loadStoresList();
    switchScreen('screen-stores-list');
  }
}

// ─── Button Loading Helper ────────────────────────────────────
function _btnLoad(btn, loading, label) {
  const span = btn.querySelector('.btn-label');
  if (loading) {
    btn.disabled = true;
    btn.classList.add('loading');
    if (span && label) span.textContent = label;
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (span && label) span.textContent = label;
  }
}

// ─── Toast System ─────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const iconMap   = { success:'#ic-check', error:'#ic-x', warning:'#ic-pix', info:'#ic-check' };
  const toast     = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<svg width="16" height="16"><use href="${iconMap[type]||'#ic-check'}"/></svg><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}

// ─── Image Preview ────────────────────────────────────────────
function previewImage(input, previewId, wrapId) {
  if (!input.files?.length) return;
  const preview = document.getElementById(previewId);
  const label   = document.querySelector(`#${wrapId} .file-upload-text`);
  const reader  = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.add('visible');
    if (label) label.textContent = input.files[0].name;
  };
  reader.readAsDataURL(input.files[0]);
}

function _fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload  = () => res(r.result);
    r.onerror = rej;
  });
}

// ─── Seller: Load Panel ───────────────────────────────────────
function _loadSellerPanel() {
  document.getElementById('store-name').value = storeData.name || '';
  _renderSellerProducts();
}

// ─── Seller: Save Store ───────────────────────────────────────
async function saveStore(event) {
  event.preventDefault();
  const fileInput = document.getElementById('store-img');
  const btn       = event.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Salvando...');
  try {
    if (fileInput.files.length > 0)
      storeData.img = await _fileToBase64(fileInput.files[0]);
    storeData.name = document.getElementById('store-name').value.trim();
    storeData.id   = storeData.id || 'store_' + Date.now();
    localStorage.setItem('plusLanches_store', JSON.stringify(storeData));
    showToast('Loja salva com sucesso!', 'success');
  } catch (_) {
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    _btnLoad(btn, false, 'Salvar Loja');
  }
}

// ─── Seller: Add Item ─────────────────────────────────────────
async function addItem(event) {
  event.preventDefault();
  const fileInput = document.getElementById('item-img');
  if (!fileInput.files.length) {
    showToast('Selecione uma imagem para o produto.', 'error');
    return;
  }
  const btn = event.target.querySelector('button[type="submit"]');
  _btnLoad(btn, true, 'Adicionando...');
  try {
    const imgBase64 = await _fileToBase64(fileInput.files[0]);
    products.push({
      id:      Date.now(),
      storeId: storeData.id,
      name:    document.getElementById('item-name').value.trim(),
      desc:    document.getElementById('item-desc').value.trim(),
      price:   parseFloat(document.getElementById('item-price').value),
      img:     imgBase64
    });
    localStorage.setItem('plusLanches_products', JSON.stringify(products));
    event.target.reset();
    // Reset previews
    document.getElementById('item-img-preview').classList.remove('visible');
    const lbl = document.querySelector('#item-img-wrap .file-upload-text');
    if (lbl) lbl.textContent = 'Foto';
    _renderSellerProducts();
    showToast('Item adicionado ao cardápio!', 'success');
  } catch (_) {
    showToast('Erro ao adicionar. Tente novamente.', 'error');
  } finally {
    _btnLoad(btn, false, 'Cadastrar Item');
  }
}

// ─── Seller: Remove Product ───────────────────────────────────
function removeProduct(productId) {
  if (!confirm('Remover este item do cardápio?')) return;
  products = products.filter(p => p.id !== productId);
  localStorage.setItem('plusLanches_products', JSON.stringify(products));
  _renderSellerProducts();
  showToast('Item removido.', 'info');
}

// ─── Seller: Render Products ──────────────────────────────────
function _renderSellerProducts() {
  const list = document.getElementById('seller-products-list');
  const mine = products.filter(p => p.storeId === storeData.id);
  if (!mine.length) {
    list.innerHTML = '<div class="empty-state">Nenhum produto ainda.<br>Adicione seu primeiro item acima.</div>';
    return;
  }
  list.innerHTML = mine.map(item => `
    <div class="product-card">
      <img src="${item.img}" class="product-img" alt="${item.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${item.name}</div>
        <div class="product-desc">${item.desc}</div>
        <div class="product-price">R$ ${_fmt(item.price)}</div>
        <button class="btn-danger" onclick="removeProduct(${item.id})">
          <svg width="15" height="15"><use href="#ic-trash"/></svg>
          Remover
        </button>
      </div>
    </div>`).join('');
}

// ─── Client: Stores List ──────────────────────────────────────
function _loadStoresList() {
  document.getElementById('stores-grid').innerHTML = `
    <div class="product-card store-select-card"
      onclick="openStoreProfile('${storeData.id}')"
      role="button" tabindex="0"
      aria-label="Abrir ${storeData.name}">
      <img src="${storeData.img}" class="product-img" alt="${storeData.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${storeData.name}</div>
        <div class="product-desc">Clique para ver o cardápio completo</div>
        <div class="store-status-inline">
          <span class="status-dot"></span> Aberto agora
        </div>
      </div>
    </div>`;
}

// ─── Client: Open Store ───────────────────────────────────────
function openStoreProfile(storeId) {
  selectedStoreId = storeId;
  _loadClientStore();
  switchScreen('screen-cliente');
}

function _loadClientStore() {
  document.getElementById('client-store-header').innerHTML = `
    <img src="${storeData.img}" class="store-banner-img" alt="${storeData.name}">
    <div class="store-banner-info">
      <h2>${storeData.name}</h2>
      <span class="store-status-badge">
        <span class="status-dot"></span>
        Aberto agora &nbsp;·&nbsp; Entrega e Retirada
      </span>
    </div>`;
  _renderClientProducts();
  updateCartCount();
}

function _renderClientProducts() {
  const list  = document.getElementById('client-products-list');
  const items = products.filter(p => p.storeId === selectedStoreId);
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Esta loja não tem produtos ainda.<br>Volte em breve!</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <div class="product-card">
      <img src="${item.img}" class="product-img" alt="${item.name}" loading="lazy">
      <div class="product-info">
        <div class="product-title">${item.name}</div>
        <div class="product-desc">${item.desc}</div>
        <div class="product-price">R$ ${_fmt(item.price)}</div>
        <button class="btn-add-cart" onclick="addToCart(${item.id})">
          <svg width="15" height="15"><use href="#ic-plus"/></svg>
          Adicionar
        </button>
      </div>
    </div>`).join('');
}

// ─── Cart ─────────────────────────────────────────────────────
function addToCart(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  cart.push(p);
  updateCartCount();
  showToast(`${p.name} adicionado!`, 'success');
  const badge = document.getElementById('cart-count');
  badge.classList.add('bump');
  badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once: true });
}

function updateCartCount() {
  document.getElementById('cart-count').textContent = cart.length;
}

function goToCart() {
  renderCart();
  switchScreen('screen-cart');
}

function renderCart() {
  const list  = document.getElementById('cart-items-list');
  const total = document.getElementById('cart-total-value');

  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty">Sua sacola está vazia.<br>Adicione itens do cardápio.</div>';
    total.textContent = 'R$ 0,00';
    return;
  }

  let sub = 0;
  list.innerHTML = cart.map((item, i) => {
    sub += item.price;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">R$ ${_fmt(item.price)}</div>
        </div>
        <button class="btn-remove-cart" onclick="removeFromCart(${i})" aria-label="Remover ${item.name}">
          <svg><use href="#ic-trash"/></svg>
        </button>
      </div>`;
  }).join('');

  const orderType  = document.querySelector('input[name="order-type"]:checked')?.value || 'entrega';
  const deliveryFee = orderType === 'entrega' ? 5 : 0;

  if (orderType === 'entrega') {
    list.innerHTML += `
      <div class="cart-delivery-row">
        <span>Taxa de entrega</span>
        <span>R$ 5,00</span>
      </div>`;
  }

  total.textContent = `R$ ${_fmt(sub + deliveryFee)}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  updateCartCount();
}

// ─── Checkout ─────────────────────────────────────────────────
async function checkout() {
  if (!cart.length) { showToast('Sua sacola está vazia!', 'error'); return; }
  const orderType = document.querySelector('input[name="order-type"]:checked').value;
  const payment   = document.querySelector('input[name="payment"]:checked').value;
  const btn       = document.getElementById('btn-checkout');
  _btnLoad(btn, true, 'Processando...');
  await new Promise(r => setTimeout(r, 1200)); // Simulated network delay
  _btnLoad(btn, false, 'Finalizar Pedido');
  const delivery = orderType === 'entrega' ? 'Entrega' : 'Retirada na loja';
  showToast(`Pedido feito! ${delivery} · Pagamento: ${payment}`, 'success');
  cart = [];
  updateCartCount();
  setTimeout(() => switchScreen('screen-stores-list'), 600);
}

// ─── Formatting ───────────────────────────────────────────────
function _fmt(n) {
  return n.toFixed(2).replace('.', ',');
}

// ─── Expose to global scope (for onclick= attributes) ─────────
window.switchScreen       = switchScreen;
window.switchAuthTab      = switchAuthTab;
window.handleLogin        = handleLogin;
window.handleRegister     = handleRegister;
window.handleForgotPassword = handleForgotPassword;
window.showForgotPassword = showForgotPassword;
window.hideForgotPassword = hideForgotPassword;
window.togglePassword     = togglePassword;
window.selectRole         = selectRole;
window.logout             = logout;
window.saveStore          = saveStore;
window.addItem            = addItem;
window.removeProduct      = removeProduct;
window.previewImage       = previewImage;
window.openStoreProfile   = openStoreProfile;
window.addToCart          = addToCart;
window.goToCart           = goToCart;
window.renderCart         = renderCart;
window.removeFromCart     = removeFromCart;
window.checkout           = checkout;
window.showToast          = showToast;