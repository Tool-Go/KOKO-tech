/* -------------------------------------------------------------
   KOKO IT Services front: consentement cookies, GA conditionnel, menu mobile,
   ancrage smooth-scroll, reveal au scroll.
------------------------------------------------------------- */

// ---- Helpers ----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* =========================
   Cookie Consent + GA4
========================= */
const LS_KEY = "kokoits_cookie_prefs";
const GA_ID = "G-XXXXXXXXXX"; // ← remplace par ton ID quand tu l’as

function getPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

function savePrefs(prefs) {
  localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  applyPrefs(prefs);
}

function applyPrefs(prefs) {
  // Analytics
  if (prefs.analytics === true && !window.__gaLoaded && window.GA_MEASUREMENT_ID) {
    loadGA(window.GA_MEASUREMENT_ID);
    window.__gaLoaded = true;
  }
}

function loadGA(measurementId) {
  // charge GA4 uniquement si consentement analytics est donné
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, { anonymize_ip: true });
}

function initConsent() {
  const banner = $("#cookie-banner");
  const modal = $("#cookie-modal");
  const btnAccept = $("#btn-accept-all");
  const btnReject = $("#btn-reject-all");
  const btnCustomize = $("#btn-customize");
  const btnCloseModal = $$("#btn-close-modal");
  const btnSave = $("#btn-save-prefs");
  const toggleAnalytics = $("#toggle-analytics");
  const toggleMarketing = $("#toggle-marketing");

  const prefs = getPrefs();
  const hasChosen = typeof prefs.analytics !== "undefined";

  if (!hasChosen && banner) banner.classList.remove("hidden");
  if (typeof prefs.analytics !== "undefined") applyPrefs(prefs);

  btnAccept && btnAccept.addEventListener("click", () => {
    savePrefs({ necessary: true, analytics: true, marketing: false });
    banner?.classList.add("hidden");
  });

  btnReject && btnReject.addEventListener("click", () => {
    savePrefs({ necessary: true, analytics: false, marketing: false });
    banner?.classList.add("hidden");
  });

  btnCustomize && btnCustomize.addEventListener("click", () => {
    if (toggleAnalytics) toggleAnalytics.checked = !!prefs.analytics;
    if (toggleMarketing) toggleMarketing.checked = !!prefs.marketing;
    modal?.classList.remove("hidden");
  });

  btnCloseModal.forEach(b => b.addEventListener("click", () => modal?.classList.add("hidden")));

  btnSave && btnSave.addEventListener("click", () => {
    const next = {
      necessary: true,
      analytics: !!(toggleAnalytics && toggleAnalytics.checked),
      marketing: !!(toggleMarketing && toggleMarketing.checked),
    };
    savePrefs(next);
    modal?.classList.add("hidden");
    banner?.classList.add("hidden");
  });

  // Exposer GA ID depuis meta/env si présent côté serveur (injecte via window)
  const metaGA = document.querySelector('meta[name="ga-measurement-id"]');
  if (metaGA && metaGA.content) window.GA_MEASUREMENT_ID = metaGA.content;
}
 
/* =========================
   Smooth-scroll des ancres
========================= */
function initSmoothScroll() {
  $$(".smooth[href^='#']").forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // fermer le menu mobile après clic
      const menu = $("#nav-menu");
      if (menu?.dataset.open === "true") toggleMenu(false);
    });
  });
}

