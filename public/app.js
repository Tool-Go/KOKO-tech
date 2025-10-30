/* -------------------------------------------------------------
   TTECH front: consentement cookies, GA conditionnel, menu mobile,
   ancrage smooth-scroll, reveal au scroll.
------------------------------------------------------------- */

// ---- Helpers ----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* =========================
   Cookie Consent + GA4
========================= */
const LS_KEY = "ttech_cookie_prefs";

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
// --- Active menu + legacy hash mapping ---
document.addEventListener('DOMContentLoaded', () => {
  // a) Activer l’onglet courant
  const path = location.pathname.toLowerCase();
  let current = 'home';
  if (path.endsWith('/services.html')) current = 'services';
  else if (path.endsWith('/about.html')) current = 'about';
  else if (path.endsWith('/contact.html')) current = 'contact';

  document.querySelectorAll('nav a[data-nav]').forEach(a => {
    a.classList.toggle('font-semibold', a.dataset.nav === current);
    a.classList.toggle('text-blue-700', a.dataset.nav === current);
  });

  // b) Rendre compatibles les anciens hash (majuscules)
  const mapHash = {
    '#About':'#about', '#Services':'#services',
    '#Cases':'#cases', '#Features':'#features'
  };
  if (mapHash[location.hash]) {
    const target = mapHash[location.hash];
    history.replaceState({}, '', target);
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

