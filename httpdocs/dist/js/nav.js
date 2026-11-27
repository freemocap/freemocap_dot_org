/**
 * Shared navigation loader for freemocap.org
 *
 * Fetches includes/header.html and includes/footer.html,
 * injects them into the page, then:
 *   - Fixes anchor links when on the index page (strips "./" prefix)
 *   - On about-us.html, rewrites the Donate link to a same-page anchor
 *   - Sets the "active" class based on the current page
 *   - Wires up mobile-menu toggle and dropdown behaviour
 *   - Adds the scroll shadow on the header
 */
// ── Umami analytics ──────────────────────────────────────
// Cookieless visit statistics (https://umami.is). One Umami website ("FMC
// Umami TLD", Hobby plan: 1 website, 100K events/month shared by all three)
// covers freemocap.org, docs.freemocap.org and shop.freemocap.org; its
// dashboard filters by hostname. The id is public. Empty it to turn Umami off.
// data-domains keeps local previews out of the live numbers. Links marked
// data-umami-event="..." are counted as clicks by Umami itself.
(function loadUmami() {
  var UMAMI_WEBSITE_ID = 'da6d04c1-fb75-44f9-8891-368744806237';
  if (!UMAMI_WEBSITE_ID || document.querySelector('script[data-website-id]')) return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
  s.setAttribute('data-domains', 'freemocap.org,www.freemocap.org');
  document.head.appendChild(s);
})();

// ── Visit statistics for the FreeMoCap admin page ───────
// Each page view, and each click on a link marked data-umami-event="...",
// also goes to the shop's own event log (shop.freemocap.org/api/events), so
// /admin/analytics on the shop can show this site beside the shop and docs.
// No cookies and nothing stored in the browser; see the privacy page.
(function trackVisits() {
  var ENDPOINT = 'https://shop.freemocap.org/api/events';
  var host = location.hostname;
  if (host !== 'freemocap.org' && host !== 'www.freemocap.org' && host !== 'freemocap.localhost') return;
  function send(name, data) {
    var body = JSON.stringify({
      name: name,
      path: location.pathname + location.search,
      referrer: document.referrer || undefined,
      data: data
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
    } catch (e) { /* fall through */ }
    try {
      fetch(ENDPOINT, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(function () {});
    } catch (e) { /* never break the page */ }
  }
  send('pageview');
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('[data-umami-event]');
    if (!el || el.tagName === 'FORM') return;
    var data = { label: el.getAttribute('data-umami-event') };
    for (var i = 0; i < el.attributes.length; i++) {
      var m = /^data-umami-event-(.+)$/.exec(el.attributes[i].name);
      if (m) data[m[1]] = el.attributes[i].value;
    }
    send('outbound_click', data);
  }, true);
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.getAttribute && form.getAttribute('data-umami-event')) {
      send('outbound_click', { label: form.getAttribute('data-umami-event') });
    }
  }, true);
})();

