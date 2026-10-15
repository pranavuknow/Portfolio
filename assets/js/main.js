/**
 * Pranav Shukla — Video Editor & Thumbnail Designer
 * High-performance, zero-dependency Vanilla ES6 modules
 *
 * Modules:
 * 1. ThemeManager — Theme toggle (dark/light) with aria sync
 * 2. NavManager — Scroll effects, mobile drawer, accessible skip-link, scrollspy
 * 3. WorkFilter — Filtering with URL hash support & transition cleanups
 * 4. AnimationManager — Staggered intersection observer (respects reduced motion)
 * 5. CurrencyManager — Scope & preference switcher with local persistence
 * 6. ScopeEstimator — Interactive scope & rate configurator with inquiry autofill
 * 7. PackageBooker — 1-click package CTA to contact form prefiller
 * 8. ContactForm — Validation, multi-channel dispatch (mailto, Gmail web, clipboard)
 * 9. VideoModal — Lightbox with 16:9 widescreen, 9:16 vertical & image zoom support
 * 10. ClipboardHelper — One-click email copy with accessible toast notification
 * 11. MiscUtils — Dynamic copyright year & deep-link parameters
 */

'use strict';

/* ────────────────────────────────────────────────────────────
   1. THEME MANAGER
──────────────────────────────────────────────────────────── */
const ThemeManager = (() => {
  const STORAGE_KEY = 'pranav-theme';
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  function getPreferredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // Storage unavailable in private browsing
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable in private browsing
    }
    if (toggle) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    }
  }

  function handleToggle() {
    const current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    applyTheme(getPreferredTheme());
    if (toggle) toggle.addEventListener('click', handleToggle);
  }

  return { init, applyTheme };
})();

/* ────────────────────────────────────────────────────────────
   2. NAVIGATION MANAGER
──────────────────────────────────────────────────────────── */
const NavManager = (() => {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');
  const mobileLinks = document.querySelectorAll('.nav__mobile-link, .nav__mobile-cta');
  const navLinks = document.querySelectorAll('.nav__link');
  const navSectionIds = ['work', 'retention', 'services', 'packages', 'about', 'contact'];

  function onScroll() {
    if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    updateActiveLink();
  }

  function toggleMobile() {
    if (!hamburger || !mobileMenu) return;
    const willOpen = !hamburger.classList.contains('is-open');
    hamburger.classList.toggle('is-open', willOpen);
    hamburger.setAttribute('aria-expanded', String(willOpen));
    mobileMenu.classList.toggle('is-open', willOpen);
    mobileMenu.setAttribute('aria-hidden', String(!willOpen));
  }

  function closeMobile() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  function updateActiveLink() {
    if (!navLinks.length) return;
    const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 70);
    let activeId = atBottom ? 'contact' : '';

    if (!activeId) {
      navSectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 160) activeId = id;
        }
      });
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const isCurrent = activeId && (href === `#${activeId}` || href.endsWith(`#${activeId}`));
      link.classList.toggle('nav__link--active', !!isCurrent);
    });
  }

  function onNavLinkClick(e) {
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobile();
      if (href === '#main-content' || target.getAttribute('tabindex') === '-1') {
        target.focus({ preventScroll: true });
      }
    }
  }

  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    if (hamburger) hamburger.addEventListener('click', toggleMobile);
    mobileLinks.forEach(link => link.addEventListener('click', closeMobile));
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', onNavLinkClick);
    });
    onScroll();
  }

  return { init, closeMobile };
})();

