const REPOSITORY = 'hmachikh16-boop/englishtok';
const DOWNLOAD_PAGE = 'https://englishtok-eight.vercel.app/download';
const LOCAL_APK = '/english-tok.apk';
const GITHUB_APK = `https://github.com/${REPOSITORY}/releases/latest/download/english-tok.apk`;
const GITHUB_RELEASE = `https://github.com/${REPOSITORY}/releases/latest`;
const GOLD_DEMO_CODE = 'LINGO-GOLD-DEMO-2026';
const GOLD_APK = '/lin-go-gold-1.0.1.apk';
const GOLD_GITHUB_APK =
  `https://github.com/${REPOSITORY}/releases/download/gold-v1.0.1/lin-go-gold-1.0.1.apk`;

const FALLBACK = {
  version: '1.8.5',
  size: 58_149_338,
  sha256: '5A7040EABCA5D1FEBACDF0FB1C46B262D94BE7A6F2C03B0E6CBEE423E722CAE5',
  notes: 'تحديث 1.8.5: تنزيل التحديث داخل التطبيق عبر مدير التنزيلات، ومسار موحّد للمتصفح، مع اسم ملف إصدار أوضح. لا تغيير في تقدمك أو نسخك الاحتياطي المشفّر.',
  releaseUrl: GITHUB_RELEASE,
};

let currentVersion = FALLBACK.version;

const githubApkUrl = (version) =>
  `https://github.com/${REPOSITORY}/releases/download/v${version}/english-tok-${version}.apk`;

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

const setDownloadLinks = (version, target = LOCAL_APK) => {
  const href = target === LOCAL_APK ? `${LOCAL_APK}?v=${encodeURIComponent(version)}` : target;
  document.querySelectorAll('[data-download]').forEach((link) => {
    link.setAttribute('href', href);
    link.setAttribute('download', `lin-go-${version}.apk`);
    link.setAttribute(
      'title',
      target === LOCAL_APK ? 'تنزيل من الموقع الرسمي' : 'تنزيل من صفحة GitHub الرسمية',
    );
  });
  setLink('[data-github-download]', githubApkUrl(version));
};

const setGoldLinks = (target = GOLD_APK) => {
  document.querySelectorAll('[data-gold-download]').forEach((link) => {
    link.setAttribute('href', target);
    link.setAttribute('download', 'lin-go-gold-1.0.1.apk');
    link.setAttribute(
      'title',
      target === GOLD_APK ? 'تنزيل Gold من الموقع الرسمي' : 'تنزيل Gold من صفحة GitHub الرسمية',
    );
  });
  setLink('[data-gold-github]', GOLD_GITHUB_APK);
};

const ensureGoldTarget = async () => {
  const links = [...document.querySelectorAll('[data-gold-download]')];
  if (!links.length) return;

  let target = GOLD_APK;
  try {
    const response = await fetch(GOLD_APK, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok && response.status !== 405) {
      target = GOLD_GITHUB_APK;
    }
  } catch {
    target = GOLD_GITHUB_APK;
  }

  setGoldLinks(target);
};

const applyLatest = (data) => {
  const latest = {
    version: isValidVersion(data?.version) ? data.version : FALLBACK.version,
    size: Number.isFinite(data?.size) && data.size > 0 ? data.size : FALLBACK.size,
    sha256: isValidHash(data?.sha256) ? data.sha256.toUpperCase() : FALLBACK.sha256,
    notes: containsArabic(data?.notes) ? data.notes : FALLBACK.notes,
    releaseUrl: typeof data?.releaseUrl === 'string' ? data.releaseUrl : FALLBACK.releaseUrl,
  };

  currentVersion = latest.version;
  setText('[data-latest-version]', latest.version);
  setText('[data-latest-size]', formatSize(latest.size));
  setText('[data-latest-hash]', latest.sha256);
  setText('[data-latest-notes]', latest.notes);
  setLink('[data-release-link]', latest.releaseUrl);
  setDownloadLinks(latest.version);
  document.title = `تحميل Lin Go ${latest.version} و Gold — أحدث إصدار APK`;

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

  setDownloadLinks(currentVersion, target);
};

const setupGoldForm = () => {
  const form = document.querySelector('[data-gold-form]');
  const input = document.querySelector('[data-gold-input]');
  const message = document.querySelector('[data-gold-message]');
  const success = document.querySelector('[data-gold-success]');
  if (!form || !input) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = input.value.trim().toUpperCase();

    if (code === GOLD_DEMO_CODE) {
      if (message) {
        message.classList.remove('is-error');
        message.textContent = 'تم التحقق من كود المعاينة. يمكنك فتح Gold الآن.';
      }
      if (success) success.hidden = false;
      showToast('Gold جاهز للمعاينة');
      return;
    }

    if (success) success.hidden = true;
    if (message) {
      message.classList.add('is-error');
      message.textContent = code
        ? 'هذا الكود غير صالح للمعاينة. استخدم الكود التجريبي الموجود بالأعلى، أو انتظر التفعيل الرسمي.'
        : 'أدخل كود Gold أولًا. للمعاينة استخدم الكود التجريبي.';
    }
  });

  input.addEventListener('input', () => {
    message?.classList.remove('is-error');
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

const setupDownloadFeedback = () => {
  document.querySelectorAll('[data-download]').forEach((link) => {
    link.addEventListener('click', () => {
      showToast('بعد اكتمال 100% افتح ملف APK من «التنزيلات» لتثبيته.');
    });
  });
  document.querySelectorAll('[data-gold-download]').forEach((link) => {
    link.addEventListener('click', () => {
      showToast('تنزيل Gold من الموقع الرسمي. بعد اكتمال 100% افتح الملف من «التنزيلات».');
    });
  });
};

void loadLatest().then(() => ensureDownloadTarget());
setGoldLinks();
void ensureGoldTarget();
setupGoldForm();
setupShare();
setupHeader();
setupDownloadFeedback();
