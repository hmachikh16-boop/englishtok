'use strict';

const API_ENDPOINT = '/api/admin';
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 10;
const STATE = {
  db: null,
  session: null,
  view: 'overview',
  licenseQuery: '',
  statusFilter: 'all',
  sort: 'newest',
  page: 1,
  userQuery: '',
  checkCode: '',
  lastUpdated: null,
  pendingImport: null,
  lastFocused: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const icon = (name) => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
const html = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return character;
    }
  });

const numberFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const shortWeekdays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '—';
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
};

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

const formatRelative = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'الآن';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} يومًا`;
  return formatDate(date);
};

const normalizeCode = (value) =>
  String(value || '').trim().toUpperCase().replace(/\s+/g, '');

const baseStatus = (record) => {
  if (!record || record.revoked) return 'revoked';
  const expiry = parseDate(record.expiresAtUtc);
  if (expiry && expiry.getTime() <= Date.now()) return 'expired';
  if (record.activatedAtUtc) return 'active';
  return 'valid';
};

const isExpiringSoon = (record) => {
  if (!record || record.revoked) return false;
  const expiry = parseDate(record.expiresAtUtc);
  if (!expiry) return false;
  const remaining = expiry.getTime() - Date.now();
  return remaining > 0 && remaining <= 7 * DAY_MS;
};

const visualStatus = (record) => {
  const status = baseStatus(record);
  if (status === 'active' && isExpiringSoon(record)) return 'expiring';
  return status;
};

const STATUS_LABELS = {
  valid: 'صالح',
  active: 'مفعّل',
  expiring: 'تنتهي قريبًا',
  expired: 'منتهي',
  revoked: 'ملغى',
};

const statusLabel = (record) => STATUS_LABELS[visualStatus(record)] || 'غير معروف';

const statusPill = (record) => {
  const status = visualStatus(record);
  return `<span class="status-pill ${status}">${STATUS_LABELS[status]}</span>`;
};

const userLabel = (record) =>
  String(record?.userEmail || record?.userName || '').trim();

const secondaryUserLabel = (record) => {
  const label = userLabel(record);
  if (!label) return '';
  if (record.userEmail && record.userName) return record.userName;
  return record.userEmail ? '' : record.userEmail;
};

const initials = (record) => {
  const source = userLabel(record) || record?.code || 'LG';
  const words = source
    .replace(/@.*$/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  return (words.slice(0, 2).map((word) => word[0]).join('') || 'LG').toUpperCase();
};

const truncate = (value, length = 22) => {
  const text = String(value || '').trim();
  if (!text) return '—';
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};

const remainingDays = (record) => {
  if (!record?.expiresAtUtc) return null;
  const expiry = parseDate(record.expiresAtUtc);
  if (!expiry) return null;
  return Math.ceil((expiry.getTime() - Date.now()) / DAY_MS);
};

const expiryLabel = (record) => {
  if (!record) return '—';
  if (record.revoked) return 'ملغى';
  if (!record.activatedAtUtc) return 'بانتظار التفعيل';
  if (!record.expiresAtUtc) return 'مدى الحياة';
  const days = remainingDays(record);
  if (days === null) return '—';
  if (days <= 0) return 'منتهي';
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
};

const metrics = (database = STATE.db) => {
  const records = Array.isArray(database?.licenses) ? database.licenses : [];
  const result = {
    total: records.length,
    valid: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    revoked: 0,
    users: 0,
  };
  const users = new Set();
  for (const record of records) {
    const base = baseStatus(record);
    result[base] += 1;
    if (isExpiringSoon(record)) result.expiring += 1;
    const label = userLabel(record);
    if (base === 'active' && label) users.add(label.toLowerCase());
  }
  result.users = users.size;
  return result;
};

const allRecords = () => (Array.isArray(STATE.db?.licenses) ? STATE.db.licenses : []);
const allActivity = () => (Array.isArray(STATE.db?.activity) ? STATE.db.activity : []);
const findRecord = (id) => allRecords().find((record) => record.id === id);

const api = async (action, options = {}) => {
  const method = options.method || 'GET';
  const response = await fetch(`${API_ENDPOINT}?action=${encodeURIComponent(action)}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(payload?.error || `تعذر تنفيذ الطلب (${response.status}).`, response.status);
  }
  return payload || {};
};

const showLoading = (visible) => {
  const loader = $('#loadingScreen');
  if (loader) loader.hidden = !visible;
};

const setFooterStatus = (value) => {
  const element = $('#footerStatus');
  if (element) element.textContent = value;
};

const toast = (message, type = 'success') => {
  const region = $('#toastRegion');
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast${type === 'error' ? ' is-error' : ''}`;
  item.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${html(message)}</span>`;
  region.appendChild(item);
  window.setTimeout(() => {
    item.classList.add('is-leaving');
    window.setTimeout(() => item.remove(), 220);
  }, type === 'error' ? 6200 : 3600);
};

const reportError = (error, fallback = 'تعذر تنفيذ العملية.') => {
  if (error instanceof ApiError && error.status === 401) {
    closeModal();
    showLogin('انتهت الجلسة. سجّل الدخول من جديد.');
    return;
  }
  toast(error instanceof Error ? error.message : fallback, 'error');
};