/* ────────────────────────────────────────────────────────────
   3. WORK FILTER
──────────────────────────────────────────────────────────── */
const WorkFilter = (() => {
  const filters = document.querySelectorAll('.work__filter');
  const cards = document.querySelectorAll('.work__card');

  function setFilter(filterCategory) {
    filters.forEach(btn => {
      const match = btn.getAttribute('data-filter') === filterCategory;
      btn.classList.toggle('work__filter--active', match);
      btn.setAttribute('aria-selected', String(match));
    });

    cards.forEach(card => {
      const catAttr = (card.getAttribute('data-category') || '').trim();
      const categories = catAttr.split(/\s+/);
      const isMatch = filterCategory === 'all' || categories.includes(filterCategory);

      if (isMatch) {
        card.classList.remove('hidden');
        requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
          setTimeout(() => {
            if (card.style.opacity === '1') card.style.transform = '';
          }, 220);
        });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(8px)';
        setTimeout(() => {
          if (card.style.opacity === '0') card.classList.add('hidden');
        }, 180);
      }
    });
  }

  function init() {
    if (!filters.length) return;

    filters.forEach(btn => {
      btn.addEventListener('click', () => setFilter(btn.getAttribute('data-filter')));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    const hash = window.location.hash;
    if (hash.startsWith('#filter-')) {
      const targetFilter = hash.replace('#filter-', '');
      const btn = document.querySelector(`.work__filter[data-filter="${targetFilter}"]`);
      if (btn) btn.click();
    }
  }

  return { init, setFilter };
})();

/* ────────────────────────────────────────────────────────────
   4. ANIMATION MANAGER (Intersection Observer)
──────────────────────────────────────────────────────────── */
const AnimationManager = (() => {
  function init() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll('.fade-in-up');

    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ────────────────────────────────────────────────────────────
   5. CURRENCY MANAGER (Scope & Currency Selection)
──────────────────────────────────────────────────────────── */
const CurrencyManager = (() => {
  const STORAGE_KEY = 'pranav-currency';
  let currentCurrency = 'usd';

  const rates = {
    longform: { usd: 'Direct Scope Discussion', inr: 'Direct Scope Discussion' },
    shorts: { usd: 'Direct Scope Discussion', inr: 'Direct Scope Discussion' },
    thumbnail: { usd: 'Direct Scope Discussion', inr: 'Direct Scope Discussion' }
  };

  function updateDisplayedRates() {
    document.querySelectorAll('[data-rate-key]').forEach(el => {
      const key = el.getAttribute('data-rate-key');
      if (rates[key] && rates[key][currentCurrency]) {
        el.textContent = rates[key][currentCurrency];
      }
    });
  }

  function setCurrency(currency) {
    currentCurrency = currency === 'inr' ? 'inr' : 'usd';
    try {
      localStorage.setItem(STORAGE_KEY, currentCurrency);
    } catch {
      // Storage unavailable in private browsing
    }
    document.querySelectorAll('.currency-btn').forEach(btn => {
      const match = btn.getAttribute('data-currency') === currentCurrency;
      btn.classList.toggle('currency-btn--active', match);
      btn.setAttribute('aria-pressed', String(match));
    });
    updateDisplayedRates();
    if (window.ScopeEstimator && typeof window.ScopeEstimator.updateView === 'function') {
      window.ScopeEstimator.updateView();
    }
    if (typeof AnalyticsTracker !== 'undefined' && AnalyticsTracker.recordEvent) {
      AnalyticsTracker.recordEvent('currency_switch', { currency: currentCurrency });
    }
  }

  function getCurrency() {
    return currentCurrency;
  }

  function init() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
    const initial = stored || 'usd';
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setCurrency(btn.getAttribute('data-currency'));
      });
    });
    setCurrency(initial);
  }

  return { init, getCurrency, setCurrency };
})();

