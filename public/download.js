const REPOSITORY = 'hmachikh16-boop/englishtok';
const DOWNLOAD_PAGE = 'https://englishtok-eight.vercel.app/download';
const LOCAL_APK = '/english-tok.apk';
const GITHUB_APK = `https://github.com/${REPOSITORY}/releases/latest/download/english-tok.apk`;
const GITHUB_RELEASE = `https://github.com/${REPOSITORY}/releases/latest`;

const FALLBACK = {
  version: '1.8.3',
  size: 58_555_722,
  sha256: 'D819FAA01EA82E5D696E6741C7887AF6307836BA10A9DC92ABD2D3F1684228A7',
  notes: 'تحديث آمن يفتح المتصفح لتنزيل الحزمة الرسمية بدل تنزيلها وتثبيتها داخل التطبيق، لمنع تحذيرات Google Play Protect. لا تغيير في تقدمك أو نسخك الاحتياطي المشفّر.',
  releaseUrl: GITHUB_RELEASE,
};

const isValidVersion = (value) => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
const isValidHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const containsArabic = (value) => typeof value === 'string' && /[\u0600-\u06FF]/.test(value);

const formatSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const setLink = (selector, href) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.setAttribute('href', href);
  });
};

let toastTimer;
const showToast = (message) => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.top = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
};

const applyLatest = (data) => {
  const latest = {
    version: isValidVersion(data?.version) ? data.version : FALLBACK.version,
    size: Number.isFinite(data?.size) && data.size > 0 ? data.size : FALLBACK.size,
    sha256: isValidHash(data?.sha256) ? data.sha256.toUpperCase() : FALLBACK.sha256,
    notes: containsArabic(data?.notes) ? data.notes : FALLBACK.notes,
    releaseUrl: typeof data?.releaseUrl === 'string' ? data.releaseUrl : FALLBACK.releaseUrl,
  };

  setText('[data-latest-version]', latest.version);
  setText('[data-latest-size]', formatSize(latest.size));
  setText('[data-latest-hash]', latest.sha256);
  setText('[data-latest-notes]', latest.notes);
  setLink('[data-release-link]', latest.releaseUrl);
  document.title = `تحميل Lin Go ${latest.version} — أحدث إصدار APK`;

  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) {
    try {
      const parsed = JSON.parse(schema.textContent);
      parsed.softwareVersion = latest.version;
      parsed.fileSize = String(latest.size);
      parsed.downloadUrl = `${DOWNLOAD_PAGE.replace('/download', '')}${LOCAL_APK}`;
      schema.textContent = JSON.stringify(parsed);
    } catch {
      /* The static schema remains valid if it cannot be updated. */
    }
  }
};

const loadLatest = async () => {
  try {
    const response = await fetch('/download/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyLatest(await response.json());
  } catch {
    applyLatest(FALLBACK);
  }
};

const ensureDownloadTarget = async () => {
  const links = [...document.querySelectorAll('[data-download]')];
  if (!links.length) return;

  let target = LOCAL_APK;
  try {
    const response = await fetch(LOCAL_APK, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok && response.status !== 405) {
      target = GITHUB_APK;
    }
  } catch {
    target = GITHUB_APK;
  }

  links.forEach((link) => {
    link.setAttribute('href', target);
    if (target === GITHUB_APK) {
      link.setAttribute('title', 'تنزيل من صفحة GitHub الرسمية');
    }
  });
};

const setupShare = () => {
  document.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const shareData = {
        title: 'Lin Go — تعلّم الإنجليزية',
        text: 'تطبيق عربي مجاني لتعلّم الإنجليزية: دروس قصيرة، نطق، بطاقات، ومعلّم ذكي.',
        url: DOWNLOAD_PAGE,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }

      const copied = await copyText(DOWNLOAD_PAGE);
      showToast(copied ? 'تم نسخ رابط التطبيق — شاركه مع أصدقائك' : 'رابط التطبيق: ' + DOWNLOAD_PAGE);
    });
  });
};

const setupHeader = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
};

loadLatest();
ensureDownloadTarget();
setupShare();
setupHeader();
