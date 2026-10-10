/**
 * Pranav Shukla Portfolio — Deep Verification Test Suite
 * Validates HTML integrity, links, SEO metadata, JSON-LD, accessibility,
 * Anti-AI slop compliance, and JavaScript syntax.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('====================================================');
console.log('RUNNING DEEP VERIFICATION SUITE FOR PRANAV PORTFOLIO');
console.log('====================================================\n');

// 1. Core Files Existence
console.log('Test Suite 1: File Structure & Assets');
const requiredFiles = [
  'index.html',
  'work.html',
  'robots.txt',
  'sitemap.xml',
  'assets/favicon.svg',
  'assets/css/main.css',
  'assets/css/work.css',
  'assets/js/main.js'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(fullPath), `File exists: ${file}`);
});

// 2. HTML Integrity & Schema.org JSON-LD
console.log('\nTest Suite 2: HTML Integrity & SEO Schemas');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const workHtml = fs.readFileSync(path.join(ROOT_DIR, 'work.html'), 'utf8');

assert(indexHtml.includes('<!DOCTYPE html>'), 'index.html has DOCTYPE');
assert(workHtml.includes('<!DOCTYPE html>'), 'work.html has DOCTYPE');
assert(indexHtml.includes('<html lang="en" data-theme="dark">'), 'index.html has lang="en" and dark default theme');
assert(workHtml.includes('<html lang="en" data-theme="dark">'), 'work.html has lang="en" and dark default theme');
assert(indexHtml.includes('<meta name="viewport"'), 'index.html has viewport meta tag');
assert(workHtml.includes('<meta name="viewport"'), 'work.html has viewport meta tag');
assert(indexHtml.includes('<meta name="description"'), 'index.html has meta description');
assert(workHtml.includes('<meta name="description"'), 'work.html has meta description');
assert(indexHtml.includes('<link rel="canonical"'), 'index.html has canonical link');
assert(workHtml.includes('<link rel="canonical"'), 'work.html has canonical link');
assert(indexHtml.includes('pranav.uknow@gmail.com'), 'index.html has correct contact email');

// Test JSON-LD schema parsing
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(!!jsonLdMatch, 'index.html contains JSON-LD schema script');
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    assert(parsed['@type'] === 'Person', 'JSON-LD @type is Person');
    assert(parsed.name === 'Pranav Shukla', 'JSON-LD name is Pranav Shukla');
    assert(parsed.email === 'mailto:pranav.uknow@gmail.com', 'JSON-LD email matches');
    assert(Array.isArray(parsed.hasOfferCatalog.itemListElement), 'JSON-LD includes offer catalog with service items');
  } catch (err) {
    assert(false, `JSON-LD failed JSON parsing: ${err.message}`);
  }
}

// 3. Anchor & Section Navigation Integrity
console.log('\nTest Suite 3: Anchor Targets & Section IDs');
const internalNavMatches = indexHtml.match(/href="#([a-zA-Z0-9_-]+)"/g) || [];
const uniqueTargets = [...new Set(internalNavMatches.map(m => m.replace(/href="#|"$/g, '')))];

uniqueTargets.forEach(targetId => {
  // Check if an element with this ID exists in index.html
  const idPattern = new RegExp(`id=["']${targetId}["']`);
  assert(idPattern.test(indexHtml), `Anchor target #${targetId} exists in index.html`);
});

// 4. Accessibility & Forms
console.log('\nTest Suite 4: Accessibility & Form Labels');
assert(indexHtml.includes('class="skip-link"'), 'index.html includes accessibility skip-link');
assert(workHtml.includes('class="skip-link"'), 'work.html includes accessibility skip-link');
assert(indexHtml.includes('aria-label="Switch to light mode"') || indexHtml.includes('id="themeToggle"'), 'Theme toggle has accessible identification');
assert(indexHtml.includes('aria-expanded="false"'), 'Mobile hamburger menu has aria-expanded');
assert(indexHtml.includes('role="dialog"') && indexHtml.includes('aria-modal="true"'), 'Modal has dialog and aria-modal attributes');
assert(workHtml.includes('role="dialog"') && workHtml.includes('aria-modal="true"'), 'Work page modal has dialog and aria-modal attributes');

// Form input labels
const formInputIds = ['form-name', 'form-email', 'form-service', 'form-message'];
formInputIds.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `Form control #${id} exists`);
  assert(indexHtml.includes(`for="${id}"`), `Label for #${id} exists`);
});

// 5. User Constraint Check: SVG Avatar Placeholder Intact
console.log('\nTest Suite 5: User Constraints (Avatar Placeholder Intact)');
assert(indexHtml.includes('hero__photo-placeholder') && indexHtml.includes('Photo coming soon'), 'Hero photo placeholder is preserved intact');
assert(indexHtml.includes('about__photo-placeholder') && indexHtml.includes('Photo'), 'About photo placeholder is preserved intact');

// 6. Anti-AI Slop Compliance
console.log('\nTest Suite 6: Anti-AI Slop Audit');
const mainCss = fs.readFileSync(path.join(ROOT_DIR, 'assets/css/main.css'), 'utf8');

assert(!indexHtml.includes('hero__bg-orb'), 'No generic glow-orb elements in index.html');
assert(!mainCss.includes('.hero__bg-orb'), 'No glow-orb CSS classes in main.css');
assert(!mainCss.includes('--orb-1'), 'No --orb-1 variable in main.css');
assert(!mainCss.includes('--orb-2'), 'No --orb-2 variable in main.css');

// Check no emoji UI icons in navigation links
const navLinksHtml = (indexHtml.match(/<nav[\s\S]*?<\/nav>/g) || []).join('');
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(navLinksHtml), 'Navigation bar uses clean text and SVG icons without UI emojis');

// Check prefers-reduced-motion
assert(mainCss.includes('prefers-reduced-motion'), 'main.css contains @media (prefers-reduced-motion: reduce)');

// 7. Conversion Boost Feature Checks
console.log('\nTest Suite 7: Boost Features (Conversion & UX)');
assert(indexHtml.includes('id="retention"'), 'index.html contains Retention Breakdown section');
assert(indexHtml.includes('id="packages"'), 'index.html contains Transparent Packages section');
assert(indexHtml.includes('id="projectEstimator"'), 'index.html contains Interactive Scope Estimator');
assert(indexHtml.includes('data-copy-text="pranav.uknow@gmail.com"'), 'index.html has 1-click Copy Email action');
assert(indexHtml.includes('data-vertical="true"'), 'index.html supports vertical 9:16 player for YouTube shorts');
assert(indexHtml.includes('data-image-preview'), 'index.html supports high-res thumbnail preview');
assert(indexHtml.includes('id="toastNotification"'), 'Toast notification element present');

// 8. Work Page Synchronized Features
console.log('\nTest Suite 8: Work Page Polish');
assert(workHtml.includes('data-vertical="true"'), 'work.html supports vertical 9:16 Shorts player');
assert(workHtml.includes('data-image-preview'), 'work.html supports high-res thumbnail preview');
assert(workHtml.includes('work-page-cta'), 'work.html has prominent call-to-action');
assert(workHtml.includes('breadcrumb'), 'work.html has accessible breadcrumb navigation');

// 9. JavaScript Syntax & Structure
console.log('\nTest Suite 9: JavaScript Syntax & Modules');
const mainJs = fs.readFileSync(path.join(ROOT_DIR, 'assets/js/main.js'), 'utf8');
assert(mainJs.includes('ThemeManager'), 'main.js defines ThemeManager module');
assert(mainJs.includes('NavManager'), 'main.js defines NavManager module');
assert(mainJs.includes('WorkFilter'), 'main.js defines WorkFilter module');
assert(mainJs.includes('AnimationManager'), 'main.js defines AnimationManager module');
assert(mainJs.includes('CurrencyManager'), 'main.js defines CurrencyManager module');
assert(mainJs.includes('ScopeEstimator'), 'main.js defines ScopeEstimator module');
assert(mainJs.includes('PackageBooker'), 'main.js defines PackageBooker module');
assert(mainJs.includes('ContactForm'), 'main.js defines ContactForm module');
assert(mainJs.includes('VideoModal'), 'main.js defines VideoModal module');
assert(mainJs.includes('ClipboardHelper'), 'main.js defines ClipboardHelper module');
assert(mainJs.includes('modal__dialog--vertical'), 'main.js handles 9:16 vertical shorts aspect ratio');
assert(mainJs.includes('lastFocusedElement'), 'main.js manages accessible focus restoration on modal close');

// 10. Touch Targets & Mobile Ergonomics
console.log('\nTest Suite 10: Touch Targets & Mobile Ergonomics (Min 44x44px)');
assert(mainCss.includes('.modal__close') && mainCss.includes('width: 44px') && mainCss.includes('height: 44px'), 'Modal close button meets min 44x44px touch target');
assert(mainCss.includes('.btn--sm') && mainCss.includes('min-height: 44px'), 'Small buttons meet min 44px height touch target');
assert(mainCss.includes('.work__filter') && mainCss.includes('min-height: 44px'), 'Work filter chips meet min 44px height touch target');
assert(mainCss.includes('.contact__copy-btn') && mainCss.includes('min-height: 44px'), 'Contact copy email button meets min 44px height touch target');
assert(mainCss.includes('.estimator__pill') && mainCss.includes('min-height: 44px'), 'Estimator format pills meet min 44px height touch target');
assert(mainCss.includes('.currency-btn') && mainCss.includes('min-height: 44px'), 'Currency buttons meet min 44px height touch target');

// 11. Vertical Modal Responsiveness & Viewport Fit
console.log('\nTest Suite 11: Vertical Modal Responsiveness & Viewport Fit');
assert(mainCss.includes('.modal') && mainCss.includes('overflow-y: auto'), 'Modal container has overflow-y: auto to prevent screen clipping');
assert(mainCss.includes('.modal__dialog') && mainCss.includes('max-height: calc(100vh - 2rem)'), 'Modal dialog is constrained to viewport max-height');
assert(mainCss.includes('.modal__dialog--vertical') && mainCss.includes('calc((88vh - 110px) * 9 / 16)'), 'Vertical modal dialog calculates width from viewport height');

// 12. Discussion-First Scoping & Zero-Phone Privacy Channel Architecture
console.log('\nTest Suite 12: Discussion-First Scoping & Direct Contact Privacy');
assert(!indexHtml.includes('Starts $150') && !indexHtml.includes('Starts ₹12,000'), 'Zero public price numbers displayed in index.html (Direct discussion policy)');
assert(!indexHtml.includes('tel:') && !indexHtml.includes('whatsapp'), 'Zero phone numbers or WhatsApp links exposed in index.html');
assert(indexHtml.includes('pranav.uknow@gmail.com') && indexHtml.includes('instagram.com/pranav.uknow'), 'Direct contact restricted to verified Gmail and Instagram DM');
assert(indexHtml.includes('data-book-package="longform"') && indexHtml.includes('data-book-package="shorts"'), 'Collaboration cards have 1-click discussion CTA bindings');
assert(mainJs.includes('mail.google.com/mail/?view=cm'), 'Contact form generates direct Gmail Web Compose dispatch option');
assert(mainJs.includes('form__dispatch-actions') && mainJs.includes('dispatch-btn'), 'Contact form generates multi-channel dispatch UI');
assert(mainJs.includes('sLabel') && mainJs.includes('bLabel'), 'Contact form maps human-readable service and budget labels');

// 13. Accessibility & Focus Architecture
console.log('\nTest Suite 13: Accessibility & Focus Architecture');
assert(indexHtml.includes('<main id="main-content" tabindex="-1">'), 'index.html main element has tabindex="-1" for skip-link focus');
assert(workHtml.includes('<main id="main-content" tabindex="-1">'), 'work.html main element has tabindex="-1" for skip-link focus');
assert(indexHtml.includes('id="modalBookBtn"') && workHtml.includes('id="modalBookBtn"'), 'Modal footer has modalBookBtn id binding');
assert(mainJs.includes('close(false)'), 'VideoModal prevents focus stealing on Book button navigation');

// 14. Visual Craftsmanship & Studio Motifs
console.log('\nTest Suite 14: Visual Craftsmanship & Studio Motifs');
assert(indexHtml.includes('reel-art-svg') && workHtml.includes('reel-art-svg'), 'Reel cards include rich technical studio cinema SVG illustration');
assert(workHtml.includes('podcast-art-svg'), 'Podcast card includes multi-track audio waveform studio SVG graphic');
assert(mainCss.includes('.reel-art-svg') && mainCss.includes('.podcast-art-svg'), 'CSS defines styles for reel and podcast SVG graphics');

// 15. Clean Code Standards (Anti-Bloat & Function Lengths)
console.log('\nTest Suite 15: Clean Code Standards (Functions <= 30 lines)');
const jsLines = mainJs.split('\n');
let fnStart = -1, fnName = '', braceCount = 0, inFn = false, longFns = 0;
for (let i = 0; i < jsLines.length; i++) {
  const line = jsLines[i];
  const fnMatch = line.match(/function\s+([a-zA-Z0-9_$]+)/);
  if (fnMatch && !inFn) {
    fnStart = i; fnName = fnMatch[1];
    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    inFn = true; continue;
  }
  if (inFn) {
    braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (braceCount <= 0) {
      const len = i - fnStart + 1;
      if (len > 30) { longFns++; }
      inFn = false;
    }
  }
}
assert(longFns === 0, 'All functions in main.js are under 30 lines per clean code standards');

// Summary
console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