/* ────────────────────────────────────────────────────────────
   6. SCOPE & RATE ESTIMATOR
──────────────────────────────────────────────────────────── */
const ScopeEstimator = (() => {
  const container = document.getElementById('projectEstimator');

  const scopes = {
    'longform': {
      label: 'YouTube Long-form',
      rate: 'Direct Scope Discussion',
      turnaround: '48 Hours (typical first cut)',
      features: ['Full retention pacing & narrative arc', 'Color grading (Rec.709)', '2 Thumbnail concepts', '2 Revision rounds included']
    },
    'shorts': {
      label: 'Short-Form Growth Batches',
      rate: 'Direct Scope Discussion',
      turnaround: '24–48 Hours',
      features: ['60-second hook-first pacing', 'Styled kinetic captions & audio design', 'Batch volume tailored to posting cadence', 'High-energy pattern interrupts']
    },
    'thumbnail': {
      label: 'High-CTR Thumbnails',
      rate: 'Direct Scope Discussion',
      turnaround: '24 Hours',
      features: ['Mobile 120px scale readability check', '3D focal depth & lighting treatment', '2 A/B test variations per video', 'Photoshop source files included']
    },
    'retainer': {
      label: 'Dedicated Partner Retainer',
      rate: 'Direct Scope Discussion',
      turnaround: 'Priority Queue (24h)',
      features: ['Long-form + Shorts + Thumbnails capacity', 'Direct communication via Gmail or Instagram', 'Continuous audience retention review', 'Dedicated monthly capacity slot']
    }
  };

  let selectedKey = 'longform';

  function renderFeatureItem(text) {
    const li = document.createElement('li');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('aria-hidden', 'true');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(poly);
    const span = document.createElement('span');
    span.textContent = text;
    li.appendChild(svg);
    li.appendChild(span);
    return li;
  }

  function updateView() {
    if (!container) return;
    const data = scopes[selectedKey];
    if (!data) return;

    const rateEl = document.getElementById('estRate');
    const turnaroundEl = document.getElementById('estTurnaround');
    const listEl = document.getElementById('estList');

    if (rateEl) rateEl.textContent = data.rate || 'Direct Scope Discussion';
    if (turnaroundEl) turnaroundEl.textContent = `Turnaround: ${data.turnaround}`;
    if (listEl) {
      listEl.textContent = '';
      data.features.forEach(f => listEl.appendChild(renderFeatureItem(f)));
    }
  }

  function applyToContact() {
    const serviceSelect = document.getElementById('form-service');
    const messageField = document.getElementById('form-message');
    const budgetSelect = document.getElementById('form-budget');

    const serviceKeys = { longform: 'video-editing', shorts: 'shorts-reels', thumbnail: 'thumbnail-design', retainer: 'retainer' };
    const budgetKeys = { longform: 'single-pilot', shorts: 'batch-project', thumbnail: 'single-pilot', retainer: 'ongoing-retainer' };

    if (serviceSelect && serviceKeys[selectedKey]) serviceSelect.value = serviceKeys[selectedKey];
    if (budgetSelect && budgetKeys[selectedKey]) budgetSelect.value = budgetKeys[selectedKey];

    if (messageField && !messageField.value.trim()) {
      messageField.value = `Hi Pranav, I would like to discuss a project in the ${scopes[selectedKey].label} format. Here are my project details: `;
    }

    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      if (messageField) messageField.focus();
    }
  }

  function init() {
    if (!container) return;
    const pills = container.querySelectorAll('.estimator__pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('estimator__pill--active'));
        pill.classList.add('estimator__pill--active');
        selectedKey = pill.getAttribute('data-scope-key');
        updateView();
      });
    });

    const applyBtn = document.getElementById('applyScopeBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyToContact);

    updateView();
  }

  return { init, updateView };
})();
window.ScopeEstimator = ScopeEstimator;

