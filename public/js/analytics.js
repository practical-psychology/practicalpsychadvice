// Google Analytics 4, loaded only after the visitor accepts analytics cookies.
// Set your GA4 Measurement ID here (Google Analytics → Admin → Data streams).
// While it is left empty, no analytics loads and no banner is shown.
(function () {
  var GA_ID = ''; // e.g. 'G-ABC123XYZ9'
  var KEY = 'ppa-analytics-consent';

  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) return;

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setChoice(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  function showBanner() {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.style.cssText =
      'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'background:#111827;color:#f9fafb;padding:14px 16px;border-radius:10px;font:14px/1.45 system-ui,sans-serif;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;flex-wrap:wrap;gap:10px;align-items:center';
    bar.innerHTML =
      '<span style="flex:1 1 260px">We use analytics cookies to understand how visitors use this site. ' +
      '<a href="/privacy.html" style="color:#93c5fd;text-decoration:underline">Privacy policy</a></span>' +
      '<button type="button" data-c="no" style="background:transparent;color:#f9fafb;border:1px solid #6b7280;border-radius:6px;padding:6px 12px;cursor:pointer">Decline</button>' +
      '<button type="button" data-c="yes" style="background:#2563eb;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Accept</button>';
    bar.addEventListener('click', function (e) {
      var c = e.target && e.target.getAttribute('data-c');
      if (!c) return;
      setChoice(c);
      bar.remove();
      if (c === 'yes') loadGA();
    });
    document.body.appendChild(bar);
  }

  var choice = getChoice();
  if (choice === 'yes') loadGA();
  else if (choice !== 'no') {
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }
})();
