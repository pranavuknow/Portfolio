/**
 * Pranav Shukla — Zero-Loophole Admin Vault & Control Room Controller
 * Web Crypto API · Constant-Time Auth · Brute-Force Shield · Strict Zero-XSS
 */
'use strict';

const AdminVault = (() => {
  const DEFAULT_SALT = 'pranav_cinema_salt_9988';
  const DEFAULT_HASH = '482129678f22d14e542547a1768c4c5efa05b2325647603fea2685ae5f76bb88';
  const AUTH_KEY = 'pranav_vault_auth';
  const LOCKOUT_KEY = 'pranav_admin_lockout';
  const SESSION_KEY = 'pranav_admin_session';
  const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  const LOCKOUT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes window

  let lockoutTimerId = null;
  let sessionTimerId = null;

  function getCredentials() {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.salt && parsed.hash) return parsed;
      }
    } catch {
      // Fallback to default
    }
    return { salt: DEFAULT_SALT, hash: DEFAULT_HASH };
  }

  function saveCredentials(salt, hash) {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ salt, hash }));
    } catch {
      // Storage unavailable
    }
  }

  function resetCredentials() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // Storage unavailable
    }
  }

  async function computeSha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  async function verifyPassphrase(inputPass) {
    const creds = getCredentials();
    const computed = await computeSha256(`${creds.salt}:${inputPass}`);
    return constantTimeEqual(computed, creds.hash);
  }

  function getLockoutStatus() {
    try {
      const raw = localStorage.getItem(LOCKOUT_KEY);
      if (!raw) return { locked: false, remainingSec: 0 };
      const data = JSON.parse(raw);
      const now = Date.now();
      if (data.lockoutUntil && data.lockoutUntil > now) {
        return { locked: true, remainingSec: Math.ceil((data.lockoutUntil - now) / 1000) };
      }
      if (data.firstAttemptTime && now - data.firstAttemptTime > LOCKOUT_WINDOW_MS) {
        localStorage.removeItem(LOCKOUT_KEY);
        return { locked: false, remainingSec: 0 };
      }
      return { locked: false, remainingSec: 0, attempts: data.attempts || 0 };
    } catch {
      return { locked: false, remainingSec: 0 };
    }
  }

  function recordFailedAttempt() {
    const now = Date.now();
    let data = { attempts: 0, firstAttemptTime: now, lockoutUntil: null };
    try {
      const raw = localStorage.getItem(LOCKOUT_KEY);
      if (raw) data = Object.assign(data, JSON.parse(raw));
    } catch {
      // Parse error fallback
    }
    if (!data.firstAttemptTime || now - data.firstAttemptTime > LOCKOUT_WINDOW_MS) {
      data.attempts = 1;
      data.firstAttemptTime = now;
      data.lockoutUntil = null;
    } else {
      data.attempts = (data.attempts || 0) + 1;
    }
    if (data.attempts >= 5) {
      data.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
    return data;
  }

  function clearLockout() {
    try {
      localStorage.removeItem(LOCKOUT_KEY);
    } catch {
      // Storage unavailable
    }
  }

  function generateHexToken(byteCount = 16) {
    const bytes = new Uint8Array(byteCount);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function createSession() {
    const session = {
      token: generateHexToken(24),
      expiresAt: Date.now() + SESSION_DURATION_MS
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable
    }
    return session;
  }

  function isSessionValid() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return session.expiresAt && session.expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  function destroySession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable
    }
    if (sessionTimerId) clearInterval(sessionTimerId);
  }

  function formatTime(seconds) {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.floor(Math.max(0, seconds) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function showAuthGate() {
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('authGate').classList.remove('hidden');
    checkLockoutState();
  }

  function showDashboard() {
    document.getElementById('authGate').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    startSessionTimer();
    renderDashboard();
  }

  function updateLockoutUI(status) {
    const banner = document.getElementById('lockoutBanner');
    const timerText = document.getElementById('lockoutTimer');
    const submitBtn = document.getElementById('authSubmitBtn');
    const passInput = document.getElementById('passphraseInput');
    if (status.locked) {
      banner.classList.remove('hidden');
      timerText.textContent = formatTime(status.remainingSec);
      submitBtn.disabled = true;
      passInput.disabled = true;
    } else {
      banner.classList.add('hidden');
      submitBtn.disabled = false;
      passInput.disabled = false;
    }
  }

  function checkLockoutState() {
    const status = getLockoutStatus();
    updateLockoutUI(status);
    if (status.locked && !lockoutTimerId) {
      lockoutTimerId = setInterval(() => {
        const current = getLockoutStatus();
        updateLockoutUI(current);
        if (!current.locked) {
          clearInterval(lockoutTimerId);
          lockoutTimerId = null;
        }
      }, 1000);
    }
  }

  function startSessionTimer() {
    if (sessionTimerId) clearInterval(sessionTimerId);
    const timerText = document.getElementById('sessionTimerText');
    sessionTimerId = setInterval(() => {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return handleLogout();
        const session = JSON.parse(raw);
        const remaining = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
        timerText.textContent = formatTime(remaining);
        if (remaining <= 0) handleLogout();
      } catch {
        handleLogout();
      }
    }, 1000);
  }

  function showToast(message) {
    const toast = document.getElementById('adminToast');
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3200);
  }

  function renderMetricCards(data) {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('metricTotalViews').textContent = data.totalViews.toLocaleString();
    document.getElementById('metricUniqueVisitors').textContent = data.uniqueVisitors.toLocaleString();
    document.getElementById('metricTodayVisits').textContent = (data.viewsByDate[today] || 0).toLocaleString();
    document.getElementById('metricInquiries').textContent = (data.inquiriesCount || 0).toLocaleString();
    document.getElementById('refreshTimestamp').textContent = `Refreshed: ${new Date().toLocaleTimeString()}`;
  }

  function createSourceItem(name, count, total) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const item = document.createElement('div');
    item.className = 'source-item';
    const meta = document.createElement('div');
    meta.className = 'source-meta';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'source-name';
    nameSpan.textContent = name;
    const countSpan = document.createElement('span');
    countSpan.className = 'source-count';
    countSpan.textContent = `${count} (${pct}%)`;
    meta.append(nameSpan, countSpan);
    const barWrap = document.createElement('div');
    barWrap.className = 'source-bar-wrap';
    const barFill = document.createElement('div');
    barFill.className = 'source-bar-fill';
    barFill.style.width = `${pct}%`;
    barWrap.appendChild(barFill);
    item.append(meta, barWrap);
    return item;
  }

  function renderTrafficSources(referrers, total) {
    const list = document.getElementById('trafficSourcesList');
    list.replaceChildren();
    const entries = Object.entries(referrers || {}).sort((a, b) => b[1] - a[1]);
    document.getElementById('trafficCountBadge').textContent = `${entries.length} Sources`;
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'source-meta';
      empty.textContent = 'No traffic sources recorded yet.';
      list.appendChild(empty);
      return;
    }
    entries.forEach(([name, count]) => {
      list.appendChild(createSourceItem(name, count, total));
    });
  }

  function createPageRow(path, views) {
    const tr = document.createElement('tr');
    const tdPath = document.createElement('td');
    tdPath.className = 'page-path';
    tdPath.textContent = path;
    const tdViews = document.createElement('td');
    tdViews.style.textAlign = 'right';
    tdViews.textContent = views.toLocaleString();
    tr.append(tdPath, tdViews);
    return tr;
  }

  function renderTopPages(pages) {
    const tbody = document.getElementById('pagesTableBody');
    tbody.replaceChildren();
    const entries = Object.entries(pages || {}).sort((a, b) => b[1] - a[1]);
    document.getElementById('pagesCountBadge').textContent = `${entries.length} Pages`;
    if (entries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = 'No page view events recorded yet.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    entries.forEach(([path, views]) => tbody.appendChild(createPageRow(path, views)));
  }

  function createEventItem(event) {
    const item = document.createElement('div');
    item.className = 'event-item';
    const details = document.createElement('div');
    details.className = 'event-details';
    const nameEl = document.createElement('span');
    nameEl.className = 'event-name';
    nameEl.textContent = event.name;
    const metaEl = document.createElement('span');
    metaEl.className = 'event-meta';
    metaEl.textContent = JSON.stringify(event.meta || {});
    details.append(nameEl, metaEl);
    const timeEl = document.createElement('span');
    timeEl.className = 'event-time';
    timeEl.textContent = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    item.append(details, timeEl);
    return item;
  }

  function renderEvents(events) {
    const feed = document.getElementById('eventsFeed');
    feed.replaceChildren();
    const list = (events || []).slice().reverse();
    document.getElementById('eventsCountBadge').textContent = `${list.length} Logged`;
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'source-meta';
      empty.textContent = 'No inquiry or interaction events recorded yet.';
      feed.appendChild(empty);
      return;
    }
    list.forEach(evt => feed.appendChild(createEventItem(evt)));
  }

  function renderDashboard() {
    if (!window.PranavAnalytics) return;
    const data = window.PranavAnalytics.getAnalyticsData();
    renderMetricCards(data);
    renderTrafficSources(data.referrers, data.totalViews);
    renderTopPages(data.pages);
    renderEvents(data.events);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const lockout = getLockoutStatus();
    if (lockout.locked) return updateLockoutUI(lockout);
    const passInput = document.getElementById('passphraseInput');
    const alertBox = document.getElementById('authAlert');
    const isValid = await verifyPassphrase(passInput.value.trim());
    if (isValid) {
      clearLockout();
      passInput.value = '';
      alertBox.classList.add('hidden');
      createSession();
      showDashboard();
      showToast('Admin Vault Terminal Authenticated.');
    } else {
      const failState = recordFailedAttempt();
      alertBox.textContent = failState.lockoutUntil
        ? 'Passphrase invalid. Maximum failed attempts reached.'
        : `Passphrase incorrect. ${5 - failState.attempts} attempts remaining.`;
      alertBox.classList.remove('hidden');
      checkLockoutState();
    }
  }

  function handleLogout() {
    destroySession();
    showAuthGate();
    showToast('Vault Session Terminated.');
  }

  function handleWipeStats() {
    if (window.PranavAnalytics) {
      window.PranavAnalytics.clearAnalytics();
      renderDashboard();
      document.getElementById('wipeModal').classList.add('hidden');
      showToast('Telemetry records successfully purged.');
    }
  }

  async function handleChangePassSubmit(e) {
    e.preventDefault();
    const cur = document.getElementById('currentPassInput').value.trim();
    const next = document.getElementById('newPassInput').value.trim();
    const conf = document.getElementById('confirmPassInput').value.trim();
    const alertBox = document.getElementById('changePassAlert');
    const isValid = await verifyPassphrase(cur);
    if (!isValid) {
      alertBox.textContent = 'Current passphrase is incorrect.';
      return alertBox.classList.remove('hidden');
    }
    if (next.length < 8 || next !== conf) {
      alertBox.textContent = next.length < 8 ? 'New passphrase must be >= 8 chars.' : 'New passphrases do not match.';
      return alertBox.classList.remove('hidden');
    }
    const newSalt = `salt_${generateHexToken(16)}`;
    const newHash = await computeSha256(`${newSalt}:${next}`);
    saveCredentials(newSalt, newHash);
    document.getElementById('passphraseModal').classList.add('hidden');
    e.target.reset();
    showToast('Master passphrase and salt updated.');
  }

  function handleResetDefaultPass() {
    resetCredentials();
    document.getElementById('passphraseModal').classList.add('hidden');
    document.getElementById('changePassForm').reset();
    showToast('Credentials restored to factory default.');
  }

  function bindEvents() {
    document.getElementById('authForm').addEventListener('submit', handleLoginSubmit);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('exportCsvBtn').addEventListener('click', () => window.PranavAnalytics?.exportReport('csv'));
    document.getElementById('exportJsonBtn').addEventListener('click', () => window.PranavAnalytics?.exportReport('json'));
    document.getElementById('wipeStatsBtn').addEventListener('click', () => document.getElementById('wipeModal').classList.remove('hidden'));
    document.getElementById('cancelWipeModalBtn').addEventListener('click', () => document.getElementById('wipeModal').classList.add('hidden'));
    document.getElementById('confirmWipeModalBtn').addEventListener('click', handleWipeStats);
    document.getElementById('changePassBtn').addEventListener('click', () => document.getElementById('passphraseModal').classList.remove('hidden'));
    document.getElementById('cancelPassModalBtn').addEventListener('click', () => document.getElementById('passphraseModal').classList.add('hidden'));
    document.getElementById('changePassForm').addEventListener('submit', handleChangePassSubmit);
    document.getElementById('resetPassDefaultBtn').addEventListener('click', handleResetDefaultPass);
  }

  function init() {
    bindEvents();
    if (isSessionValid()) {
      showDashboard();
    } else {
      showAuthGate();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  return { verifyPassphrase, computeSha256, constantTimeEqual, isSessionValid };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminVault;
}
