const REPOSITORY = 'hmachikh16-boop/englishtok';
const DOWNLOAD_PAGE = 'https://englishtok-eight.vercel.app/download';
const LOCAL_APK = '/english-tok.apk';
const GITHUB_APK = `https://github.com/${REPOSITORY}/releases/latest/download/english-tok.apk`;
const GITHUB_RELEASE = `https://github.com/${REPOSITORY}/releases/latest`;
const GOLD_APK = '/lin-go-gold-1.1.16.apk';
const GOLD_GITHUB_APK =
  `https://github.com/${REPOSITORY}/releases/download/gold-v1.1.16/lin-go-gold-1.1.16.apk`;

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
    link.setAttribute('download', 'lin-go-gold-1.1.16.apk');
    link.setAttribute(
      'title',
      target === GOLD_APK ? 'تنزيل Gold+ من الموقع الرسمي' : 'تنزيل Gold+ من صفحة GitHub الرسمية',
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
  const submit = form?.querySelector('button[type="submit"]');
  if (!form || !input) return;

  const setMessage = (text, isError) => {
    if (!message) return;
    message.classList.toggle('is-error', Boolean(isError));
    message.textContent = text;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim().toUpperCase();

    if (!code) {
      if (success) success.hidden = true;
      setMessage('أدخل كود Gold المفعّل أولًا.', true);
      input.focus();
      return;
    }

    if (success) success.hidden = true;
    setMessage('جارٍ التحقق من الكود…', false);
    if (submit) {
      submit.disabled = true;
      submit.dataset.label = submit.textContent;
      submit.textContent = 'جارٍ التحقق…';
    }
    try {
      const response = await fetch(
        `/api/admin?action=check&code=${encodeURIComponent(code)}`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'تعذر التحقق من الكود الآن.');
      }
      if (payload.valid) {
        setMessage('', false);
        if (success) {
          success.hidden = false;
          success.querySelectorAll('[data-gold-download-unlocked]').forEach((link) => {
            link.hidden = false;
          });
        }
        showToast('تم تفعيل Gold+ — التحميل جاهز');
      } else {
        setMessage(
          payload.status === 'revoked'
            ? 'هذا الكود ملغى. تواصل مع الدعم أو استخدم كودًا آخر.'
            : payload.status === 'expired'
              ? 'هذا الكود منتهي الصلاحية. تواصل مع الدعم لتجديده.'
              : 'هذا الكود غير موجود في مساحة العمل. تحقق من كتابته أو تواصل مع الدعم.',
          true,
        );
        showToast('الكود غير صالح');
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'تعذر التحقق من الكود الآن. حاول مرة أخرى.',
        true,
      );
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = submit.dataset.label || 'تحقق';
      }
    }
  });

  input.addEventListener('input', () => {
    message?.classList.remove('is-error');
    if (success) success.hidden = true;
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

const setupSupport = () => {
  const form = document.getElementById('support-form');
  const emailInput = document.getElementById('support-email');
  const messageInput = document.getElementById('support-message');
  const status = document.getElementById('support-status');
  if (!form || !messageInput) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message.length < 5) {
      if (status) status.textContent = 'اكتب تفاصيل المشكلة (5 أحرف على الأقل).';
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'جارٍ الإرسال…';
    }
    try {
      const response = await fetch('/api/admin?action=support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message,
          email: emailInput ? emailInput.value.trim() : '',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الشكوى.');
      messageInput.value = '';
      if (status) status.textContent = 'تم إرسال الشكوى إلى لوحة التحكم. سنراجعها قريبًا.';
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : 'تعذر إرسال الشكوى.';
      }
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = 'إرسال الشكوى';
      }
    }
  });
};

void loadLatest().then(() => ensureDownloadTarget());
setGoldLinks();
void ensureGoldTarget();
setupGoldForm();
setupSupport();
setupShare();
setupHeader();
setupDownloadFeedback();