/* =========================
   Menu mobile (burger)
========================= */
function toggleMenu(force) {
  const menu = $("#nav-menu");
  const btn = $("#nav-toggle");
  if (!menu || !btn) return;

  const next = typeof force === "boolean" ? force : menu.dataset.open !== "true";
  menu.dataset.open = next ? "true" : "false";
  if (next) {
    menu.classList.remove("opacity-0", "pointer-events-none", "-translate-y-2");
  } else {
    menu.classList.add("opacity-0", "pointer-events-none", "-translate-y-2");
  }
}
function initMobileMenu() {
  const btn = $("#nav-toggle");
  const menu = $("#nav-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => toggleMenu());
}

/* =========================
   Reveal au scroll
========================= */
function initReveal() {
  const els = $$(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.remove("opacity-0", "translate-y-3");
        en.target.classList.add("opacity-100", "translate-y-0");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => {
    el.classList.add("opacity-0", "translate-y-3", "transition", "duration-700");
    io.observe(el);
  });
}

/* =========================
   Boot
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initConsent();
  initMobileMenu();
  initSmoothScroll();
  initReveal();
});
// --- Active menu + legacy hash mapping + mobile nav ---
document.addEventListener('DOMContentLoaded', () => {
  // a) Active state (desktop + mobile)
  const path = location.pathname.toLowerCase();
  let current = 'home';
  if (path.endsWith('/services.html')) current = 'services';
  else if (path.endsWith('/about.html')) current = 'about';
  else if (path.endsWith('/contact.html')) current = 'contact';

  document.querySelectorAll('a[data-nav]').forEach(a => {
    const isActive = a.dataset.nav === current;
    a.classList.toggle('font-semibold', isActive);
    a.classList.toggle('text-blue-700', isActive);
  });

  // b) Legacy hash mapping
  const mapHash = { '#About':'#about', '#Services':'#services', '#Cases':'#cases', '#Features':'#features' };
  if (mapHash[location.hash]) {
    const target = mapHash[location.hash];
    history.replaceState({}, '', target);
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }

  // c) Mobile nav toggles
  const btnOpen  = document.getElementById('btn-menu');
  const btnClose = document.getElementById('btn-close-menu');
  const panel    = document.getElementById('mobile-nav');
  const backdrop = document.getElementById('nav-backdrop');

  function openNav(open) {
    if (!panel || !backdrop) return;
    if (open) {
      panel.classList.remove('translate-y-[-100%]', 'opacity-0');
      panel.classList.add('translate-y-0', 'opacity-100');
      backdrop.classList.remove('hidden');
      btnOpen?.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('overflow-hidden'); // lock scroll
    } else {
      panel.classList.add('translate-y-[-100%]', 'opacity-0');
      panel.classList.remove('translate-y-0', 'opacity-100');
      backdrop.classList.add('hidden');
      btnOpen?.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('overflow-hidden');
    }
  }
  btnOpen?.addEventListener('click', () => openNav(true));
  btnClose?.addEventListener('click', () => openNav(false));
  backdrop?.addEventListener('click', () => openNav(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openNav(false); });

  // Fermer le menu quand on clique un lien mobile
  panel?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => openNav(false)));

  // Réinitialiser si on repasse en desktop
  const mql = window.matchMedia('(min-width: 768px)');
  mql.addEventListener('change', () => { if (mql.matches) openNav(false); });
});
// ---------- Consent + GA4 loader ----------
(function(){
  const KEY = "kokoitsConsent";
  let state = { analytics:false, marketing:false, setAt: null };
  let gaLoaded = false;

  function readConsent(){
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') return s; } catch(e){}
    return { analytics:false, marketing:false, setAt:null };
  }
  function saveConsent(next){
    next.setAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(next));
    state = next;
  }

  function gtag(){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }

  function applyConsentToGtag(){
    // Consent Mode v2 de base
    window.dataLayer = window.dataLayer || [];
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: state.analytics ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      personalization_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied'
    });
  }

  function loadGA(){
    if (gaLoaded || !GA_ID) return;
    // Charger le script GA4
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    // Init
    window.dataLayer = window.dataLayer || [];
    gtag('js', new Date());
    // GA4 anonymise l'IP par défaut; on garde une config sobre
    gtag('config', GA_ID);
    gaLoaded = true;
  }

  function reflectUIFromConsent(){
    const a = document.getElementById('toggle-analytics');
    const m = document.getElementById('toggle-marketing');
    if (a) a.checked = !!state.analytics;
    if (m) m.checked = !!state.marketing;
  }

  function showCookieUIIfNeeded(){
    const banner = document.getElementById('cookie-banner');
    const modal  = document.getElementById('cookie-modal');
    if (!banner || !modal) return; // pas de bannière sur cette page
    const hasChoice = !!state.setAt;
    banner.classList.toggle('hidden', hasChoice);
    modal.classList.add('hidden');
  }

  function acceptAll(){
    saveConsent({analytics:true, marketing:true});
    applyConsentToGtag();
    if (state.analytics) loadGA();
    showCookieUIIfNeeded();
  }
  function rejectAll(){
    saveConsent({analytics:false, marketing:false});
    applyConsentToGtag();
    showCookieUIIfNeeded();
  }
  function saveFromToggles(){
    const a = document.getElementById('toggle-analytics')?.checked ?? false;
    const m = document.getElementById('toggle-marketing')?.checked ?? false;
    saveConsent({analytics:a, marketing:m});
    applyConsentToGtag();
    if (a) loadGA();
    showCookieUIIfNeeded();
  }

  // Wire UI events (si présents)
  document.addEventListener('DOMContentLoaded', ()=>{
    state = readConsent();
    applyConsentToGtag();
    reflectUIFromConsent();
    showCookieUIIfNeeded();

    if (state.analytics) loadGA();

    const btnAccept = document.getElementById('btn-accept-all');
    const btnReject = document.getElementById('btn-reject-all');
    const btnCust   = document.getElementById('btn-customize');
    const btnSave   = document.getElementById('btn-save-prefs');
    const btnClose  = document.querySelectorAll('#btn-close-modal');

    const banner = document.getElementById('cookie-banner');
    const modal  = document.getElementById('cookie-modal');

    btnAccept && btnAccept.addEventListener('click', acceptAll);
    btnReject && btnReject.addEventListener('click', rejectAll);
    btnCust   && btnCust.addEventListener('click', ()=>{ modal?.classList.remove('hidden'); });
    (btnClose||[]).forEach(b=>b.addEventListener('click', ()=> modal?.classList.add('hidden')));
    btnSave   && btnSave.addEventListener('click', saveFromToggles);
  });
})();