/* ────────────────────────────────────────────────────────────
   7. PACKAGE BOOKER (1-Click Package CTAs)
──────────────────────────────────────────────────────────── */
const PackageBooker = (() => {
  const packageMap = {
    longform: {
      service: 'video-editing',
      budget: 'single-pilot',
      label: 'YouTube Long-form'
    },
    shorts: {
      service: 'shorts-reels',
      budget: 'batch-project',
      label: 'Shorts & Reels Batch'
    },
    thumbnail: {
      service: 'thumbnail-design',
      budget: 'single-pilot',
      label: 'Thumbnail Sprint'
    }
  };

  function bookPackage(key) {
    const pkg = packageMap[key];
    if (!pkg) return;

    const sField = document.getElementById('form-service');
    const bField = document.getElementById('form-budget');
    const mField = document.getElementById('form-message');

    if (sField) sField.value = pkg.service;
    if (bField) bField.value = pkg.budget;
    if (mField && !mField.value.trim()) {
      mField.value = `Hi Pranav, I'd like to discuss working together on ${pkg.label}. Here are my project details: `;
    }

    if (typeof AnalyticsTracker !== 'undefined' && AnalyticsTracker.recordEvent) {
      AnalyticsTracker.recordEvent('discuss_project', { format: key, service: pkg.service, label: pkg.label });
    }

    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      if (mField) mField.focus();
    }
  }

  function init() {
    document.querySelectorAll('[data-book-package]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = btn.getAttribute('data-book-package');
        if (key && document.getElementById('contact')) {
          e.preventDefault();
          bookPackage(key);
        }
      });
    });
  }

  return { init, bookPackage };
})();

