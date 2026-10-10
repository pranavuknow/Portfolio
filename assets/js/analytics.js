/**
 * Pranav Shukla — Privacy-First Client-Side Analytics Vault
 * Zero cookies · Zero third-party trackers · GDPR & DPDP Compliant
 */
'use strict';

const PranavAnalytics = (() => {
  const STORAGE_KEY = 'pranav_vault_analytics';
  const SESSION_KEY = 'pranav_vault_session_active';

  function getDefaultData() {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      inquiriesCount: 0,
      viewsByDate: {},
      pages: {},
      referrers: {},
      devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
      themes: { dark: 0, light: 0 },
      events: [],
      firstTracked: new Date().toISOString(),
      lastTracked: new Date().toISOString()
    };
  }

  function getStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      const parsed = JSON.parse(raw);
      return Object.assign(getDefaultData(), parsed);
    } catch {
      return getDefaultData();
    }
  }

  function saveData(data) {
    try {
      data.lastTracked = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  function detectReferrer() {
    const ref = document.referrer;
    if (!ref) return 'Direct';
    try {
      const url = new URL(ref);
      if (url.origin === window.location.origin) return 'Internal';
      const host = url.hostname.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
      if (host.includes('instagram.com')) return 'Instagram';
      if (host.includes('linkedin.com')) return 'LinkedIn';
      if (host.includes('google.')) return 'Search (Google)';
      if (host.includes('bing.') || host.includes('duckduckgo.')) return 'Search';
      if (host.includes('twitter.com') || host.includes('x.com') || host.includes('t.co')) return 'X / Twitter';
      return host;
    } catch {
      return 'Other External';
    }
  }

  function detectDevice() {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return 'Mobile';
    const width = window.innerWidth || document.documentElement.clientWidth || 1024;
    if (width < 640) return 'Mobile';
    if (width <= 1024) return 'Tablet';
    return 'Desktop';
  }

  function recordPageView() {
    const data = getStoredData();
    data.totalViews = (data.totalViews || 0) + 1;
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, 'active');
        data.uniqueVisitors = (data.uniqueVisitors || 0) + 1;
      }
    } catch {
      // Session storage unavailable
    }
    const today = new Date().toISOString().slice(0, 10);
    data.viewsByDate[today] = (data.viewsByDate[today] || 0) + 1;
    const page = window.location.pathname || '/';
    data.pages[page] = (data.pages[page] || 0) + 1;
    const referrer = detectReferrer();
    data.referrers[referrer] = (data.referrers[referrer] || 0) + 1;
    const device = detectDevice();
    data.devices[device] = (data.devices[device] || 0) + 1;
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    data.themes[theme] = (data.themes[theme] || 0) + 1;
    saveData(data);
  }

  function recordEvent(name, meta = {}) {
    if (!name || typeof name !== 'string') return;
    const data = getStoredData();
    const eventObj = {
      id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.slice(0, 50),
      meta: typeof meta === 'object' && meta !== null ? meta : {},
      timestamp: new Date().toISOString()
    };
    if (name.toLowerCase().includes('inquiry') || name.toLowerCase().includes('contact')) {
      data.inquiriesCount = (data.inquiriesCount || 0) + 1;
    }
    if (!Array.isArray(data.events)) data.events = [];
    data.events.push(eventObj);
    if (data.events.length > 200) data.events = data.events.slice(-200);
    saveData(data);
    return eventObj;
  }

  function generateCSV(data) {
    const rows = [
      ['Metric', 'Value'],
      ['Total Page Views', data.totalViews],
      ['Unique Visitors', data.uniqueVisitors],
      ['Inquiries Generated', data.inquiriesCount],
      ['First Tracked', data.firstTracked],
      ['Last Tracked', data.lastTracked],
      [],
      ['Traffic Sources', 'Visits'],
      ...Object.entries(data.referrers || {}).map(([k, v]) => [k, v]),
      [],
      ['Pages', 'Views'],
      ...Object.entries(data.pages || {}).map(([k, v]) => [k, v]),
      [],
      ['Devices', 'Count'],
      ...Object.entries(data.devices || {}).map(([k, v]) => [k, v]),
      [],
      ['Recent Events', 'Timestamp', 'Meta'],
      ...(data.events || []).map(e => [e.name, e.timestamp, JSON.stringify(e.meta)])
    ];
    return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  function triggerDownload(content, filename, mimeType) {
    if (typeof document === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportReport(format = 'json') {
    const data = getStoredData();
    const dateStr = new Date().toISOString().slice(0, 10);
    if (format.toLowerCase() === 'csv') {
      const csv = generateCSV(data);
      triggerDownload(csv, `pranav-analytics-${dateStr}.csv`, 'text/csv;charset=utf-8;');
      return csv;
    }
    const json = JSON.stringify(data, null, 2);
    triggerDownload(json, `pranav-analytics-${dateStr}.json`, 'application/json');
    return json;
  }

  function clearAnalytics() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      saveData(getDefaultData());
    } catch {
      // Storage unavailable
    }
  }

  function getEvents() {
    return getStoredData().events || [];
  }

  function init() {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', recordPageView, { once: true });
    } else {
      recordPageView();
    }
  }

  init();

  return {
    recordEvent,
    exportReport,
    getAnalyticsData: getStoredData,
    getEvents,
    clearAnalytics
  };
})();

if (typeof window !== 'undefined') {
  window.PranavAnalytics = PranavAnalytics;
  window.AnalyticsTracker = PranavAnalytics;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PranavAnalytics;
}