const setBusy = (button, busy, label) => {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.innerHTML;
    button.classList.add('is-loading');
    button.disabled = true;
    if (label) {
      const span = button.querySelector('.button-label');
      if (span) span.textContent = label;
    }
  } else {
    button.classList.remove('is-loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
};

const showLogin = (message = '') => {
  STATE.db = null;
  STATE.checkCode = '';
  $('#appView').hidden = true;
  $('#loginView').hidden = false;
  const error = $('#loginError');
  if (error) {
    error.hidden = !message;
    error.textContent = message;
  }
  window.setTimeout(() => $('#adminKey')?.focus(), 60);
};

const showApp = () => {
  $('#loginView').hidden = true;
  $('#appView').hidden = false;
};

const syncSessionUi = (session) => {
  STATE.session = session;
  const configured = Boolean(session?.configured && session?.storage);
  const loginButton = $('#loginButton');
  const hint = $('#loginHint');
  if (loginButton) loginButton.disabled = !configured;
  if (hint && !configured) {
    hint.textContent = 'الخدمة السحابية غير مهيأة على الخادم. أضف مفتاح الإدارة والتخزين أولًا.';
    hint.style.color = 'var(--orange)';
  }
};

const loadData = async ({ silent = false } = {}) => {
  const payload = await api('db');
  STATE.db = payload.database || { licenses: [], activity: [], updatedAtUtc: null };
  STATE.lastUpdated = payload.serverTime || STATE.db.updatedAtUtc || new Date().toISOString();
  renderAll();
  setFooterStatus('متزامن');
  if (!silent) setFooterStatus('تم التحديث');
  return payload;
};

const enterApp = async () => {
  showApp();
  showLoading(true);
  try {
    await loadData({ silent: true });
  } catch (error) {
    reportError(error, 'تعذر تحميل قاعدة البيانات.');
    setFooterStatus('تعذر الاتصال');
  } finally {
    showLoading(false);
  }
};

const refreshData = async (button) => {
  if (button) button.classList.add('is-spinning');
  try {
    await loadData({ silent: true });
    toast('تم تحديث البيانات من السحابة.');
  } catch (error) {
    reportError(error, 'تعذر تحديث البيانات.');
  } finally {
    if (button) button.classList.remove('is-spinning');
  }
};

const viewMeta = {
  overview: { title: 'نظرة عامة', subtitle: 'ملخص مباشر لأكواد Gold ومستخدميها.' },
  licenses: { title: 'الأكواد', subtitle: 'ابحث، فلتر، وفعّل الأكواد من مكان واحد.' },
  users: { title: 'المستخدمون', subtitle: 'الأشخاص المرتبطون بأكواد Gold النشطة.' },
  check: { title: 'فحص كود', subtitle: 'تحقق من صلاحية أي كود ومعلومات المستخدم.' },
  activity: { title: 'السجل', subtitle: 'كل عملية إدارة تمت على أكواد Gold.' },
  settings: { title: 'البيانات والإعدادات', subtitle: 'نسخ احتياطي، استيراد، ومعلومات مساحة العمل.' },
};

const switchView = (view) => {
  if (!viewMeta[view]) return;
  STATE.view = view;
  $$('.view').forEach((section) => {
    section.hidden = section.dataset.viewPanel !== view;
    section.classList.toggle('is-active', section.dataset.viewPanel === view);
  });
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  const meta = viewMeta[view];
  $('#viewTitle').textContent = meta.title;
  $('#viewSubtitle').textContent = meta.subtitle;
  $('#breadcrumbCurrent').textContent = meta.title;
  closeSidebar();
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const closeSidebar = () => {
  $('#sidebar')?.classList.remove('is-open');
  const backdrop = $('#sidebarBackdrop');
  if (backdrop) backdrop.hidden = true;
};

const openSidebar = () => {
  $('#sidebar')?.classList.add('is-open');
  const backdrop = $('#sidebarBackdrop');
  if (backdrop) backdrop.hidden = false;
};

const renderMeta = () => {
  const count = metrics().total;
  const navCount = $('#navLicenseCount');
  if (navCount) navCount.textContent = formatNumber(count);
  const lastUpdated = $('#lastUpdated');
  if (lastUpdated) {
    lastUpdated.textContent = formatRelative(STATE.lastUpdated);
    lastUpdated.title = formatDateTime(STATE.lastUpdated);
  }
};

const renderStats = () => {
  const target = $('#statGrid');
  if (!target || !STATE.db) return;
  const count = metrics();
  const records = allRecords();
  const latest = records
    .map((record) => parseDate(record.createdAtUtc))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const cards = [
    {
      label: 'إجمالي الأكواد',
      value: count.total,
      sub: latest ? `آخر إصدار ${formatRelative(latest)}` : 'لم تُنشأ أكواد بعد',
      tone: 'var(--gold)',
      icon: 'key',
      badge: 'ALL',
    },
    {
      label: 'صالحة للتفعيل',
      value: count.valid,
      sub: count.valid ? 'جاهزة للتفعيل الآن' : 'لا توجد أكواد معلّقة',
      tone: 'var(--green)',
      icon: 'check',
      badge: 'READY',
    },
    {
      label: 'مفعّلة الآن',
      value: count.active,
      sub: count.active ? 'مرتبطة بمستخدم وجهاز' : 'بانتظار أول تفعيل',
      tone: 'var(--blue)',
      icon: 'users',
      badge: 'ACTIVE',
    },
    {
      label: 'تنتهي خلال 7 أيام',
      value: count.expiring,
      sub: count.expiring ? 'تحتاج متابعة قريبة' : 'لا توجد تنبيهات',
      tone: 'var(--orange)',
      icon: 'clock',
      badge: '7 DAYS',
    },
    {
      label: 'منتهية أو ملغاة',
      value: count.expired + count.revoked,
      sub: `${formatNumber(count.expired)} منتهي · ${formatNumber(count.revoked)} ملغى`,
      tone: 'var(--red)',
      icon: 'alert',
      badge: 'CHECK',
    },
    {
      label: 'مستخدمون نشطون',
      value: count.users,
      sub: count.users ? 'حسب البريد أو الاسم' : 'سيظهرون بعد التفعيل',
      tone: 'var(--purple)',
      icon: 'spark',
      badge: 'UNIQUE',
    },
  ];
  target.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card" style="--stat-tone:${card.tone}">
          <div class="stat-top">
            <span class="stat-icon">${icon(card.icon)}</span>
            <span class="stat-trend">${card.badge}</span>
          </div>
          <div class="stat-label">${card.label}</div>
          <div class="stat-value">${formatNumber(card.value)}</div>
          <div class="stat-sub">${html(card.sub)}</div>
        </article>`,
    )
    .join('');
};

const renderCharts = () => {
  renderActivityChart();
  renderDonut();
};

const renderActivityChart = () => {
  const target = $('#activityChart');
  if (!target || !STATE.db) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    buckets.push({ day, count: 0 });
  }
  for (const record of allRecords()) {
    const activated = parseDate(record.activatedAtUtc);
    if (!activated) continue;
    const dayKey = new Date(activated);
    dayKey.setHours(0, 0, 0, 0);
    const bucket = buckets.find((item) => item.day.getTime() === dayKey.getTime());
    if (bucket) bucket.count += 1;
  }
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const totalElement = $('#activityChartTotal');
  if (totalElement) totalElement.textContent = `${formatNumber(total)} تفعيل`;
  target.innerHTML = buckets
    .map((bucket) => {
      const height = bucket.count ? Math.max(8, Math.round((bucket.count / max) * 100)) : 0;
      const label = shortWeekdays[bucket.day.getDay()];
      const fullDate = formatDate(bucket.day);
      return `
        <div class="bar-column" title="${fullDate}: ${formatNumber(bucket.count)} تفعيل">
          <div class="bar-track">
            <div class="bar-fill${bucket.count ? '' : ' is-zero'}" style="height:${height}%">
              <span>${bucket.count ? formatNumber(bucket.count) : ''}</span>
            </div>
          </div>
          <span class="bar-label">${label}</span>
        </div>`;
    })
    .join('');
};

const renderDonut = () => {
  const donut = $('#statusDonut');
  const legend = $('#statusLegend');
  if (!donut || !legend || !STATE.db) return;
  const count = metrics();
  const total = count.total;
  const segments = [
    { label: 'صالحة', value: count.valid, tone: 'var(--gold)' },
    { label: 'مفعّلة', value: count.active, tone: 'var(--blue)' },
    { label: 'منتهية', value: count.expired, tone: 'var(--orange)' },
    { label: 'ملغاة', value: count.revoked, tone: 'var(--red)' },
  ];
  if (total === 0) {
    donut.style.background = 'rgba(255,255,255,0.06)';
  } else {
    let cursor = 0;
    const stops = [];
    for (const segment of segments) {
      if (segment.value <= 0) continue;
      const end = cursor + (segment.value / total) * 360;
      stops.push(`${segment.tone} ${cursor}deg ${end}deg`);
      cursor = end;
    }
    if (cursor < 360) {
      const lastTone = segments.filter((segment) => segment.value > 0).at(-1)?.tone || 'var(--gold)';
      stops.push(`${lastTone} ${cursor}deg 360deg`);
    }
    donut.style.background = `conic-gradient(${stops.join(', ')})`;
  }
  const totalElement = $('#donutTotal');
  if (totalElement) totalElement.textContent = formatNumber(total);
  legend.innerHTML = segments
    .map(
      (segment) => `
        <div class="legend-item">
          <span class="legend-dot" style="--legend-tone:${segment.tone}"></span>
          <span>${segment.label}</span>
          <strong>${formatNumber(segment.value)}</strong>
        </div>`,
    )
    .join('');
};

const renderRecentTable = () => {
  const body = $('#recentTableBody');
  if (!body || !STATE.db) return;
  const records = allRecords()
    .slice()
    .sort((left, right) => (parseDate(right.createdAtUtc)?.getTime() || 0) - (parseDate(left.createdAtUtc)?.getTime() || 0))
    .slice(0, 5);
  if (records.length === 0) {
    body.innerHTML = '<tr><td colspan="4"><div class="mini-empty">لا توجد أكواد بعد. ابدأ بإنشاء أول دفعة.</div></td></tr>';
    return;
  }
  body.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td>
            <div class="code-cell">
              <span class="code-text">${html(record.code)}</span>
              <button class="copy-code" type="button" data-action="copy" data-copy="${html(record.code)}" aria-label="نسخ الكود" title="نسخ">${icon('copy')}</button>
            </div>
          </td>
          <td>${statusPill(record)}</td>
          <td>
            <div class="user-cell">
              <strong>${html(userLabel(record) || 'غير معيّن')}</strong>
              <span>${html(secondaryUserLabel(record) || truncate(record.deviceId, 18))}</span>
            </div>
          </td>
          <td><span class="muted-cell">${html(expiryLabel(record))}</span></td>
        </tr>`,
    )
    .join('');
};

const eventMeta = (type) => {
  switch (type) {
    case 'generate':
      return { icon: 'plus', tone: 'var(--gold)' };
    case 'activate':
      return { icon: 'check', tone: 'var(--blue)' };
    case 'extend':
      return { icon: 'calendar', tone: 'var(--purple)' };
    case 'revoke':
      return { icon: 'lock', tone: 'var(--red)' };
    case 'restore':
      return { icon: 'refresh', tone: 'var(--green)' };
    case 'delete':
      return { icon: 'trash', tone: 'var(--red)' };
    case 'import':
      return { icon: 'upload', tone: 'var(--green)' };
    case 'update':
      return { icon: 'edit', tone: 'var(--muted)' };
    default:
      return { icon: 'activity', tone: 'var(--gold)' };
  }
};

const activityItem = (event) => {
  const meta = eventMeta(event.type);
  return `
    <div class="activity-item">
      <span class="activity-bullet" style="--event-tone:${meta.tone}">${icon(meta.icon)}</span>
      <div class="activity-copy">
        <strong>${html(event.message)}</strong>
        <span>${event.code ? `${html(event.code)} · ` : ''}${formatRelative(event.at)}</span>
      </div>
    </div>`;
};

const renderActivityFeed = () => {
  const target = $('#activityFeed');
  if (!target || !STATE.db) return;
  const events = allActivity().slice(0, 6);
  target.innerHTML = events.length
    ? events.map(activityItem).join('')
    : '<div class="mini-empty">لا توجد نشاطات بعد. ستظهر هنا كل عملية إدارة.</div>';
};

const filteredRecords = () => {
  const query = STATE.licenseQuery.trim().toLowerCase();
  let records = allRecords().filter((record) => {
    if (!query) return true;
    return [record.code, record.userName, record.userEmail, record.deviceId, record.notes]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  records = records.filter((record) => {
    if (STATE.statusFilter === 'all') return true;
    if (STATE.statusFilter === 'expiring') return isExpiringSoon(record);
    return baseStatus(record) === STATE.statusFilter;
  });
  records = records.slice().sort((left, right) => {
    if (STATE.sort === 'code') return String(left.code).localeCompare(String(right.code));
    if (STATE.sort === 'oldest') {
      return (parseDate(left.createdAtUtc)?.getTime() || 0) - (parseDate(right.createdAtUtc)?.getTime() || 0);
    }
    if (STATE.sort === 'expiry') {
      const leftExpiry = parseDate(left.expiresAtUtc)?.getTime() || Number.MAX_SAFE_INTEGER;
      const rightExpiry = parseDate(right.expiresAtUtc)?.getTime() || Number.MAX_SAFE_INTEGER;
      return leftExpiry - rightExpiry;
    }
    return (parseDate(right.createdAtUtc)?.getTime() || 0) - (parseDate(left.createdAtUtc)?.getTime() || 0);
  });
  return records;
};

const rowActions = (record) => {
  const base = baseStatus(record);
  const items = [
    `<button class="row-action" type="button" data-record-action="details" data-record-id="${html(record.id)}" aria-label="تفاصيل الكود" title="تفاصيل">${icon('edit')}</button>`,
  ];
  if (base === 'valid') {
    items.push(`<button class="row-action" type="button" data-record-action="activate" data-record-id="${html(record.id)}" aria-label="تفعيل الكود" title="تفعيل">${icon('check')}</button>`);
  } else if (base === 'active') {
    items.push(`<button class="row-action" type="button" data-record-action="extend" data-record-id="${html(record.id)}" aria-label="تمديد الكود" title="تمديد">${icon('calendar')}</button>`);
  }
  if (record.revoked) {
    items.push(`<button class="row-action" type="button" data-record-action="restore" data-record-id="${html(record.id)}" aria-label="استعادة الكود" title="استعادة">${icon('refresh')}</button>`);
  } else {
    items.push(`<button class="row-action is-danger" type="button" data-record-action="revoke" data-record-id="${html(record.id)}" aria-label="إلغاء الكود" title="إلغاء">${icon('lock')}</button>`);
  }
  items.push(`<button class="row-action is-danger" type="button" data-record-action="delete" data-record-id="${html(record.id)}" aria-label="حذف الكود" title="حذف">${icon('trash')}</button>`);
  return `<div class="row-actions">${items.join('')}</div>`;
};

const renderPagination = (totalItems, pageCount) => {
  const target = $('#pagination');
  if (!target) return;
  if (pageCount <= 1) {
    target.innerHTML = '';
    return;
  }
  const pages = new Set([1, pageCount, STATE.page - 1, STATE.page, STATE.page + 1]);
  const ordered = Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);
  const parts = [
    `<button class="page-button" type="button" data-page="${STATE.page - 1}" ${STATE.page <= 1 ? 'disabled' : ''} aria-label="السابق">${icon('chevron')}</button>`,
  ];
  let previous = 0;
  for (const page of ordered) {
    if (page - previous > 1) parts.push('<span class="page-ellipsis">…</span>');
    parts.push(`<button class="page-button${page === STATE.page ? ' is-active' : ''}" type="button" data-page="${page}" ${page === STATE.page ? 'aria-current="page"' : ''}>${formatNumber(page)}</button>`);
    previous = page;
  }
  parts.push(`<button class="page-button" type="button" data-page="${STATE.page + 1}" ${STATE.page >= pageCount ? 'disabled' : ''} aria-label="التالي">${icon('chevron')}</button>`);
  target.innerHTML = parts.join('');
  void totalItems;
};

const renderLicenses = () => {
  if (!STATE.db) return;
  const records = filteredRecords();
  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  if (STATE.page > pageCount) STATE.page = pageCount;
  if (STATE.page < 1) STATE.page = 1;
  const pageRecords = records.slice((STATE.page - 1) * PAGE_SIZE, STATE.page * PAGE_SIZE);
  const body = $('#licenseTableBody');
  const empty = $('#licensesEmpty');
  const wrap = $('#view-licenses .table-wrap');
  if (body) {
    body.innerHTML = pageRecords
      .map(
        (record) => `
          <tr>
            <td>
              <div class="code-cell">
                <span class="code-text">${html(record.code)}</span>
                <button class="copy-code" type="button" data-action="copy" data-copy="${html(record.code)}" aria-label="نسخ الكود" title="نسخ">${icon('copy')}</button>
              </div>
            </td>
            <td>${statusPill(record)}</td>
            <td>
              <div class="user-cell">
                <strong>${html(userLabel(record) || 'غير معيّن')}</strong>
                <span>${html(secondaryUserLabel(record) || 'بانتظار التعيين')}</span>
              </div>
            </td>
            <td><span class="muted-cell" title="${html(record.deviceId || '')}">${html(truncate(record.deviceId, 20))}</span></td>
            <td>
              <div class="expiry-cell${isExpiringSoon(record) ? ' is-warning' : ''}">
                <strong>${html(formatDate(record.expiresAtUtc))}</strong>
                <span>${html(expiryLabel(record))}</span>
              </div>
            </td>
            <td><span class="muted-cell">${html(formatDate(record.createdAtUtc))}</span></td>
            <td>${rowActions(record)}</td>
          </tr>`,
      )
      .join('');
  }
  if (empty) empty.hidden = records.length !== 0;
  if (wrap) wrap.hidden = records.length === 0;
  const count = $('#licenseCount');
  if (count) {
    count.textContent = records.length
      ? `عرض ${formatNumber((STATE.page - 1) * PAGE_SIZE + 1)}–${formatNumber(Math.min(STATE.page * PAGE_SIZE, records.length))} من ${formatNumber(records.length)} كود`
      : '0 كود';
  }
  const subtitle = $('#licensesSubtitle');
  if (subtitle) subtitle.textContent = `${formatNumber(metrics().total)} كود في مساحة العمل · ${formatNumber(metrics().active)} مفعّل.`;
  renderPagination(records.length, pageCount);
};

const renderUsers = () => {
  if (!STATE.db) return;
  const target = $('#usersGrid');
  const empty = $('#usersEmpty');
  if (!target) return;
  const query = STATE.userQuery.trim().toLowerCase();
  const records = allRecords()
    .filter((record) => baseStatus(record) === 'active')
    .filter((record) => {
      if (!query) return true;
      return [record.code, record.userName, record.userEmail, record.deviceId]
        .some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((left, right) => {
      const leftDate = parseDate(left.lastSeenAtUtc || left.activatedAtUtc || left.createdAtUtc)?.getTime() || 0;
      const rightDate = parseDate(right.lastSeenAtUtc || right.activatedAtUtc || right.createdAtUtc)?.getTime() || 0;
      return rightDate - leftDate;
    });
  if (empty) empty.hidden = records.length !== 0;
  target.hidden = records.length === 0;
  const count = $('#userCount');
  if (count) count.textContent = `${formatNumber(records.length)} مستخدم`;
  target.innerHTML = records
    .map(
      (record) => `
        <article class="user-card">
          <div class="user-card-head">
            <span class="user-avatar">${html(initials(record))}</span>
            <div>
              <strong>${html(userLabel(record) || 'مستخدم غير مسمى')}</strong>
              <span>${html(secondaryUserLabel(record) || truncate(record.deviceId, 24) || 'بانتظار بيانات الجهاز')}</span>
            </div>
            ${statusPill(record)}
          </div>
          <div class="user-meta">
            <div class="user-meta-row"><span>${icon('calendar')} ينتهي</span><strong>${html(formatDate(record.expiresAtUtc))} · ${html(expiryLabel(record))}</strong></div>
            <div class="user-meta-row"><span>${icon('clock')} آخر ظهور</span><strong>${html(formatRelative(record.lastSeenAtUtc || record.activatedAtUtc))}</strong></div>
            <div class="user-meta-row"><span>${icon('users')} الجهاز</span><strong title="${html(record.deviceId || '')}">${html(truncate(record.deviceId, 18) || 'غير مسجّل')}</strong></div>
          </div>
          <div class="user-code">
            <span class="code-text">${html(record.code)}</span>
            <button class="copy-code" type="button" data-action="copy" data-copy="${html(record.code)}" aria-label="نسخ الكود" title="نسخ">${icon('copy')}</button>
          </div>
          <button class="text-button user-manage" type="button" data-record-action="details" data-record-id="${html(record.id)}">إدارة الكود ${icon('chevron')}</button>
        </article>`,
    )
    .join('');
};

const resultEmpty = (message, hint) => `
  <div class="result-empty">
    ${icon('search')}
    <strong>${html(message)}</strong>
    <span>${html(hint)}</span>
  </div>`;

const renderCheck = () => {
  const target = $('#checkResult');
  if (!target) return;
  const code = normalizeCode(STATE.checkCode);
  if (!code) {
    target.hidden = false;
    target.innerHTML = resultEmpty('لم يتم فحص أي كود بعد', 'أدخل كود Gold في الحقل المجاور، وستظهر حالته ومعلومات المستخدم هنا.');
    return;
  }
  target.hidden = false;
  const record = allRecords().find((item) => normalizeCode(item.code) === code);
  if (!record) {
    target.innerHTML = `
      <div class="result-card" style="--result-tone:var(--red)">
        <div class="result-head">
          <span class="result-icon">${icon('alert')}</span>
          <div><strong>الكود غير موجود</strong><span>لا يوجد كود مطابق في مساحة العمل</span></div>
        </div>
        <div class="result-code">
          <div class="result-code-label"><span>الكود المفحوص</span></div>
          <div class="result-code-value"><span class="code-text">${html(code)}</span></div>
        </div>
        <p class="form-note">تأكد من نسخ الكود كاملًا، أو ابحث عنه في صفحة الأكواد.</p>
      </div>`;
    return;
  }
  const base = baseStatus(record);
  const tone = base === 'active' ? 'var(--blue)' : base === 'valid' ? 'var(--green)' : base === 'expired' ? 'var(--orange)' : 'var(--red)';
  const actions = [
    `<button class="button button-secondary button-small" type="button" data-record-action="details" data-record-id="${html(record.id)}">${icon('edit')} تفاصيل</button>`,
  ];
  if (base === 'valid') {
    actions.push(`<button class="button button-gold button-small" type="button" data-record-action="activate" data-record-id="${html(record.id)}">${icon('check')} تفعيل</button>`);
  }
  if (base === 'active') {
    actions.push(`<button class="button button-gold button-small" type="button" data-record-action="extend" data-record-id="${html(record.id)}">${icon('calendar')} تمديد</button>`);
  }
  if (record.revoked) {
    actions.push(`<button class="button button-secondary button-small" type="button" data-record-action="restore" data-record-id="${html(record.id)}">${icon('refresh')} استعادة</button>`);
  }
  target.innerHTML = `
    <div class="result-card" style="--result-tone:${tone}">
      <div class="result-head">
        <span class="result-icon">${icon(base === 'valid' ? 'check' : base === 'active' ? 'shield' : 'alert')}</span>
        <div><strong>${html(statusLabel(record))}</strong><span>${html(expiryLabel(record))}</span></div>
        ${statusPill(record)}
      </div>
      <div class="result-code">
        <div class="result-code-label"><span>الكود</span><button class="copy-code" type="button" data-action="copy" data-copy="${html(record.code)}" aria-label="نسخ الكود" title="نسخ">${icon('copy')}</button></div>
        <div class="result-code-value"><span class="code-text">${html(record.code)}</span></div>
      </div>
      <div class="result-details">
        <div class="result-detail"><span>المستخدم</span><strong>${html(userLabel(record) || 'غير معيّن')}</strong></div>
        <div class="result-detail"><span>البريد</span><strong>${html(record.userEmail || '—')}</strong></div>
        <div class="result-detail"><span>الجهاز</span><strong title="${html(record.deviceId || '')}">${html(truncate(record.deviceId, 20) || '—')}</strong></div>
        <div class="result-detail"><span>تاريخ الإنشاء</span><strong>${html(formatDate(record.createdAtUtc))}</strong></div>
        <div class="result-detail"><span>تاريخ التفعيل</span><strong>${html(formatDate(record.activatedAtUtc))}</strong></div>
        <div class="result-detail"><span>تاريخ الانتهاء</span><strong>${html(formatDate(record.expiresAtUtc))}</strong></div>
      </div>
      <div class="result-actions">${actions.join('')}</div>
    </div>`;
};

const renderActivityLog = () => {
  if (!STATE.db) return;
  const list = $('#activityList');
  const empty = $('#activityEmpty');
  if (!list) return;
  const events = allActivity();
  if (empty) empty.hidden = events.length !== 0;
  list.hidden = events.length === 0;
  list.innerHTML = events
    .map((event) => {
      const meta = eventMeta(event.type);
      return `
        <div class="activity-row">
          <span class="activity-bullet" style="--event-tone:${meta.tone}">${icon(meta.icon)}</span>
          <div class="activity-row-copy">
            <strong>${html(event.message)}</strong>
            ${event.code ? `<span class="activity-code">${html(event.code)}</span>` : ''}
            <span>${formatDateTime(event.at)}</span>
          </div>
          <time datetime="${html(event.at)}" title="${html(formatDateTime(event.at))}">${html(formatRelative(event.at))}</time>
        </div>`;
    })
    .join('');
};

const renderSettings = () => {
  if (!STATE.db) return;
  const count = metrics();
  const target = $('#dataSummary');
  if (!target) return;
  target.innerHTML = `
    <div><span>إجمالي الأكواد</span><strong>${formatNumber(count.total)}</strong></div>
    <div><span>مفعّلة</span><strong>${formatNumber(count.active)}</strong></div>
    <div><span>صالحة</span><strong>${formatNumber(count.valid)}</strong></div>
    <div><span>مستخدمون</span><strong>${formatNumber(count.users)}</strong></div>
    <div><span>آخر تحديث</span><strong>${html(formatRelative(STATE.lastUpdated))}</strong></div>
    <div><span>مساحة العمل</span><strong>Gold / Production</strong></div>`;
};

const renderAll = () => {
  if (!STATE.db) return;
  renderStats();
  renderCharts();
  renderRecentTable();
  renderActivityFeed();
  renderLicenses();
  renderUsers();
  renderCheck();
  renderActivityLog();
  renderSettings();
  renderMeta();
};

const copyText = async (text) => {
  const value = String(text || '');
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast('تم نسخ الكود إلى الحافظة.');
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      toast('تم نسخ الكود إلى الحافظة.');
    } catch {
      toast('تعذر النسخ. حدد الكود يدويًا.', 'error');
    } finally {
      area.remove();
    }
  }
};

const closeModal = () => {
  const root = $('#modalRoot');
  if (!root || !root.firstElementChild) return;
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
  if (STATE.lastFocused && typeof STATE.lastFocused.focus === 'function') {
    STATE.lastFocused.focus();
  }
  STATE.lastFocused = null;
};

const openModal = ({ kicker = 'CONTROL', title, subtitle = '', body, footer = '', wide = false }) => {
  const root = $('#modalRoot');
  if (!root) return null;
  STATE.lastFocused = document.activeElement;
  root.innerHTML = `
    <div class="modal-overlay" data-modal-overlay>
      <div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-head">
          <div>
            <span class="eyebrow">${html(kicker)}</span>
            <h2 id="modalTitle">${html(title)}</h2>
            ${subtitle ? `<p>${html(subtitle)}</p>` : ''}
          </div>
          <button class="icon-button modal-close" type="button" data-modal-close aria-label="إغلاق">${icon('close')}</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>
    </div>`;
  document.body.classList.add('modal-open');
  const overlay = root.querySelector('[data-modal-overlay]');
  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  window.requestAnimationFrame(() => {
    root.querySelector('input, select, textarea, button')?.focus();
  });
  return overlay?.querySelector('.modal') || null;
};

const openConfirm = ({ title, message, confirmLabel = 'تأكيد', danger = false, onConfirm }) => {
  const modal = openModal({
    title,
    kicker: 'CONFIRM',
    body: `<p class="confirm-message">${message}</p>`,
    footer: `<button class="button button-secondary" type="button" data-modal-close>إلغاء</button><button class="button ${danger ? 'button-danger' : 'button-gold'}" type="button" id="confirmAction">${html(confirmLabel)}</button>`,
  });
  const confirmButton = modal?.querySelector('#confirmAction');
  confirmButton?.addEventListener('click', async () => {
    setBusy(confirmButton, true);
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      reportError(error);
      setBusy(confirmButton, false);
    }
  });
};

const openGenerateModal = () => {
  const body = `
    <form id="generateForm" class="form-grid">
      <div class="form-field">
        <label for="generateCount">عدد الأكواد</label>
        <input id="generateCount" name="count" type="number" min="1" max="200" value="10" required />
      </div>
      <div class="form-field">
        <label for="generateDuration">مدة الصلاحية <span>(0 = مدى الحياة)</span></label>
        <input id="generateDuration" name="durationDays" type="number" min="0" max="3650" value="30" required />
      </div>
      <div class="form-field">
        <label for="generateDevices">حد الأجهزة</label>
        <input id="generateDevices" name="deviceLimit" type="number" min="1" max="50" value="1" required />
      </div>
      <div class="form-field">
        <label for="generatePlan">الخطة</label>
        <input id="generatePlan" name="plan" type="text" value="Gold" maxlength="40" required />
      </div>
      <div class="form-field is-wide">
        <label for="generateNotes">ملاحظة داخلية <span>(اختياري)</span></label>
        <textarea id="generateNotes" name="notes" maxlength="1000" placeholder="مثال: دفعة حملة أكتوبر…"></textarea>
      </div>
      <p class="form-note is-wide">سيتم إنشاء الأكواد بحالة <strong>صالحة</strong>، وتظل بانتظار التفعيل. يمكنك تصديرها فورًا بعد الإنشاء.</p>
    </form>`;
  const modal = openModal({
    kicker: 'CREATE BATCH',
    title: 'إنشاء أكواد Gold',
    subtitle: 'حدّد الكمية والمدة، وسنولّد أكوادًا فريدة.',
    wide: true,
    body,
    footer: `<button class="button button-secondary" type="button" data-modal-close>إلغاء</button><button class="button button-gold" type="submit" form="generateForm" id="generateSubmit">${icon('plus')} إنشاء الأكواد</button>`,
  });
  const form = modal?.querySelector('#generateForm');
  const submit = modal?.querySelector('#generateSubmit');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    setBusy(submit, true, 'جارٍ الإنشاء…');
    try {
      const payload = await api('generate', {
        method: 'POST',
        body: {
          count: Number(data.get('count')),
          durationDays: Number(data.get('durationDays')),
          deviceLimit: Number(data.get('deviceLimit')),
          plan: String(data.get('plan') || 'Gold'),
          notes: String(data.get('notes') || ''),
        },
      });
      STATE.db = payload.database;
      closeModal();
      renderAll();
      toast(`تم إنشاء ${formatNumber(payload.generatedCodes?.length || 0)} كودًا جديدًا.`);
      openGeneratedCodes(payload.generatedCodes || []);
    } catch (error) {
      reportError(error, 'تعذر إنشاء الأكواد.');
      setBusy(submit, false);
    }
  });
};