/* ────────────────────────────────────────────────────────────
   8. CONTACT FORM & LEAD DISPATCH
──────────────────────────────────────────────────────────── */
const ContactForm = (() => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('form-submit');
  const successEl = document.getElementById('formSuccess');

  const validators = {
    name: val => val.trim().length >= 2 ? '' : 'Please enter your name.',
    email: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? '' : 'Please enter a valid email address.',
    service: val => val ? '' : 'Please select a service format.',
    message: val => val.trim().length >= 15 ? '' : 'Please describe your project (at least 15 characters).',
    consent: val => val ? '' : 'Please confirm you have read the privacy policy.'
  };

  function getField(name) {
    return form ? form.elements[name] : null;
  }

  function getErrorEl(name) {
    return document.getElementById(`error-${name}`);
  }

  function validateField(name) {
    const field = getField(name);
    const errorEl = getErrorEl(name);
    if (!field || !validators[name]) return true;

    const val = field.type === 'checkbox' ? field.checked : field.value;
    const error = validators[name](val);
    if (errorEl) errorEl.textContent = error;
    field.classList.toggle('is-invalid', !!error);
    field.setAttribute('aria-invalid', String(!!error));
    return !error;
  }

  function validateAll() {
    let valid = true;
    Object.keys(validators).forEach(name => {
      if (!validateField(name)) valid = false;
    });
    return valid;
  }

  function getHumanLabels() {
    const sField = getField('service');
    const bField = getField('budget');
    const sLabel = sField && sField.selectedIndex > 0 ? sField.options[sField.selectedIndex].text : (sField?.value || 'Video Project');
    const bLabel = bField && bField.selectedIndex > 0 ? bField.options[bField.selectedIndex].text : 'Flexible / To discuss';
    return { sLabel, bLabel };
  }

  function buildInquiryPayload() {
    const name = getField('name').value.trim();
    const email = getField('email').value.trim();
    const footage = getField('link') ? getField('link').value.trim() : 'None provided';
    const message = getField('message').value.trim();
    const { sLabel, bLabel } = getHumanLabels();

    const subject = `Project Inquiry: ${sLabel} — ${name}`;
    const body = `Hi Pranav,\n\nName: ${name}\nEmail: ${email}\nService: ${sLabel}\nBudget Range: ${bLabel}\nFootage / Channel Link: ${footage}\n\nProject Details:\n${message}\n\n---\nSent via pranavuknow.github.io/Portfolio`;

    const mailtoUrl = `mailto:pranav.uknow@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=pranav.uknow@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return { subject, body, mailtoUrl, gmailUrl };
  }

  function createDispatchLink(href, text, isPrimary, isExternal) {
    const a = document.createElement('a');
    a.href = href;
    a.className = isPrimary ? 'dispatch-btn dispatch-btn--primary' : 'dispatch-btn';
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    const span = document.createElement('span');
    span.textContent = text;
    a.appendChild(span);
    return a;
  }

  function createCopyInquiryBtn(bodyText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dispatch-btn';
    btn.id = 'copyInquiryBtn';
    const span = document.createElement('span');
    span.textContent = 'Copy Inquiry Text';
    btn.appendChild(span);
    btn.addEventListener('click', () => {
      ClipboardHelper.copyText(bodyText, 'Inquiry text copied! Paste into any email or chat.');
    });
    return btn;
  }

  function buildSuccessHeader() {
    const hdr = document.createElement('div');
    hdr.className = 'form__success-header';
    const span = document.createElement('span');
    span.textContent = 'Inquiry Prepared Successfully!';
    hdr.appendChild(span);
    return hdr;
  }

  function renderSuccessState(payload) {
    if (!successEl) return;
    successEl.hidden = false;
    successEl.textContent = '';

    const p = document.createElement('p');
    p.style.fontSize = 'var(--text-xs)';
    p.style.color = 'var(--text-secondary)';
    p.textContent = 'Choose your preferred dispatch method to ensure zero dropped communications:';

    const actions = document.createElement('div');
    actions.className = 'form__dispatch-actions';
    actions.appendChild(createDispatchLink(payload.mailtoUrl, 'Send via Mail App', true, false));
    actions.appendChild(createDispatchLink(payload.gmailUrl, 'Open in Gmail Web', false, true));
    actions.appendChild(createCopyInquiryBtn(payload.body));

    successEl.appendChild(buildSuccessHeader());
    successEl.appendChild(p);
    successEl.appendChild(actions);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = buildInquiryPayload();
    const { sLabel, bLabel } = getHumanLabels();
    if (typeof AnalyticsTracker !== 'undefined' && AnalyticsTracker.recordEvent) {
      AnalyticsTracker.recordEvent('submit_inquiry', { service: sLabel, budget: bLabel });
    }
    renderSuccessState(payload);

    try {
      window.location.href = payload.mailtoUrl;
    } catch (_) {}
  }

  function bindInputEvents() {
    Object.keys(validators).forEach(name => {
      const field = getField(name);
      if (!field) return;
      field.addEventListener('blur', () => validateField(name));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(name);
      });
    });
  }

  function init() {
    if (!form) return;
    bindInputEvents();
    form.addEventListener('submit', handleSubmit);
  }

  return { init, validateField, validateAll };
})();

/* ────────────────────────────────────────────────────────────
   9. VIDEO & IMAGE MODAL LIGHTBOX
──────────────────────────────────────────────────────────── */
const VideoModal = (() => {
  const modal = document.getElementById('videoModal');
  const dialog = modal ? modal.querySelector('.modal__dialog') : null;
  const iframe = document.getElementById('videoModalIframe');
  const videoWrap = modal ? modal.querySelector('.modal__video-wrap') : null;
  const imageWrap = document.getElementById('modalImageWrap');
  const modalImg = document.getElementById('modalImage');
  const closeBtn = document.getElementById('videoModalClose');
  const backdrop = document.getElementById('videoModalBackdrop');
  const titleEl = document.getElementById('videoModalTitle');
  const externalLink = document.getElementById('videoModalExternal');
  const bookBtn = document.getElementById('modalBookBtn');

  let lastFocusedElement = null;
  let currentTitle = '';
  let currentFormat = 'video-editing';

  function setupMedia(options) {
    const { videoId, isVertical, imageUrl } = options;
    if (imageUrl) {
      if (videoWrap) videoWrap.style.display = 'none';
      if (imageWrap && modalImg) {
        imageWrap.style.display = 'flex';
        modalImg.src = imageUrl;
        modalImg.alt = options.title || 'Thumbnail preview';
      }
      if (dialog) dialog.classList.remove('modal__dialog--vertical');
    } else if (videoId) {
      if (imageWrap) imageWrap.style.display = 'none';
      if (videoWrap && iframe) {
        videoWrap.style.display = 'block';
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      }
      if (dialog) dialog.classList.toggle('modal__dialog--vertical', !!isVertical);
    }
  }

  function updateFooterLinks(options) {
    const { videoId, externalUrl, imageUrl, title } = options;
    currentTitle = title || 'Project Preview';
    if (titleEl) titleEl.textContent = currentTitle;

    if (externalLink) {
      externalLink.href = externalUrl || (videoId ? `https://youtu.be/${videoId}` : '#');
      externalLink.textContent = imageUrl ? 'View Full Resolution ↗' : 'Watch on YouTube ↗';
    }

    if (imageUrl) currentFormat = 'thumbnail-design';
    else if (options.isVertical) currentFormat = 'shorts-reels';
    else currentFormat = 'video-editing';
  }

  function open(options) {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    setupMedia(options);
    updateFooterLinks(options);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function close(restoreFocus = true) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (iframe) iframe.src = '';
    if (modalImg) modalImg.src = '';
    document.body.style.overflow = '';
    if (restoreFocus && lastFocusedElement) lastFocusedElement.focus();
  }

  function onBookEditClick(e) {
    if (typeof AnalyticsTracker !== 'undefined' && AnalyticsTracker.recordEvent) {
      AnalyticsTracker.recordEvent('book_youtube_edit', { title: currentTitle, format: currentFormat });
    }
    const isLocalContact = document.getElementById('contact');
    if (isLocalContact) {
      e.preventDefault();
      close(false);
      const serviceSelect = document.getElementById('form-service');
      const messageField = document.getElementById('form-message');
      if (serviceSelect) serviceSelect.value = currentFormat;
      if (messageField) {
        messageField.value = `Hi Pranav, I loved your edit on "${currentTitle}" and would like to commission an edit in a similar style. Here are my project details: `;
      }
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        if (messageField) messageField.focus();
      }
    }
  }

  function trapFocus(e) {
    if (!modal || !modal.classList.contains('is-open') || e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function bindTriggers() {
    document.querySelectorAll('[data-youtube-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open({
          videoId: el.getAttribute('data-youtube-id'),
          title: el.getAttribute('data-video-title'),
          externalUrl: el.getAttribute('href'),
          isVertical: el.getAttribute('data-vertical') === 'true'
        });
      });
    });

    document.querySelectorAll('[data-image-preview]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open({
          imageUrl: el.getAttribute('data-image-preview'),
          title: el.getAttribute('data-preview-title') || 'Thumbnail Preview',
          externalUrl: el.getAttribute('href')
        });
      });
    });
  }

  function init() {
    if (!modal) return;
    if (closeBtn) closeBtn.addEventListener('click', () => close(true));
    if (backdrop) backdrop.addEventListener('click', () => close(true));
    if (bookBtn) bookBtn.addEventListener('click', onBookEditClick);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close(true);
      else if (e.key === 'Tab') trapFocus(e);
    });

    bindTriggers();
  }

  return { init, open, close };
})();
window.VideoModal = VideoModal;

