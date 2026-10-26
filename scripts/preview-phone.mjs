#!/usr/bin/env node
/**
 * معاينة الهاتف: يشغّل نسخة البناء (dist) على الشبكة المحلية، مع رابط عام
 * اختياري عبر cloudflared، لتشاهد الدروس الجديدة على هاتفك قبل رفعها للمستودع.
 *
 * ما يفعله تلقائيًا داخل المعاينة فقط:
 *  - يتخطى شاشة اختبار المستوى حتى تفتح الدروس مباشرة.
 *  - يوجّه جلب الدروس إلى ملف البناء المحلي حتى تظهر الدروس الجديدة لا القديمة.
 *  - يضيف شارة «وضع المعاينة» أسفل الشاشة.
 *
 * الاستخدام:  npm run preview:phone
 * اختياري:    PREVIEW_PORT=4173   PREVIEW_TUNNEL=0
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const distDirectory = resolve(process.cwd(), 'dist');
const port = Number.parseInt(process.env.PREVIEW_PORT || '4173', 10);
const wantTunnel = process.env.PREVIEW_TUNNEL !== '0';

if (!existsSync(join(distDirectory, 'index.html'))) {
  console.error('✖ dist/index.html غير موجود. شغّل أولًا:  npm run build');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

// يُحقن قبل تشغيل التطبيق: يجهّز الملف الشخصي، يفرّغ ذاكرة المحتوى، ويمنع
// جلب المحتوى/التحديث من الشبكة حتى تظهر دروس البناء الحالي.
const PREVIEW_BOOTSTRAP = `<script>
(function () {
  try {
    var PROFILE_KEY = 'englishtok_user_profile_v1';
    var now = new Date().toISOString();
    var raw = localStorage.getItem(PROFILE_KEY);
    var profile = {};
    try { profile = raw ? JSON.parse(raw) : {}; } catch (e) { profile = {}; }
    profile.lastActiveDate = now.slice(0, 10);
    profile.placementAssessment = {
      schemaVersion: 1,
      startedAt: now,
      answers: {},
      result: {
        completedAt: now,
        correctCount: 10,
        answeredCount: 10,
        scorePercent: 100,
        suggestedStage: 1,
        skillCoverage: ['vocabulary'],
        stages: [{ stage: 1, correct: 10, total: 10, passed: true }]
      }
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.removeItem('englishtok_learning_path_content_v2');
    localStorage.removeItem('englishtok_learning_path_content_v3');

    var blocked = ['contents/public/content/learning-path.json', 'cdn.jsdelivr.net', 'releases/latest'];
    var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        // وجّه أي طلب لمحتوى الدروس إلى الملف المحلي المبني (dist/content/learning-path.json)
        // حتى تظهر دروس البناء الحالي بدل النسخة القديمة المنشورة على الإنترنت.
        if (url.indexOf('learning-path.json') !== -1 && url.indexOf(location.origin) !== 0) {
          return nativeFetch(location.origin + '/content/learning-path.json', { cache: 'no-store' });
        }
        for (var i = 0; i < blocked.length; i += 1) {
          if (url.indexOf(blocked[i]) !== -1) {
            return Promise.reject(new Error('preview: remote requests disabled'));
          }
        }
        return nativeFetch.apply(null, arguments);
      };
    }
  } catch (e) { /* لا تعطّل المعاينة */ }
})();
</script>`;

const PREVIEW_BADGE =
  '<div style="position:fixed;z-index:2147483647;bottom:14px;left:14px;background:#f59e0b;color:#111;' +
  'font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:999px;' +
  'box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none">وضع المعاينة</div>';

const inject = (html) => {
  let output = html.replace(/<head([^>]*)>/i, (match) => match + PREVIEW_BOOTSTRAP);
  output = output.replace(/<\/body>/i, PREVIEW_BADGE + '</body>');
  return output;
};

const server = createServer(async (request, response) => {
  const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
  let filePath = join(distDirectory, urlPath);
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    filePath = join(distDirectory, 'index.html');
  }
  try {
    let data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    if (ext === '.html') data = Buffer.from(inject(data.toString('utf8')), 'utf8');
    response.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  const addresses = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const item of list || []) {
      if (item && item.family === 'IPv4' && !item.internal) addresses.push(item.address);
    }
  }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  معاينة Lin Go جاهزة على الهاتف');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  على هذا الحاسوب:        http://localhost:${port}`);
  for (const address of addresses) {
    console.log(`  على الهاتف (نفس Wi-Fi): http://${address}:${port}`);
  }
  console.log('  (يُفضّل فتح رابط Wi-Fi أعلاه على هاتفك)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

if (wantTunnel) {
  const localBinary = resolve(process.cwd(), 'tools', 'cloudflared.exe');
  const binary = existsSync(localBinary) ? localBinary : (process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
  const tunnel = spawn(binary, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  tunnel.on('error', () => {
    console.log('(لا يوجد نفق عام. استخدم رابط Wi-Fi أعلاه. لرابط يعمل من أي مكان: ضع cloudflared.exe في مجلد tools/)\n');
  });
  let buffer = '';
  const scan = (chunk) => {
    buffer += chunk.toString();
    const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i.exec(buffer);
    if (match) {
      console.log(`  🌍 من أي مكان:            ${match[0]}\n`);
      buffer = '';
    }
  };
  tunnel.stdout.on('data', scan);
  tunnel.stderr.on('data', scan);
}