const openGeneratedCodes = (codes) => {
  const body = `
    <div class="modal-result-icon">${icon('check')}</div>
    <h3 class="modal-result-title">أكوادك جاهزة</h3>
    <p class="modal-result-copy">تم إنشاء ${formatNumber(codes.length)} كودًا. انسخها الآن أو نزّلها كملف CSV.</p>
    <div class="modal-code-list">${codes.map((code) => `<div class="modal-code-row"><span class="code-text">${html(code)}</span><button class="copy-code" type="button" data-action="copy" data-copy="${html(code)}" aria-label="نسخ الكود">${icon('copy')}</button></div>`).join('')}</div>`;
  const modal = openModal({
    kicker: 'BATCH READY',
    title: 'تم الإنشاء بنجاح',
    body,
    footer: `<button class="button button-secondary" type="button" id="downloadGenerated">${icon('download')} تنزيل CSV</button><button class="button button-gold" type="button" id="copyGenerated">${icon('copy')} نسخ الكل</button><button class="button button-secondary" type="button" data-modal-close>تم</button>`,
  });
  modal?.querySelector('#copyGenerated')?.addEventListener('click', () => copyText(codes.join('\n')));
  modal?.querySelector('#downloadGenerated')?.addEventListener('click', () => {
    const rows = [['code'], ...codes.map((code) => [code])];
    downloadCsv(rows, `lin-go-gold-${new Date().toISOString().slice(0, 10)}.csv`);
  });
};

