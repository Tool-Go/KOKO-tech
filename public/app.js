(function(){
  const $ = (sel) => document.querySelector(sel);
  const CONSENT_KEY = 'ttech_consent_v1';
  function getConsent(){ try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}'); } catch(e){ return {}; } }
  function setConsent(v){ localStorage.setItem(CONSENT_KEY, JSON.stringify(v)); }
  function showBanner(){ const b=document.getElementById('cookie-banner'); if(b) b.classList.remove('hidden'); }
  function hideBanner(){ const b=document.getElementById('cookie-banner'); if(b) b.classList.add('hidden'); }
  function openPrefs(){ const m=$('#cookie-modal'); if(m) m.classList.remove('hidden'); }
  function closePrefs(){ const m=$('#cookie-modal'); if(m) m.classList.add('hidden'); }
  function applyConsent(){
    const c = getConsent();
    if (c.analytics === true) {
      const gaId = (document.querySelector('meta[name="ga-id"]')||{}).content || (window.GA_MEASUREMENT_ID||'');
      if (gaId) {
        const s1=document.createElement('script'); s1.async=true; s1.src='https://www.googletagmanager.com/gtag/js?id='+gaId; document.head.appendChild(s1);
        const s2=document.createElement('script'); s2.innerHTML="window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','"+gaId+"',{anonymize_ip:true});"; document.head.appendChild(s2);
      }
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    const consent = getConsent();
    if (!('necessary' in consent)) { showBanner(); } else { applyConsent(); }
    const btnAccept = $('#btn-accept-all'); if (btnAccept) btnAccept.addEventListener('click', () => { setConsent({necessary:true, analytics:true, marketing:false}); hideBanner(); applyConsent(); });
    const btnReject = $('#btn-reject-all'); if (btnReject) btnReject.addEventListener('click', () => { setConsent({necessary:true, analytics:false, marketing:false}); hideBanner(); });
    const btnCustomize = $('#btn-customize'); if (btnCustomize) btnCustomize.addEventListener('click', openPrefs);
    const btnSavePrefs = $('#btn-save-prefs'); if (btnSavePrefs) btnSavePrefs.addEventListener('click', () => {
      const analytics = document.getElementById('toggle-analytics')?.checked || false;
      const marketing = document.getElementById('toggle-marketing')?.checked || false;
      setConsent({ necessary:true, analytics, marketing }); closePrefs(); hideBanner(); applyConsent();
    });
    const btnCloseModal = document.getElementById('btn-close-modal'); if (btnCloseModal) btnCloseModal.addEventListener('click', closePrefs);
  });
})();