(async function initNav() {
  // ── helpers ──────────────────────────────────────────────
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  // Pages in a subfolder (e.g. /go/qr/) need the includes' relative links made root-absolute.
  const nested = path.split('/').length > 2;
  const isIndex = !nested && (page === '' || page === 'index.html' || path.endsWith('/'));

  // On the live site the deploy workflow (tools/inline-includes.mjs) already put
  // the header and footer into the page, so there is nothing to fetch. Locally
  // the placeholders are empty and get filled here.
  async function inject(selector, url) {
    const el = document.querySelector(selector);
    if (!el || el.hasAttribute('data-inlined')) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status + ' ' + url);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error('nav.js: could not load', url, err);
    }
  }

  // ── fetch & inject ──────────────────────────────────────
  await Promise.all([
    inject('#site-header', '/includes/header.html'),
    inject('#site-footer', '/includes/footer.html'),
  ]);

  if (nested) {
    document.querySelectorAll('#site-header [href], #site-header [src], #site-footer [href], #site-footer [src]').forEach(el => {
      const attr = el.hasAttribute('href') ? 'href' : 'src';
      const v = el.getAttribute(attr);
      if (v && !/^([a-z]+:|\/|#)/i.test(v)) el.setAttribute(attr, '/' + v.replace(/^\.\//, ''));
    });
  }

  // ── fix links for index page ────────────────────────────
  // The template uses "./#services" etc. On the index we want just "#services".
  if (isIndex) {
    document.querySelectorAll('#site-header a, #site-footer a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('./#')) {
        a.setAttribute('href', href.replace('./', ''));
      }
    });
  }

  // ── fix Donate link(s) on about-us page ──────────────────
  // Matches by href rather than a single data-nav lookup since there are
  // three of these now (the About Us dropdown item, and the nav-heart in
  // both its mobile and desktop copies) and all three need the same fix.
  if (page === 'about-us.html') {
    document.querySelectorAll('#site-header a[href="about-us.html#donate"]').forEach(a => {
      a.setAttribute('href', '#donate');
    });
  }

  // ── set active state ────────────────────────────────────
  const activeMap = {
    'index.html':    'home',      // Home dropdown owns the index anchors
    'about-us.html': 'about-us',
    'validation.html': 'about-us', // validation lives under About Us
    'services.html': 'services',
    'showcase.html': 'community', // showcase lives under Community
    'resources.html':'resources',
    'data.html':     'data',
    'download.html': 'download',
  };

  const activeNav = activeMap[page] || (isIndex ? null : null);
  if (activeNav) {
    const el = document.querySelector(`#site-header [data-nav="${activeNav}"]`);
    if (el) el.classList.add('active');
  }

  // ── theme toggle ─────────────────────────────────────────
  // Two copies (desktop nav-links row, mobile persistent-header cluster),
  // same duplicate-for-breakpoint pattern as .nav-heart. The early-applied
  // data-theme attribute (see the inline snippet in each page's <head>,
  // which runs before this script to avoid a flash) is the source of
  // truth; this just keeps both button icons in sync with it and toggles
  // it on click.
  const themeToggles = document.querySelectorAll('.theme-toggle');
  function syncThemeToggleIcons() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggles.forEach(btn => {
      const icon = btn.querySelector('i');
      icon.classList.toggle('bi-moon-stars', !isLight);
      icon.classList.toggle('bi-sun', isLight);
      const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }
  syncThemeToggleIcons();
  themeToggles.forEach(btn => {
    btn.addEventListener('click', function () {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
      syncThemeToggleIcons();
    });
  });

  // ── mobile menu toggle ──────────────────────────────────
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      document.body.classList.toggle('nav-open', navLinks.classList.contains('active'));
      const icon = this.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.classList.remove('bi-list');
        icon.classList.add('bi-x');
      } else {
        icon.classList.remove('bi-x');
        icon.classList.add('bi-list');
      }
    });

    // Mobile dropdown toggles (tap the chevron to expand, tap the label to navigate)
    // 900px matches the nav hamburger-menu breakpoint in main.css, not the
    // general 768px mobile breakpoint used elsewhere on the site.
    document.querySelectorAll('.nav-dropdown > .nav-link .bi-chevron-down').forEach(chevron => {
      chevron.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          e.stopPropagation();
          const dropdown = this.closest('.nav-dropdown');
          document.querySelectorAll('.nav-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
          });
          dropdown.classList.toggle('open');
        }
      });
    });

    // The open menu closes from its own ✕, by tapping the dimmed page beside
    // it, or with Escape.
    function closeMenu() {
      if (navLinks.classList.contains('active')) toggle.click();
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    }
    document.querySelector('.mobile-menu-close')?.addEventListener('click', closeMenu);
    document.querySelector('.nav-backdrop')?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    // Close mobile menu when clicking a non-dropdown link
    navLinks.querySelectorAll('a:not(.nav-dropdown > .nav-link)').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        document.body.classList.remove('nav-open');
        document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
        const icon = toggle.querySelector('i');
        icon.classList.remove('bi-x');
        icon.classList.add('bi-list');
      });
    });
  }

  // ── header scroll shadow ────────────────────────────────
  window.addEventListener('scroll', function () {
    const header = document.querySelector('.header');
    if (!header) return;
    header.style.boxShadow = window.scrollY > 50
      ? '0 2px 20px rgba(0, 0, 0, 0.3)'
      : 'none';
  });

  // ── smooth scroll for anchor links (index page) ─────────
  if (isIndex) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          window.scrollTo({
            top: targetEl.offsetTop - 80,
            behavior: 'smooth',
          });
        }
      });
    });
  }
})();