const openDetails = (record) => {
  if (!record) return;
  const body = `
    <div class="detail-actions">
      ${baseStatus(record) === 'valid' ? `<button class="button button-gold button-small" type="button" data-record-action="activate" data-record-id="${html(record.id)}">${icon('check')} تفعيل</button>` : ''}
      ${baseStatus(record) === 'active' ? `<button class="button button-secondary button-small" type="button" data-record-action="extend" data-record-id="${html(record.id)}">${icon('calendar')} تمديد</button>` : ''}
      <button class="button button-secondary button-small" type="button" data-record-action="${record.revoked ? 'restore' : 'revoke'}" data-record-id="${html(record.id)}">${icon(record.revoked ? 'refresh' : 'lock')} ${record.revoked ? 'استعادة' : 'إلغاء'}</button>
      <button class="button button-danger button-small" type="button" data-record-action="delete" data-record-id="${html(record.id)}">${icon('trash')} حذف</button>
    </div>
    <div class="detail-grid">
      <div class="detail-box"><span>الحالة</span><strong>${html(statusLabel(record))}</strong></div>
      <div class="detail-box"><span>الكود</span><strong class="code-text">${html(record.code)}</strong></div>
      <div class="detail-box"><span>أُنشئ</span><strong>${html(formatDateTime(record.createdAtUtc))}</strong></div>
      <div class="detail-box"><span>فُعّل</span><strong>${html(formatDateTime(record.activatedAtUtc))}</strong></div>
      <div class="detail-box"><span>ينتهي</span><strong>${html(formatDateTime(record.expiresAtUtc))}</strong></div>
      <div class="detail-box"><span>آخر ظهور</span><strong>${html(formatDateTime(record.lastSeenAtUtc))}</strong></div>
    </div>
    <form id="detailsForm" class="form-grid">
      <input type="hidden" name="id" value="${html(record.id)}" />
      <div class="form-field"><label for="detailsName">اسم المستخدم</label><input id="detailsName" name="userName" type="text" maxlength="160" value="${html(record.userName)}" placeholder="اسم المستخدم" /></div>
      <div class="form-field"><label for="detailsEmail">البريد الإلكتروني</label><input id="detailsEmail" name="userEmail" type="email" maxlength="240" value="${html(record.userEmail)}" placeholder="name@example.com" /></div>
      <div class="form-field"><label for="detailsDevice">معرّف الجهاز</label><input id="detailsDevice" name="deviceId" type="text" maxlength="240" value="${html(record.deviceId)}" placeholder="Android device ID" /></div>
      <div class="form-field"><label for="detailsDuration">مدة الصلاحية <span>(0 = مدى الحياة)</span></label><input id="detailsDuration" name="durationDays" type="number" min="0" max="3650" value="${html(record.durationDays)}" /></div>
      <div class="form-field"><label for="detailsDevices">حد الأجهزة</label><input id="detailsDevices" name="deviceLimit" type="number" min="1" max="50" value="${html(record.deviceLimit)}" /></div>
      <div class="form-field"><label for="detailsNotes">ملاحظات</label><textarea id="detailsNotes" name="notes" maxlength="2000" placeholder="ملاحظات داخلية">${html(record.notes)}</textarea></div>
    </form>`;
  const modal = openModal({
    kicker: 'LICENSE DETAILS',
    title: 'تفاصيل الكود',
    subtitle: 'عدّل بيانات المستخدم أو نفّذ إجراءً على الكود.',
    wide: true,
    body,
    footer: `<button class="button button-secondary" type="button" data-modal-close>إغلاق</button><button class="button button-gold" type="submit" form="detailsForm" id="detailsSubmit">${icon('check')} حفظ التعديلات</button>`,
  });
  modal?.querySelector('#detailsForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = modal.querySelector('#detailsSubmit');
    setBusy(submit, true, 'جارٍ الحفظ…');
    try {
      const payload = await api('update', {
        method: 'POST',
        body: {
          id: String(data.get('id')),
          patch: {
            userName: String(data.get('userName') || ''),
            userEmail: String(data.get('userEmail') || ''),
            deviceId: String(data.get('deviceId') || ''),
            durationDays: Number(data.get('durationDays')),
            deviceLimit: Number(data.get('deviceLimit')),
            notes: String(data.get('notes') || ''),
          },
        },
      });
      STATE.db = payload.database;
      closeModal();
      renderAll();
      toast('تم حفظ تعديلات الكود.');
    } catch (error) {
      reportError(error, 'تعذر حفظ التعديلات.');
      setBusy(submit, false);
    }
  });
};