/* ────────────────────────────────────────────────────────────
   10. CLIPBOARD HELPER & TOAST NOTIFICATION
──────────────────────────────────────────────────────────── */
const ClipboardHelper = (() => {
  const toast = document.getElementById('toastNotification');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function fallbackCopy(text, successMessage) {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    try {
      document.execCommand('copy');
      showToast(successMessage || 'Copied to clipboard!');
    } catch (_) {
      showToast('Copy failed. Please copy manually.');
    }
    document.body.removeChild(input);
  }

  function copyText(text, successMessage) {
    if (typeof AnalyticsTracker !== 'undefined' && AnalyticsTracker.recordEvent) {
      AnalyticsTracker.recordEvent('copy_email', { text });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage || 'Copied to clipboard!');
      }).catch(() => {
        fallbackCopy(text, successMessage);
      });
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function init() {
    document.querySelectorAll('[data-copy-text]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const text = btn.getAttribute('data-copy-text');
        const msg = btn.getAttribute('data-copy-message') || 'Copied to clipboard!';
        copyText(text, msg);
      });
    });
  }

  return { init, copyText };
})();

/* ────────────────────────────────────────────────────────────
   11. MISC UTILITIES
──────────────────────────────────────────────────────────── */
function initMisc() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    const projectParam = params.get('project');

    if (serviceParam) {
      const sField = document.getElementById('form-service');
      if (sField) sField.value = serviceParam;
    }
    if (projectParam) {
      const mField = document.getElementById('form-message');
      if (mField && !mField.value.trim()) {
        mField.value = `Hi Pranav, I loved your work on "${projectParam}" and would like to commission an edit in a similar style. Here are my project details: `;
      }
    }
  } catch (_) {}
}

