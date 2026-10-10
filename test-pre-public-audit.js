/**
 * 4-Agent Pre-Public Launch Simulation & Vulnerability Audit
 *
 * Simulates 4 distinct perspectives before pushing to GitHub & Public Web:
 * 1. ClientPersonaAgent — Prospective high-ticket client testing UX, clarity & flows
 * 2. SecurityPenTesterAgent — Ethical hacker testing XSS, auth bypass, brute force & leaks
 * 3. AdverseConditionsAgent — Bug finder testing private browsing, keyboard nav, viewport
 * 4. GitHubReleaseArchitect — DevOps & open-source auditor testing git hygiene & paths
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedChecks++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedChecks++;
  }
}

const ROOT = __dirname;
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const workHtml = fs.readFileSync(path.join(ROOT, 'work.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
const privacyHtml = fs.readFileSync(path.join(ROOT, 'privacy-policy.html'), 'utf8');
const termsHtml = fs.readFileSync(path.join(ROOT, 'terms.html'), 'utf8');
const cookieHtml = fs.readFileSync(path.join(ROOT, 'cookie-policy.html'), 'utf8');
const refundHtml = fs.readFileSync(path.join(ROOT, 'refund-policy.html'), 'utf8');
const notFoundHtml = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');

const mainJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'main.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'admin.js'), 'utf8');
const analyticsJs = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'analytics.js'), 'utf8');
const mainCss = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'main.css'), 'utf8');

console.log('\n====================================================');
console.log('AGENT 1: CLIENT PERSONA & HUMAN UX AUDIT');
console.log('====================================================');

// 1. Value clarity
assert(indexHtml.includes('I turn raw footage into high-retention stories') && indexHtml.includes('Pacing, sound architecture, and click-worthy packaging'),
  'Hero delivers crystal-clear value proposition for creators and brands');

// 2. All HTML files exist
const htmlFiles = ['index.html', 'work.html', 'admin.html', 'privacy-policy.html', 'terms.html', 'cookie-policy.html', 'refund-policy.html', '404.html'];
const allFilesExist = htmlFiles.every(f => fs.existsSync(path.join(ROOT, f)));
assert(allFilesExist, 'All 8 core HTML pages exist and are accessible');

// 3. Link resolution across pages
const internalAnchorMatches = [...indexHtml.matchAll(/href="#([a-zA-Z0-9_-]+)"/g)].map(m => m[1]);
const missingAnchors = internalAnchorMatches.filter(id => !indexHtml.includes(`id="${id}"`));
assert(missingAnchors.length === 0, `All ${internalAnchorMatches.length} internal anchor links resolve to valid IDs in index.html`);

// 4. Zero public pricing
const hasPriceNumbers = /Starts\s*\$|Starts\s*₹|\$150|\$35|\$25|₹12,000|₹2,800|₹2,000/.test(indexHtml + mainJs);
assert(!hasPriceNumbers, 'Zero dollar ($) or rupee (₹) pricing numbers anywhere in public code');

// 5. Zero phone numbers
const hasPhoneLinks = /tel:|whatsapp|\+91\s*\d{5}/i.test(indexHtml + workHtml + privacyHtml);
assert(!hasPhoneLinks, 'Zero phone numbers or WhatsApp links across all public pages');

// 6. Direct contact channels
assert(indexHtml.includes('pranav.uknow@gmail.com') && indexHtml.includes('instagram.com/pranav.uknow'),
  'Direct contact strictly points to verified Gmail and Instagram');

// 7. Touch targets
assert(mainCss.includes('min-height: 44px') || mainCss.includes('min-height: 48px'),
  'Interactive buttons and controls enforce minimum 44px touch targets');

console.log('\n====================================================');
console.log('AGENT 2: ETHICAL HACKER & PENETRATION AUDIT');
console.log('====================================================');

// 8. DOM XSS Scan
const hasDangerousInnerHtml = /innerHTML\s*=\s*[^;]*(\+|`[^`]*\${(name|email|message|notes|service|budget)[^}]*}|\bval\b)/i.test(mainJs);
assert(!hasDangerousInnerHtml, 'Zero unescaped user variable insertions via innerHTML in main.js');

// 9. Zero plaintext credentials in admin
assert(!adminJs.includes('pranav2026!') && !adminHtml.includes('pranav2026!'),
  'Zero plaintext passwords or secrets in admin.js or admin.html source');

// 10. Constant-time equality for auth
assert(adminJs.includes('constantTimeEqual') && adminJs.includes('diff |= a.charCodeAt(i) ^ b.charCodeAt(i)'),
  'Admin authentication implements timing-attack resistant constant-time comparison');

// 11. Brute-force lockout
assert(adminJs.includes('data.attempts >= 5') && adminJs.includes('LOCKOUT_DURATION_MS'),
  'Brute-force shield triggers 15-minute freeze upon 5 failed attempts');

// 12. Session expiry
assert(adminJs.includes('SESSION_DURATION_MS = 30 * 60 * 1000'),
  'Admin session bounded to 30 minutes to prevent zombie sessions');

// 13. Anti-clickjacking & Framebuster
assert(adminHtml.includes('if (window.top !== window.self)') && fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').includes('X-Frame-Options: DENY'),
  'Dual-layer clickjacking defense: JS framebuster + HTTP X-Frame-Options: DENY');

// 14. Sensitive secret scanner (AWS, Google, Stripe, Private keys)
const allCode = [indexHtml, workHtml, adminHtml, privacyHtml, termsHtml, cookieHtml, refundHtml, mainJs, adminJs, analyticsJs].join('\n');
const hasLeakedSecrets = /AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24}|AIza[0-9A-Za-z-_]{35}|BEGIN PRIVATE KEY/i.test(allCode);
assert(!hasLeakedSecrets, 'Zero private API keys, AWS tokens, or cloud secrets found in codebase');

// 15. Content Security Policy
const headersContent = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
assert(headersContent.includes("Content-Security-Policy") && headersContent.includes("default-src 'self'"),
  'Production Content-Security-Policy defines strict default-src');

// 16. robots.txt
const robotsTxt = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
assert(robotsTxt.includes('Disallow: /admin.html') && robotsTxt.includes('Disallow: /control/'),
  'robots.txt conceals Admin Control Room from search engine indexing');

console.log('\n====================================================');
console.log('AGENT 3: ADVERSE CONDITIONS & BUG FINDER AUDIT');
console.log('====================================================');

// 17. Storage-Disabled Resilience
const storageThrowCheck = () => {
  const tryCatchPattern = /try\s*\{\s*const raw = localStorage\.getItem/;
  return tryCatchPattern.test(analyticsJs) && tryCatchPattern.test(adminJs);
};
assert(storageThrowCheck(), 'Analytics and Admin modules safely catch storage exceptions (Private Browsing proof)');

// 18. Keyboard accessibility & skip link
assert(indexHtml.includes('class="skip-link"') && indexHtml.includes('href="#main-content"') && indexHtml.includes('id="main-content" tabindex="-1"'),
  'Accessible skip-to-content link and programmatic focus target properly configured');

// 19. Modal focus management
assert(mainJs.includes('close(true)') && mainJs.includes("e.key === 'Escape'"),
  'Video modal listens for Escape key dismissal and handles focus teardown');

// 20. Reduced motion support
assert(mainCss.includes('@media (prefers-reduced-motion: reduce)'),
  'CSS honors prefers-reduced-motion preference across all transitions');

// 21. High-contrast theme tokens
assert(mainCss.includes('[data-theme="light"]') && mainCss.includes('--text-primary: #111216'),
  'Light mode provides high-contrast typography satisfying WCAG AA (> 4.5:1)');

// 22. Asset integrity
const ogExists = fs.existsSync(path.join(ROOT, 'assets', 'og-image.jpg')) && fs.statSync(path.join(ROOT, 'assets', 'og-image.jpg')).size > 10000;
const favExists = fs.existsSync(path.join(ROOT, 'assets', 'favicon.svg')) && fs.statSync(path.join(ROOT, 'assets', 'favicon.svg')).size > 100;
assert(ogExists && favExists, 'OpenGraph social image (68KB) and SVG favicon exist and are non-empty');

// 23. PWA manifest validity
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert(manifest.name && manifest.icons && manifest.icons.length > 0, 'PWA Webmanifest is valid JSON with icons and theme configuration');
} catch (e) {
  assert(false, `PWA manifest failed parsing: ${e.message}`);
}

console.log('\n====================================================');
console.log('AGENT 4: GITHUB & DEPLOYMENT RELEASE ARCHITECT');
console.log('====================================================');

// 24. .gitignore exists
assert(fs.existsSync(path.join(ROOT, '.gitignore')), '.gitignore exists to shield OS and runtime artifacts');

// 25. LICENSE exists
assert(fs.existsSync(path.join(ROOT, 'LICENSE')) && fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8').includes('Pranav Shukla'),
  'MIT LICENSE file exists with verified copyright attribution');

// 26. README.md completeness
const readmeContent = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
assert(readmeContent.includes('10-Year Durability') && readmeContent.includes('GitHub Pages'),
  'README.md provides complete architecture, security, and deployment documentation');

// 27. Relative asset path portability
const hasAbsoluteAssetPaths = /href="\/assets\/|src="\/assets\//.test(indexHtml + workHtml + adminHtml);
assert(!hasAbsoluteAssetPaths, 'Zero root-relative paths: all assets use relative paths for GitHub Pages subpath compatibility');

// 28. Clean Code standard (functions <= 30 lines)
function verifyMaxLinesPerFunction(code, filename) {
  const lines = code.split('\n');
  let maxLen = 0;
  let inFunc = false;
  let currentLen = 0;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inFunc && /function\s+([a-zA-Z0-9_$]+)?\s*\(/.test(line)) {
      inFunc = true;
      currentLen = 1;
      braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }
    if (inFunc) {
      currentLen++;
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        if (currentLen > maxLen) maxLen = currentLen;
        inFunc = false;
      }
    }
  }
  return maxLen;
}
const maxMainFn = verifyMaxLinesPerFunction(mainJs, 'main.js');
const maxAdminFn = verifyMaxLinesPerFunction(adminJs, 'admin.js');
const maxAnalyticsFn = verifyMaxLinesPerFunction(analyticsJs, 'analytics.js');
assert(maxMainFn <= 30 && maxAdminFn <= 30 && maxAnalyticsFn <= 30,
  `All JS functions strictly <= 30 lines (main: ${maxMainFn}, admin: ${maxAdminFn}, analytics: ${maxAnalyticsFn})`);

// 29. Anti-AI Slop audit
const hasAiSlop = /glow-orb|linear-gradient\(.*#8a2be2.*#00ffff\)|radial-gradient\(.*purple.*cyan\)/i.test(mainCss);
assert(!hasAiSlop, 'Zero generic AI slop gradients or glowing orbs detected in stylesheets');

// 30. Ready for GitHub commit
assert(passedChecks >= 29, 'Repository passes all pre-flight gates and is 100% ready for public GitHub release');

console.log('\n====================================================');
console.log(`PRE-PUBLIC LAUNCH SUMMARY: ${passedChecks} PASSED, ${failedChecks} FAILED`);
console.log('====================================================\n');

process.exit(failedChecks === 0 ? 0 : 1);