const openActivate = (record) => {
  if (!record) return;
  const body = `
    <form id="activateForm" class="form-grid">
      <input type="hidden" name="id" value="${html(record.id)}" />
      <div class="form-field"><label for="activateName">اسم المستخدم</label><input id="activateName" name="userName" type="text" maxlength="160" value="${html(record.userName)}" placeholder="اسم المستخدم" /></div>
      <div class="form-field"><label for="activateEmail">البريد الإلكتروني</label><input id="activateEmail" name="userEmail" type="email" maxlength="240" value="${html(record.userEmail)}" placeholder="name@example.com" /></div>
      <div class="form-field"><label for="activateDevice">معرّف الجهاز</label><input id="activateDevice" name="deviceId" type="text" maxlength="240" value="${html(record.deviceId)}" placeholder="Android device ID" /></div>
      <div class="form-field"><label for="activateDuration">مدة الصلاحية <span>(0 = مدى الحياة)</span></label><input id="activateDuration" name="durationDays" type="number" min="0" max="3650" value="${html(record.durationDays)}" /></div>
      <p class="form-note is-wide">${record.activatedAtUtc ? '<strong>تنبيه:</strong> هذا الكود مفعّل مسبقًا. إعادة التفعيل ستبدأ احتساب المدة من الآن.' : 'سيبدأ احتساب المدة من لحظة التفعيل، ويُسجّل الجهاز الحالي في سجل الكود.'}</p>
    </form>`;
  const modal = openModal({
    kicker: 'ACTIVATE',
    title: record.activatedAtUtc ? 'إعادة تفعيل الكود' : 'تفعيل الكود',
    subtitle: html(record.code),
    wide: true,
    body,
    footer: `<button class="button button-secondary" type="button" data-modal-close>إلغاء</button><button class="button button-gold" type="submit" form="activateForm" id="activateSubmit">${icon('check')} تفعيل الآن</button>`,
  });
  modal?.querySelector('#activateForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = modal.querySelector('#activateSubmit');
    setBusy(submit, true, 'جارٍ التفعيل…');
    try {
      const payload = await api('activate', {
        method: 'POST',
        body: {
          id: String(data.get('id')),
          userName: String(data.get('userName') || ''),
          userEmail: String(data.get('userEmail') || ''),
          deviceId: String(data.get('deviceId') || ''),
          durationDays: Number(data.get('durationDays')),
        },
      });
      STATE.db = payload.database;
      closeModal();
      renderAll();
      toast('تم تفعيل الكود بنجاح.');
    } catch (error) {
      reportError(error, 'تعذر تفعيل الكود.');
      setBusy(submit, false);
    }
  });
};

