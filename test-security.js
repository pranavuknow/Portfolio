/**
 * Security & Admin Suite Verification
 * Validates CSP headers, robots.txt, analytics vault, admin authentication,
 * cryptographic hashes, lockout policies, and clean code limits.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('====================================================');
console.log('RUNNING SECURITY & ADMIN VERIFICATION SUITE');
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

const ROOT_DIR = __dirname;

// Suite S1: _headers validation
console.log('Suite S1: HTTP Security Headers & CSP Configuration');
const headersPath = path.join(ROOT_DIR, '_headers');
assert(fs.existsSync(headersPath), '_headers file exists in root');
const headersContent = fs.readFileSync(headersPath, 'utf8');

assert(headersContent.includes('X-Frame-Options: DENY'), '_headers specifies X-Frame-Options: DENY');
assert(headersContent.includes('X-Content-Type-Options: nosniff'), '_headers specifies X-Content-Type-Options: nosniff');
assert(headersContent.includes('Referrer-Policy: strict-origin-when-cross-origin'), '_headers specifies Referrer-Policy');
assert(headersContent.includes('Permissions-Policy: camera=(), microphone=(), geolocation=()'), '_headers specifies Permissions-Policy');
assert(headersContent.includes("default-src 'self'"), 'CSP defines default-src');
assert(headersContent.includes('https://fonts.googleapis.com') && headersContent.includes('https://fonts.gstatic.com'), 'CSP allows Google Fonts');
assert(headersContent.includes('https://i.ytimg.com') && headersContent.includes('https://www.youtube-nocookie.com'), 'CSP allows YouTube embeds and thumbnails');
assert(headersContent.includes("script-src 'self' 'unsafe-inline'"), 'CSP allows inline theme script');
assert(headersContent.includes("connect-src 'self' https:"), 'CSP allows HTTPS connections');
assert(headersContent.includes('Cache-Control: public, max-age=31536000, immutable'), 'Assets cache control set for 1 year immutable');
assert(headersContent.includes('Cache-Control: no-cache, no-store, must-revalidate'), 'HTML/admin cache control set to no-cache');

// Suite S2: robots.txt validation
console.log('\nSuite S2: robots.txt Crawl Control');
const robotsContent = fs.readFileSync(path.join(ROOT_DIR, 'robots.txt'), 'utf8');
assert(robotsContent.includes('Disallow: /admin.html'), 'robots.txt disallows /admin.html');
assert(robotsContent.includes('Disallow: /control/'), 'robots.txt disallows /control/');

// Suite S3: Script inclusion & Stealth Triggers
console.log('\nSuite S3: Stealth Triggers & Script Inclusions');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const workHtml = fs.readFileSync(path.join(ROOT_DIR, 'work.html'), 'utf8');
const privacyHtml = fs.readFileSync(path.join(ROOT_DIR, 'privacy-policy.html'), 'utf8');

assert(indexHtml.includes('<script src="./assets/js/analytics.js"></script>') &&
       indexHtml.indexOf('<script src="./assets/js/analytics.js"></script>') < indexHtml.indexOf('<script src="./assets/js/main.js"></script>'), 'index.html includes analytics.js before main.js');
assert(workHtml.includes('<script src="./assets/js/analytics.js"></script>') &&
       workHtml.indexOf('<script src="./assets/js/analytics.js"></script>') < workHtml.indexOf('<script src="./assets/js/main.js"></script>'), 'work.html includes analytics.js before main.js');
assert(privacyHtml.includes('<script src="./assets/js/analytics.js"></script>') &&
       privacyHtml.indexOf('<script src="./assets/js/analytics.js"></script>') < privacyHtml.indexOf('<script src="./assets/js/main.js"></script>'), 'privacy-policy.html includes analytics.js before main.js');

assert(indexHtml.includes('ctrlKey') && indexHtml.includes('shiftKey') && indexHtml.includes('admin.html'),
       'index.html contains stealth hotkey trigger (Ctrl + Shift + A)');
assert(indexHtml.includes('handleCopyrightTripleClick') || (indexHtml.includes('clicks') && indexHtml.includes('admin.html')),
       'index.html contains secret triple-click trigger to admin.html');

// Suite S4: Cryptographic & Auth Integrity
console.log('\nSuite S4: Cryptographic Implementation & Zero Plaintext Passwords');
const adminJsPath = path.join(ROOT_DIR, 'assets/js/admin.js');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

assert(!adminJs.includes('pranav2026!'), 'ZERO raw passwords present in admin.js source code');

const expectedSalt = 'pranav_cinema_salt_9988';
const expectedHash = crypto.createHash('sha256').update(`${expectedSalt}:pranav2026!`).digest('hex');
assert(expectedHash === '482129678f22d14e542547a1768c4c5efa05b2325647603fea2685ae5f76bb88', 'Default SHA-256 hash matches exact expected hex');
assert(adminJs.includes(expectedHash), 'admin.js stores verified salted SHA-256 hash');
assert(adminJs.includes('crypto.subtle.digest'), 'admin.js uses Web Crypto API for SHA-256 calculation');
assert(adminJs.includes('constantTimeEqual') || adminJs.includes('timingSafeEqual'), 'admin.js implements constant-time string comparison');

// Suite S5: Brute-Force & Session Protection Logic
console.log('\nSuite S5: Brute-Force Shield & Session Policy');
assert(adminJs.includes('attempts >= 5') && adminJs.includes('15 * 60 * 1000'), 'admin.js enforces 15-minute lockout on 5 failed attempts');
assert(adminJs.includes('30 * 60 * 1000'), 'admin.js enforces 30-minute session expiration');
assert(adminJs.includes('sessionStorage'), 'admin.js stores transient session in sessionStorage');

// Suite S6: Analytics Functionality
console.log('\nSuite S6: Privacy-First Analytics Module');
const analyticsJs = fs.readFileSync(path.join(ROOT_DIR, 'assets/js/analytics.js'), 'utf8');
assert(analyticsJs.includes('pranav_vault_analytics'), 'analytics.js stores telemetry under pranav_vault_analytics');
assert(analyticsJs.includes('recordEvent'), 'analytics.js exposes recordEvent API');
assert(analyticsJs.includes('exportReport'), 'analytics.js exposes exportReport API');
assert(analyticsJs.includes('detectReferrer'), 'analytics.js identifies traffic referrers');
assert(analyticsJs.includes('detectDevice'), 'analytics.js identifies device categories');
assert(!analyticsJs.includes('document.cookie'), 'ZERO cookie tracking in analytics.js');

// Suite S7: Clean Code Limits (Functions <= 30 lines)
console.log('\nSuite S7: Clean Code Standards (Functions <= 30 lines)');
function checkFunctionLengths(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fnStart = -1, fnName = '', braceCount = 0, inFn = false, count = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
        if (len > 30) count++;
        inFn = false;
      }
    }
  }
  return count;
}

assert(checkFunctionLengths(path.join(ROOT_DIR, 'assets/js/analytics.js')) === 0, 'All functions in analytics.js are <= 30 lines');
assert(checkFunctionLengths(path.join(ROOT_DIR, 'assets/js/admin.js')) === 0, 'All functions in admin.js are <= 30 lines');
assert(checkFunctionLengths(path.join(ROOT_DIR, 'assets/js/main.js')) === 0, 'All functions in main.js are <= 30 lines');

// Suite S8: Visual & Aesthetic Compliance
console.log('\nSuite S8: Visual & Aesthetic Compliance (Anti-Emoji & SVG Icons)');
const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(adminHtml), 'admin.html contains ZERO UI emojis');
assert(!emojiRegex.test(adminJs), 'admin.js contains ZERO UI emojis');
assert(adminHtml.includes('<svg') && adminHtml.includes('</svg>'), 'admin.html utilizes studio SVG vector iconography');
assert(adminHtml.includes('window.top !== window.self'), 'admin.html includes anti-clickjacking framebuster');

console.log('\n====================================================');
console.log(`SECURITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);
process.exit(0);
