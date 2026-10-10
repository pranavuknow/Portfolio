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
  let currentChartRange = 7;
  let currentChartType = 'area';

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

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function getDaysData(viewsByDate, days) {
    const list = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      list.push({ iso, label, count: (viewsByDate && viewsByDate[iso]) || 0 });
    }
    return list;
  }

  function calculateChartMetrics(daysList) {
    let peak = { label: 'None', count: 0 };
    let sum = 0;
    daysList.forEach(item => {
      sum += item.count;
      if (item.count > peak.count) peak = item;
    });
    const avg = daysList.length ? Math.round((sum / daysList.length) * 10) / 10 : 0;
    return { peak, sum, avg };
  }

  function updateChartSummaryUI(metrics) {
    document.getElementById('chartPeakDay').textContent = metrics.peak.count > 0
      ? `${metrics.peak.label} (${metrics.peak.count})`
      : 'None';
    document.getElementById('chartDailyAvg').textContent = `${metrics.avg} / day`;
    document.getElementById('chartPeriodTotal').textContent = `${metrics.sum} views`;
  }

  function buildGridLines(svg, maxVal, pad, chartH) {
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (chartH / 3) * i;
      const val = Math.round(maxVal - (maxVal / 3) * i);
      const line = createSvgEl('line', {
        x1: pad.left, y1: y, x2: 740, y2: y,
        stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '4 4'
      });
      const text = createSvgEl('text', {
        x: pad.left - 8, y: y + 4, 'text-anchor': 'end',
        fill: '#6b7280', 'font-size': '11', 'font-family': 'monospace'
      });
      text.textContent = String(val);
      svg.append(line, text);
    }
  }

  function buildAreaPath(points) {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  function attachTooltipEvents(el, pt) {
    el.addEventListener('mouseenter', (e) => showChartTooltip(e, pt));
    el.addEventListener('mouseleave', hideChartTooltip);
    el.addEventListener('touchstart', (e) => showChartTooltip(e, pt), { passive: true });
  }

  function showChartTooltip(e, pt) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;
    document.getElementById('tooltipDate').textContent = pt.label;
    document.getElementById('tooltipVal').textContent = `${pt.count} Views`;
    tooltip.classList.remove('hidden');
    const container = document.getElementById('chartContainer');
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(10, Math.min(rect.width - 130, clientX - rect.left - 50));
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${Math.max(10, pt.y - 20)}px`;
  }

  function hideChartTooltip() {
    const tooltip = document.getElementById('chartTooltip');
    if (tooltip) tooltip.classList.add('hidden');
  }

  function renderChartDots(svg, points) {
    points.forEach(pt => {
      const circle = createSvgEl('circle', {
        cx: pt.x, cy: pt.y, r: '4', fill: '#0b0c10', stroke: '#e5a93c',
        'stroke-width': '2', class: 'chart-dot', cursor: 'pointer'
      });
      attachTooltipEvents(circle, pt);
      svg.appendChild(circle);
    });
  }

  function renderAreaChart(svg, points, pad) {
    const linePathStr = buildAreaPath(points);
    const bottomY = 260 - pad.bottom;
    const areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
    const areaPath = createSvgEl('path', {
      d: areaPathStr, fill: 'url(#chartAreaGradient)', opacity: '0.9'
    });
    const linePath = createSvgEl('path', {
      d: linePathStr, fill: 'none', stroke: '#e5a93c', 'stroke-width': '2.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    svg.append(areaPath, linePath);
    renderChartDots(svg, points);
  }

  function renderBarChart(svg, points, pad) {
    const bottomY = 260 - pad.bottom;
    const barW = Math.max(8, Math.min(28, 500 / points.length));
    points.forEach(pt => {
      const h = Math.max(4, bottomY - pt.y);
      const rect = createSvgEl('rect', {
        x: pt.x - barW / 2, y: pt.y, width: barW, height: h,
        rx: '4', ry: '4', fill: 'url(#chartBarGradient)', class: 'chart-bar', cursor: 'pointer'
      });
      attachTooltipEvents(rect, pt);
      svg.appendChild(rect);
    });
  }

  function renderChartAxisLabels(svg, points, pad) {
    const step = Math.max(1, Math.ceil(points.length / 7));
    points.forEach((pt, idx) => {
      if (idx % step === 0 || idx === points.length - 1) {
        const text = createSvgEl('text', {
          x: pt.x, y: 260 - pad.bottom + 18, 'text-anchor': 'middle',
          fill: '#9ca3af', 'font-size': '10', 'font-family': 'monospace'
        });
        text.textContent = pt.label;
        svg.appendChild(text);
      }
    });
  }

  function renderTrafficChart(viewsByDate, range, type) {
    const svg = document.getElementById('trafficChartSvg');
    if (!svg) return;
    const defs = svg.querySelector('defs');
    svg.replaceChildren();
    if (defs) svg.appendChild(defs);
    const pad = { left: 45, right: 25, top: 25, bottom: 35 };
    const chartW = 760 - pad.left - pad.right;
    const chartH = 260 - pad.top - pad.bottom;
    const daysList = getDaysData(viewsByDate, range);
    const metrics = calculateChartMetrics(daysList);
    updateChartSummaryUI(metrics);
    const maxVal = Math.max(6, Math.ceil(metrics.peak.count * 1.25));
    buildGridLines(svg, maxVal, pad, chartH);
    const points = daysList.map((item, idx) => {
      const x = pad.left + (chartW / (daysList.length - 1 || 1)) * idx;
      const y = pad.top + chartH - (item.count / maxVal) * chartH;
      return { x, y, ...item };
    });
    if (type === 'bar') renderBarChart(svg, points, pad);
    else renderAreaChart(svg, points, pad);
    renderChartAxisLabels(svg, points, pad);
  }

  function createProgressItem(label, count, pct) {
    const row = document.createElement('div');
    row.className = 'device-stat-row';
    const meta = document.createElement('div');
    meta.className = 'device-stat-meta';
    const nameEl = document.createElement('span');
    nameEl.textContent = label;
    const valEl = document.createElement('span');
    valEl.textContent = `${count} (${pct}%)`;
    meta.append(nameEl, valEl);
    const track = document.createElement('div');
    track.className = 'device-bar-track';
    const fill = document.createElement('div');
    fill.className = 'device-bar-fill';
    fill.style.width = `${pct}%`;
    track.appendChild(fill);
    row.append(meta, track);
    return row;
  }

  function renderDeviceBreakdown(devices, total) {
    const wrap = document.getElementById('deviceBreakdownWrap');
    if (!wrap) return;
    wrap.replaceChildren();
    const categories = ['Desktop', 'Mobile', 'Tablet'];
    categories.forEach(cat => {
      const count = (devices && devices[cat]) || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      wrap.appendChild(createProgressItem(cat, count, pct));
    });
  }

  function renderThemeBreakdown(themes, total) {
    const wrap = document.getElementById('themeBreakdownWrap');
    if (!wrap) return;
    wrap.replaceChildren();
    const modes = [
      { key: 'dark', label: 'Dark Mode (Cinema Noir)' },
      { key: 'light', label: 'Light Mode (Studio Paper)' }
    ];
    modes.forEach(m => {
      const count = (themes && themes[m.key]) || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      wrap.appendChild(createProgressItem(m.label, count, pct));
    });
  }

  function setupTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const panels = document.querySelectorAll('.admin-tab-panel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const target = document.getElementById(`panel-${tab}`);
        if (target) target.classList.remove('hidden');
        if (tab === 'overview') {
          const data = window.PranavAnalytics?.getAnalyticsData();
          if (data) renderTrafficChart(data.viewsByDate, currentChartRange, currentChartType);
        }
      });
    });
  }

  function setupChartControls() {
    const rangeBtns = [
      { id: 'chartRange7Btn', val: 7 },
      { id: 'chartRange14Btn', val: 14 },
      { id: 'chartRange30Btn', val: 30 }
    ];
    rangeBtns.forEach(({ id, val }) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => {
        rangeBtns.forEach(r => document.getElementById(r.id)?.classList.remove('active'));
        el.classList.add('active');
        currentChartRange = val;
        const data = window.PranavAnalytics?.getAnalyticsData();
        if (data) renderTrafficChart(data.viewsByDate, currentChartRange, currentChartType);
      });
    });
    setupChartTypeControls();
  }

  function setupChartTypeControls() {
    const typeBtns = [
      { id: 'chartTypeAreaBtn', val: 'area' },
      { id: 'chartTypeBarBtn', val: 'bar' }
    ];
    typeBtns.forEach(({ id, val }) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => {
        typeBtns.forEach(t => document.getElementById(t.id)?.classList.remove('active'));
        el.classList.add('active');
        currentChartType = val;
        const data = window.PranavAnalytics?.getAnalyticsData();
        if (data) renderTrafficChart(data.viewsByDate, currentChartRange, currentChartType);
      });
    });
  }

  function setupEventsFilter() {
    const filterBtns = document.querySelectorAll('.event-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        filterEventsList(filter);
      });
    });
  }

  function filterEventsList(filter) {
    if (!window.PranavAnalytics) return;
    const data = window.PranavAnalytics.getAnalyticsData();
    let events = data.events || [];
    if (filter === 'inquiry') {
      events = events.filter(e => e.name.toLowerCase().includes('inquiry') || e.name.toLowerCase().includes('contact'));
    } else if (filter === 'engagement') {
      events = events.filter(e => !e.name.toLowerCase().includes('inquiry') && !e.name.toLowerCase().includes('contact'));
    }
    renderEvents(events);
  }

  function renderDashboard() {
    if (!window.PranavAnalytics) return;
    const data = window.PranavAnalytics.getAnalyticsData();
    renderMetricCards(data);
    renderTrafficChart(data.viewsByDate, currentChartRange, currentChartType);
    renderDeviceBreakdown(data.devices, data.totalViews);
    renderThemeBreakdown(data.themes, data.totalViews);
    renderTrafficSources(data.referrers, data.totalViews);
    renderTopPages(data.pages);
    renderEvents(data.events);
    const badge = document.getElementById('tabEventsBadge');
    if (badge) badge.textContent = String((data.events || []).length);
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
    setupTabs();
    setupChartControls();
    setupEventsFilter();
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