const openExtend = (record) => {
  if (!record) return;
  const body = `
    <form id="extendForm" class="form-grid">
      <input type="hidden" name="id" value="${html(record.id)}" />
      <div class="form-field is-wide"><label for="extendDays">عدد الأيام الإضافية</label><input id="extendDays" name="days" type="number" min="1" max="3650" value="30" required /></div>
      <p class="form-note is-wide">الانتهاء الحالي: <strong>${html(formatDateTime(record.expiresAtUtc))}</strong>. سيُضاف عدد الأيام إلى تاريخ الانتهاء إن كان الكود نشطًا، أو يبدأ من الآن إن كان منتهيًا.</p>
    </form>`;
  const modal = openModal({
    kicker: 'EXTEND',
    title: 'تمديد الكود',
    subtitle: html(record.code),
    body,
    footer: `<button class="button button-secondary" type="button" data-modal-close>إلغاء</button><button class="button button-gold" type="submit" form="extendForm" id="extendSubmit">${icon('calendar')} تمديد</button>`,
  });
  modal?.querySelector('#extendForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = modal.querySelector('#extendSubmit');
    setBusy(submit, true, 'جارٍ التمديد…');
    try {
      const payload = await api('extend', {
        method: 'POST',
        body: { id: String(data.get('id')), days: Number(data.get('days')) },
      });
      STATE.db = payload.database;
      closeModal();
      renderAll();
      toast('تم تمديد الكود بنجاح.');
    } catch (error) {
      reportError(error, 'تعذر تمديد الكود.');
      setBusy(submit, false);
    }
  });
};

