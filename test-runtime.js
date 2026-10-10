/**
 * Runtime Behavioral Simulation Tests
 * Verifies interactive state machines and DOM bindings for Pranav Shukla Portfolio
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('RUNNING RUNTIME BEHAVIORAL SIMULATION SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Mock DOM Environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); }
};

global.window = {
  matchMedia: (query) => ({ matches: query.includes('dark') }),
  location: { hash: '', search: '', href: '' },
  history: { replaceState: () => {} }
};

const domListeners = {};
const elementsById = {};

function createMockElement(tag, id = '', classes = []) {
  const el = {
    tagName: tag.toUpperCase(),
    id,
    classList: {
      _classes: new Set(classes),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (el.classList._classes.has(c)) el.classList._classes.delete(c);
          else el.classList._classes.add(c);
        } else if (force) {
          el.classList._classes.add(c);
        } else {
          el.classList._classes.delete(c);
        }
      },
      contains: (c) => el.classList._classes.has(c)
    },
    attributes: {},
    setAttribute: (k, v) => { el.attributes[k] = String(v); },
    getAttribute: (k) => el.attributes[k] !== undefined ? el.attributes[k] : null,
    style: {},
    src: '',
    alt: '',
    focus: () => { global.document.activeElement = el; },
    scrollIntoView: () => {},
    innerHTML: '',
    textContent: '',
    value: '',
    hidden: false,
    disabled: false,
    querySelector: (sel) => null,
    querySelectorAll: () => [],
    _listeners: {},
    addEventListener: (evt, fn) => {
      if (!el._listeners[evt]) el._listeners[evt] = [];
      el._listeners[evt].push(fn);
    },
    click: () => {
      (el._listeners['click'] || []).forEach(fn => fn.call(el, { preventDefault: () => {} }));
    }
  };
  if (id) elementsById[id] = el;
  return el;
}

// Pre-create elements before modules initialize
const modal = createMockElement('div', 'videoModal');
const dialog = createMockElement('div', 'modalDialog');
const videoWrap = createMockElement('div', 'videoWrap');
modal.querySelector = (sel) => {
  if (sel.includes('dialog')) return dialog;
  if (sel.includes('video-wrap')) return videoWrap;
  return null;
};
const iframe = createMockElement('iframe', 'videoModalIframe');
const imageWrap = createMockElement('div', 'modalImageWrap');
const modalImg = createMockElement('img', 'modalImage');
const closeBtn = createMockElement('button', 'videoModalClose');
const titleEl = createMockElement('h3', 'videoModalTitle');
const extLink = createMockElement('a', 'videoModalExternal');
const themeToggle = createMockElement('button', 'themeToggle');
const formService = createMockElement('select', 'form-service');
const formBudget = createMockElement('select', 'form-budget');
const formMsg = createMockElement('textarea', 'form-message');
const contactSec = createMockElement('section', 'contact');

global.document = {
  documentElement: createMockElement('html', '', []),
  activeElement: null,
  body: createMockElement('body', '', []),
  getElementById: (id) => elementsById[id] || null,
  querySelector: (sel) => {
    if (sel.startsWith('#')) return elementsById[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: (evt, fn) => {
    if (!domListeners[evt]) domListeners[evt] = [];
    domListeners[evt].push(fn);
  }
};

// 2. Load main.js in mocked environment
const {
  ThemeManager, CurrencyManager, PackageBooker, VideoModal, ContactForm
} = require('./assets/js/main.js');

// Test ThemeManager
console.log('Suite R1: ThemeManager Logic');
ThemeManager.applyTheme('light');
assert(document.documentElement.getAttribute('data-theme') === 'light', 'ThemeManager sets data-theme to light');
assert(localStorage.getItem('pranav-theme') === 'light', 'ThemeManager persists light theme to storage');
ThemeManager.applyTheme('dark');
assert(document.documentElement.getAttribute('data-theme') === 'dark', 'ThemeManager toggles back to dark');

// Test CurrencyManager
console.log('\nSuite R2: CurrencyManager Logic');
CurrencyManager.setCurrency('inr');
assert(CurrencyManager.getCurrency() === 'inr', 'CurrencyManager sets active currency to INR');
assert(localStorage.getItem('pranav-currency') === 'inr', 'CurrencyManager persists currency to storage');
CurrencyManager.setCurrency('usd');
assert(CurrencyManager.getCurrency() === 'usd', 'CurrencyManager toggles back to USD');

// Test PackageBooker
console.log('\nSuite R3: PackageBooker Logic');
PackageBooker.bookPackage('shorts');
assert(formService.value === 'shorts-reels', 'PackageBooker selects shorts-reels service');
assert(formBudget.value === 'batch-project', 'PackageBooker sets shorts scope preference');
assert(formMsg.value.includes('Shorts & Reels Batch'), 'PackageBooker pre-fills message template');

// Test VideoModal
console.log('\nSuite R4: VideoModal State Management');
VideoModal.open({ videoId: 'LtRJKYu5F-g', title: 'Nishkramana Sanskar', isVertical: false });
assert(modal.classList.contains('is-open'), 'VideoModal open sets is-open class');
assert(modal.getAttribute('aria-hidden') === 'false', 'VideoModal aria-hidden is false when open');
assert(iframe.src.includes('LtRJKYu5F-g'), 'VideoModal loads YouTube iframe URL');

VideoModal.close(true);
assert(!modal.classList.contains('is-open'), 'VideoModal close removes is-open class');
assert(modal.getAttribute('aria-hidden') === 'true', 'VideoModal aria-hidden is true when closed');
assert(iframe.src === '', 'VideoModal unloads iframe src to stop background audio');

// Summary
console.log('\n====================================================');
console.log(`RUNTIME TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
process.exit(0);