/* ────────────────────────────────────────────────────────────
   12. HERO RETENTION SIMULATOR
──────────────────────────────────────────────────────────── */
const HeroSimulator = (() => {
  let isPlaying = false;
  let playAnimId = null;
  const markers = [
    { pos: 0, tag: '0:00 The Hook', desc: 'Visual match-cut & opening hook; cut the first 15s of throat-clearing.' },
    { pos: 25, tag: '0:15 Pattern Shift', desc: 'Punch-in reframe, kinetic B-roll, and SFX riser to re-engage visual focus.' },
    { pos: 55, tag: '0:32 Audio Riser', desc: '48kHz dialogue EQ with subtle tactile whooshes and -18dB music auto-ducking.' },
    { pos: 85, tag: '0:50 Payoff & Loop', desc: 'Clean narrative payoff with seamless loop transition back to the hook.' }
  ];

  function getMarkerForPosition(val) {
    if (val >= 80) return markers[3];
    if (val >= 50) return markers[2];
    if (val >= 20) return markers[1];
    return markers[0];
  }

  function updateScrubberUI(val) {
    const playhead = document.getElementById('heroPlayhead');
    const timecode = document.getElementById('heroTimecode');
    const readout = document.getElementById('heroMarkerDetail');
    if (playhead) {
      playhead.setAttribute('x1', `${val}%`);
      playhead.setAttribute('x2', `${val}%`);
    }
    const marker = getMarkerForPosition(val);
    if (timecode) {
      const sec = Math.floor((val / 100) * 60);
      const ms = Math.floor(((val / 100) * 60 - sec) * 100);
      timecode.textContent = `00:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    if (readout) {
      const tag = readout.querySelector('.hero__readout-tag');
      const desc = readout.querySelector('.hero__readout-desc');
      if (tag) tag.textContent = marker.tag;
      if (desc) desc.textContent = marker.desc;
    }
  }

  function setMode(mode) {
    const btnRet = document.getElementById('btnRetentionCut');
    const btnAmat = document.getElementById('btnAmateurCut');
    const metric = document.getElementById('heroSimMetric');
    const label = document.getElementById('heroSimLabel');
    const cRet = document.getElementById('curveRetention');
    const cRetArea = document.getElementById('curveRetentionArea');
    const cAmat = document.getElementById('curveAmateur');
    const isRet = mode === 'retention';

    if (btnRet) { btnRet.classList.toggle('hero__sim-btn--active', isRet); btnRet.setAttribute('aria-pressed', String(isRet)); }
    if (btnAmat) { btnAmat.classList.toggle('hero__sim-btn--active', !isRet); btnAmat.setAttribute('aria-pressed', String(!isRet)); }
    if (metric) { metric.textContent = isRet ? 'Paced Cut' : 'Raw Clip'; metric.style.color = isRet ? 'var(--accent-primary)' : '#9ca3af'; }
    if (label) label.textContent = isRet ? '48kHz Audio · J/L Cuts' : 'Uncut Audio · Static Frame';
    if (cRet) cRet.style.opacity = isRet ? '1' : '0.2';
    if (cRetArea) cRetArea.style.opacity = isRet ? '1' : '0';
    if (cAmat) cAmat.style.opacity = isRet ? '0.25' : '1';
  }

  function switchView(view) {
    const showreelStage = document.getElementById('heroShowreelStage');
    const simStage = document.getElementById('heroSimStage');
    const tabShowreel = document.getElementById('tabModeShowreel');
    const tabTimeline = document.getElementById('tabModeTimeline');
    const isShowreel = view === 'showreel';

    if (showreelStage) showreelStage.hidden = !isShowreel;
    if (simStage) simStage.hidden = isShowreel;
    if (tabShowreel) {
      tabShowreel.classList.toggle('hero__tab-btn--active', isShowreel);
      tabShowreel.setAttribute('aria-selected', String(isShowreel));
    }
    if (tabTimeline) {
      tabTimeline.classList.toggle('hero__tab-btn--active', !isShowreel);
      tabTimeline.setAttribute('aria-selected', String(!isShowreel));
    }
  }

  function stepAnimation() {
    if (!isPlaying) return;
    const slider = document.getElementById('heroScrubberRange');
    if (!slider) return;
    let nextVal = parseFloat(slider.value) + 0.35;
    if (nextVal > 100) nextVal = 0;
    slider.value = nextVal;
    updateScrubberUI(nextVal);
    playAnimId = requestAnimationFrame(stepAnimation);
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('heroSimPlayBtn');
    if (playBtn) {
      playBtn.setAttribute('aria-label', isPlaying ? 'Pause timeline simulation' : 'Play timeline simulation');
      playBtn.classList.toggle('hero__play-btn--active', isPlaying);
    }
    if (isPlaying) {
      playAnimId = requestAnimationFrame(stepAnimation);
    } else if (playAnimId) {
      cancelAnimationFrame(playAnimId);
    }
  }

  function init() {
    const btnRet = document.getElementById('btnRetentionCut');
    const btnAmat = document.getElementById('btnAmateurCut');
    const slider = document.getElementById('heroScrubberRange');
    const playBtn = document.getElementById('heroSimPlayBtn');
    const tabShowreel = document.getElementById('tabModeShowreel');
    const tabTimeline = document.getElementById('tabModeTimeline');

    if (btnRet) btnRet.addEventListener('click', () => setMode('retention'));
    if (btnAmat) btnAmat.addEventListener('click', () => setMode('amateur'));
    if (tabShowreel) tabShowreel.addEventListener('click', () => switchView('showreel'));
    if (tabTimeline) tabTimeline.addEventListener('click', () => switchView('timeline'));
    if (slider) slider.addEventListener('input', (e) => {
      if (isPlaying) togglePlay();
      updateScrubberUI(parseFloat(e.target.value));
    });
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    updateScrubberUI(25);
  }

  return { init, setMode, updateScrubberUI, switchView };
})();

/* ────────────────────────────────────────────────────────────
   GLOBAL EXPORTS & BOOTSTRAP
──────────────────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
  window.NavManager = NavManager;
  window.WorkFilter = WorkFilter;
  window.AnimationManager = AnimationManager;
  window.CurrencyManager = CurrencyManager;
  window.ScopeEstimator = ScopeEstimator;
  window.PackageBooker = PackageBooker;
  window.ContactForm = ContactForm;
  window.VideoModal = VideoModal;
  window.ClipboardHelper = ClipboardHelper;
  window.HeroSimulator = HeroSimulator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ThemeManager, NavManager, WorkFilter, AnimationManager,
    CurrencyManager, ScopeEstimator, PackageBooker, ContactForm,
    VideoModal, ClipboardHelper, HeroSimulator
  };
}

if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    NavManager.init();
    WorkFilter.init();
    AnimationManager.init();
    CurrencyManager.init();
    ScopeEstimator.init();
    PackageBooker.init();
    ContactForm.init();
    VideoModal.init();
    ClipboardHelper.init();
    HeroSimulator.init();
    initMisc();
  });
}