const openRevoke = (record) => {
  if (!record) return;
  if (record.revoked) {
    openConfirm({
      title: 'استعادة الكود',
      message: `سيتم إعادة تفعيل الكود <strong class="code-text">${html(record.code)}</strong> في السجل. لن تتغيّر صلاحيته حتى تُفعّله أو تمدّده.`,
      confirmLabel: 'استعادة',
      onConfirm: async () => {
        const payload = await api('revoke', { method: 'POST', body: { id: record.id, revoked: false } });
        STATE.db = payload.database;
        renderAll();
        toast('تمت استعادة الكود.');
      },
    });
    return;
  }
  openConfirm({
    title: 'إلغاء الكود',
    message: `سيتم إلغاء الكود <strong class="code-text">${html(record.code)}</strong> فورًا. سيبقى في السجل ويمكن استعادته لاحقًا.`,
    confirmLabel: 'إلغاء الكود',
    danger: true,
    onConfirm: async () => {
      const payload = await api('revoke', { method: 'POST', body: { id: record.id, revoked: true } });
      STATE.db = payload.database;
      renderAll();
      toast('تم إلغاء الكود.');
    },
  });
};

const openDelete = (record) => {
  if (!record) return;
  openConfirm({
    title: 'حذف الكود نهائيًا',
    message: `سيتم حذف الكود <strong class="code-text">${html(record.code)}</strong> من مساحة العمل نهائيًا. لا يمكن التراجع عن هذه العملية.`,
    confirmLabel: 'حذف نهائي',
    danger: true,
    onConfirm: async () => {
      const payload = await api('delete', { method: 'POST', body: { id: record.id } });
      STATE.db = payload.database;
      renderAll();
      toast('تم حذف الكود.');
    },
  });
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (rows, filename) => {
  const content = `\uFEFF${rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')}\r\n`;
  downloadBlob(content, filename, 'text/csv;charset=utf-8');
};

const exportCsv = () => {
  const records = allRecords();
  if (records.length === 0) {
    toast('لا توجد أكواد لتصديرها.', 'error');
    return;
  }
  const rows = [
    ['الحالة', 'الكود', 'الخطة', 'المدة', 'حد الأجهزة', 'الاسم', 'البريد', 'الجهاز', 'أُنشئ', 'فُعّل', 'ينتهي', 'آخر ظهور', 'ملاحظات'],
    ...records.map((record) => [
      statusLabel(record),
      record.code,
      record.plan,
      record.durationDays === 0 ? 'مدى الحياة' : `${record.durationDays} يومًا`,
      record.deviceLimit,
      record.userName,
      record.userEmail,
      record.deviceId,
      formatDateTime(record.createdAtUtc),
      formatDateTime(record.activatedAtUtc),
      formatDateTime(record.expiresAtUtc),
      formatDateTime(record.lastSeenAtUtc),
      record.notes,
    ]),
  ];
  downloadCsv(rows, `lin-go-gold-licenses-${new Date().toISOString().slice(0, 10)}.csv`);
  toast('تم تصدير ملف CSV.');
};

const exportJson = () => {
  if (!STATE.db) return;
  const content = JSON.stringify(STATE.db, null, 2);
  downloadBlob(content, `lin-go-gold-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  toast('تم تصدير النسخة الاحتياطية.');
};

const importFile = async (file) => {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed?.licenses) ? parsed.licenses : Array.isArray(parsed?.Licenses) ? parsed.Licenses : null;
    if (!records) throw new Error('الملف لا يحتوي على قائمة licenses.');
    if (records.length === 0) throw new Error('الملف فارغ.');
    STATE.pendingImport = parsed;
    openConfirm({
      title: 'استيراد نسخة محلية',
      message: `سيتم دمج <strong>${formatNumber(records.length)}</strong> كودًا من الملف. الأكواد المكررة لن تتغير. هل تريد المتابعة؟`,
      confirmLabel: 'استيراد الأكواد',
      onConfirm: async () => {
        const payload = await api('import', { method: 'POST', body: { database: STATE.pendingImport } });
        STATE.db = payload.database;
        STATE.pendingImport = null;
        renderAll();
        const hint = $('#importHint');
        if (hint) hint.textContent = `تمت إضافة ${formatNumber(payload.added)} كودًا، وتجاهل ${formatNumber(payload.skipped)} مكررًا.`;
        toast(`تم استيراد ${formatNumber(payload.added)} كودًا.`);
      },
    });
  } catch (error) {
    toast(error instanceof Error ? error.message : 'تعذر قراءة الملف.', 'error');
  }
};

const handleRecordAction = (button) => {
  const record = findRecord(button.dataset.recordId);
  if (!record) {
    toast('لم يعد هذا الكود موجودًا. حدّث البيانات.', 'error');
    return;
  }
  const action = button.dataset.recordAction;
  if (action === 'details') openDetails(record);
  else if (action === 'activate') openActivate(record);
  else if (action === 'extend') openExtend(record);
  else if (action === 'revoke' || action === 'restore') openRevoke(record);
  else if (action === 'delete') openDelete(record);
};

const handleAction = (action) => {
  if (action === 'generate') openGenerateModal();
  else if (action === 'refresh') refreshData($('#refreshButton'));
  else if (action === 'export-csv') exportCsv();
  else if (action === 'export-json') exportJson();
  else if (action === 'logout') logout();
};

const logout = async () => {
  try {
    await api('logout', { method: 'POST' });
  } catch {
    /* Local logout still wins if the network is unavailable. */
  }
  STATE.db = null;
  STATE.lastUpdated = null;
  STATE.checkCode = '';
  closeModal();
  showLogin();
  toast('تم تسجيل الخروج.');
};

const bindEvents = () => {
  $('#loginYear').textContent = String(new Date().getFullYear());
  $('#loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('#adminKey');
    const error = $('#loginError');
    const button = $('#loginButton');
    const key = input?.value.trim() || '';
    if (!key) {
      if (error) {
        error.hidden = false;
        error.textContent = 'أدخل مفتاح الإدارة أولًا.';
      }
      input?.focus();
      return;
    }
    if (error) error.hidden = true;
    setBusy(button, true, 'جارٍ التحقق…');
    try {
      const payload = await api('login', { method: 'POST', body: { key } });
      STATE.session = { ...payload, configured: true, storage: true };
      input.value = '';
      await enterApp();
      toast('مرحبًا بك في لوحة الإدارة.');
    } catch (requestError) {
      if (error) {
        error.hidden = false;
        error.textContent = requestError instanceof Error ? requestError.message : 'تعذر تسجيل الدخول.';
      }
      input?.select();
    } finally {
      setBusy(button, false);
    }
  });

  $('#toggleKey')?.addEventListener('click', () => {
    const input = $('#adminKey');
    const button = $('#toggleKey');
    if (!input || !button) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    button.querySelector('span').textContent = visible ? 'عرض' : 'إخفاء';
    button.setAttribute('aria-label', visible ? 'إظهار مفتاح الإدارة' : 'إخفاء مفتاح الإدارة');
  });

  $('#logoutButton')?.addEventListener('click', logout);
  $('#logoutButtonSide')?.addEventListener('click', logout);
  $('#refreshButton')?.addEventListener('click', () => refreshData($('#refreshButton')));
  $('#menuButton')?.addEventListener('click', openSidebar);
  $('#closeMenuButton')?.addEventListener('click', closeSidebar);
  $('#sidebarBackdrop')?.addEventListener('click', closeSidebar);

  document.addEventListener('click', (event) => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      event.preventDefault();
      switchView(viewButton.dataset.view);
      return;
    }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      if (actionButton.dataset.action === 'copy') {
        event.preventDefault();
        copyText(actionButton.dataset.copy);
        return;
      }
      event.preventDefault();
      handleAction(actionButton.dataset.action);
      return;
    }
    const recordButton = event.target.closest('[data-record-action]');
    if (recordButton) {
      event.preventDefault();
      handleRecordAction(recordButton);
      return;
    }
    if (event.target.closest('[data-modal-close]')) {
      event.preventDefault();
      closeModal();
      return;
    }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) {
      const page = Number(pageButton.dataset.page);
      if (Number.isFinite(page) && page >= 1) {
        STATE.page = page;
        renderLicenses();
        $('#view-licenses .licenses-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  $('#globalSearch')?.addEventListener('input', (event) => {
    STATE.licenseQuery = event.target.value;
    STATE.page = 1;
    const licenseSearch = $('#licenseSearch');
    if (licenseSearch && licenseSearch.value !== STATE.licenseQuery) licenseSearch.value = STATE.licenseQuery;
    if (STATE.view !== 'licenses') switchView('licenses');
    else renderLicenses();
  });

  $('#licenseSearch')?.addEventListener('input', (event) => {
    STATE.licenseQuery = event.target.value;
    STATE.page = 1;
    const globalSearch = $('#globalSearch');
    if (globalSearch && globalSearch.value !== STATE.licenseQuery) globalSearch.value = STATE.licenseQuery;
    renderLicenses();
  });

  $('#statusFilter')?.addEventListener('change', (event) => {
    STATE.statusFilter = event.target.value;
    STATE.page = 1;
    renderLicenses();
  });

  $('#sortFilter')?.addEventListener('change', (event) => {
    STATE.sort = event.target.value;
    STATE.page = 1;
    renderLicenses();
  });

  $('#clearFilters')?.addEventListener('click', () => {
    STATE.licenseQuery = '';
    STATE.statusFilter = 'all';
    STATE.sort = 'newest';
    STATE.page = 1;
    if ($('#licenseSearch')) $('#licenseSearch').value = '';
    if ($('#globalSearch')) $('#globalSearch').value = '';
    if ($('#statusFilter')) $('#statusFilter').value = 'all';
    if ($('#sortFilter')) $('#sortFilter').value = 'newest';
    renderLicenses();
  });

  $('#userSearch')?.addEventListener('input', (event) => {
    STATE.userQuery = event.target.value;
    renderUsers();
  });

  $('#checkForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    STATE.checkCode = $('#checkCode')?.value || '';
    renderCheck();
  });

  $('#pasteCodeButton')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const input = $('#checkCode');
      if (input) input.value = text.trim();
      STATE.checkCode = text;
      renderCheck();
    } catch {
      toast('لم نتمكن من قراءة الحافظة. الصق الكود يدويًا.', 'error');
    }
  });

  $('#importButton')?.addEventListener('click', () => $('#importFile')?.click());
  $('#importFile')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    void importFile(file);
    event.target.value = '';
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#globalSearch')?.focus();
      return;
    }
    if (event.key === 'Escape') {
      if ($('#modalRoot')?.firstElementChild) {
        closeModal();
        return;
      }
      if ($('#sidebar')?.classList.contains('is-open')) closeSidebar();
    }
  });
};

const boot = async () => {
  bindEvents();
  showLoading(true);
  try {
    const session = await api('session');
    syncSessionUi(session);
    if (session.authenticated) {
      await enterApp();
    } else {
      showLogin(
        session.configured && session.storage
          ? ''
          : 'الخدمة السحابية غير مهيأة بعد. تواصل مع مسؤول النظام.',
      );
    }
  } catch (error) {
    showLogin('تعذر الاتصال بخادم الإدارة. تحقق من الشبكة وأعد المحاولة.');
    syncSessionUi({ configured: false, storage: false });
    void error;
  } finally {
    showLoading(false);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  void boot();
});
