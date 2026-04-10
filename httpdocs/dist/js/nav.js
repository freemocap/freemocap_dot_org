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
(async function initNav() {
  // ── helpers ──────────────────────────────────────────────
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  const isIndex = page === '' || page === 'index.html' || path.endsWith('/');

  async function inject(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      el.innerHTML = await res.text();
    } catch (_) { /* fail silently – inline nav stays as fallback */ }
  }

  // ── fetch & inject ──────────────────────────────────────
  await Promise.all([
    inject('#site-header', './includes/header.html'),
    inject('#site-footer', './includes/footer.html'),
  ]);

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

  // ── fix Donate link on about-us page ────────────────────
  if (page === 'about-us.html') {
    const donateLink = document.querySelector('#site-header [data-nav="donate"]');
    if (donateLink) donateLink.setAttribute('href', '#donate');
  }

  // ── set active state ────────────────────────────────────
  const activeMap = {
    'index.html':    null,        // no active – or could highlight Services
    'about-us.html': 'about-us',
    'services.html': 'services',
    'showcase.html': 'community', // showcase lives under Community
    'resources.html':'resources',
    'data.html':     'data',
  };

  const activeNav = activeMap[page] || (isIndex ? null : null);
  if (activeNav) {
    const el = document.querySelector(`#site-header [data-nav="${activeNav}"]`);
    if (el) el.classList.add('active');
  }

  // ── mobile menu toggle ──────────────────────────────────
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      const icon = this.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.classList.remove('bi-list');
        icon.classList.add('bi-x');
      } else {
        icon.classList.remove('bi-x');
        icon.classList.add('bi-list');
      }
    });

    // Mobile dropdown toggles (tap to expand)
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const dropdown = this.parentElement;
          document.querySelectorAll('.nav-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
          });
          dropdown.classList.toggle('open');
        }
      });
    });

    // Close mobile menu when clicking a non-dropdown link
    navLinks.querySelectorAll('a:not(.nav-dropdown > .nav-link)').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
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
