import 'dotenv/config';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const httpServer = createServer(app);
const isProduction =
  process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const distDirectory = resolve(process.cwd(), 'dist');
const dailyCharacterLimit = Number.parseInt(
  process.env.TTS_DAILY_CHARACTER_LIMIT || '10000',
  10
);
const allowedOrigins = new Set(
  (process.env.TTS_ALLOWED_ORIGINS ||
    'capacitor://localhost,https://localhost,http://localhost')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
let dailyUsage = { characters: 0, resetAt: nextUtcDay() };

function nextUtcDay() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

function rateLimitTts(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  if (now >= dailyUsage.resetAt) dailyUsage = { characters: 0, resetAt: nextUtcDay() };

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  let bucket = requestBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 60_000 };
    requestBuckets.set(ip, bucket);
  }
  if (bucket.count >= 30) {
    res.status(429).json({ error: 'تم تجاوز حد طلبات النطق مؤقتًا. حاول بعد دقيقة.' });
    return;
  }
  bucket.count += 1;

  if (requestBuckets.size > 1000) {
    for (const [key, value] of requestBuckets) {
      if (now >= value.resetAt) requestBuckets.delete(key);
    }
  }
  next();
}

app.use('/api/tts', (req, res, next) => {
  const origin = req.get('Origin');
  let sameOrigin = false;
  if (origin) {
    try {
      sameOrigin = new URL(origin).host === req.get('host');
    } catch {
      sameOrigin = false;
    }
  }
  if (origin && !sameOrigin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'هذا المصدر غير مسموح له باستخدام خدمة النطق.' });
    return;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: '12kb' }));
app.post('/api/tts', rateLimitTts, async (req, res) => {
  const { text, rate, pitch, gender, accent } = req.body as {
    text?: unknown;
    rate?: unknown;
    pitch?: unknown;
    gender?: unknown;
    accent?: unknown;
  };
  if (
    typeof text !== 'string' ||
    !text.trim() ||
    Buffer.byteLength(text, 'utf8') > 5000 ||
    /\p{Script=Arabic}/u.test(text)
  ) {
    res.status(400).json({
      error: 'النطق متاح للنص الإنجليزي فقط وبحد أقصى 5000 بايت لكل طلب.',
    });
    return;
  }
  if (
    (accent !== undefined && accent !== 'en-US' && accent !== 'en-GB') ||
    (gender !== undefined && gender !== 'male' && gender !== 'female')
  ) {
    res.status(400).json({ error: 'إعدادات صوت النطق غير صالحة.' });
    return;
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({
      error:
        'خدمة النطق السحابي غير مهيأة. يحتاج الخادم إلى مفتاح Google Cloud Text-to-Speech.',
    });
    return;
  }

  const selectedAccent = accent === 'en-GB' ? 'en-GB' : 'en-US';
  const selectedGender = gender === 'male' ? 'male' : 'female';
  const voiceName =
    selectedAccent === 'en-GB'
      ? selectedGender === 'male'
        ? 'en-GB-Neural2-B'
        : 'en-GB-Neural2-A'
      : selectedGender === 'male'
        ? 'en-US-Neural2-D'
        : 'en-US-Neural2-F';
  const characterCount = [...text.trim()].length;
  if (
    !Number.isSafeInteger(dailyCharacterLimit) ||
    dailyCharacterLimit <= 0 ||
    dailyUsage.characters + characterCount > dailyCharacterLimit
  ) {
    res.status(429).json({
      error:
        'تم بلوغ حد الاستخدام اليومي المسموح للنطق. سيُتاح مجددًا بعد إعادة ضبط الحد اليومي.',
    });
    return;
  }
  dailyUsage.characters += characterCount;

  const upstreamController = new AbortController();
  const timeoutId = setTimeout(() => upstreamController.abort(), 15_000);
  const abortForDisconnectedClient = () => {
    if (!res.writableEnded) upstreamController.abort();
  };
  req.once('aborted', abortForDisconnectedClient);
  res.once('close', abortForDisconnectedClient);
  let upstream: globalThis.Response;
  try {
    upstream = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.trim() },
          voice: { languageCode: selectedAccent, name: voiceName },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate:
              typeof rate === 'number' ? Math.min(1.2, Math.max(0.5, rate)) : 1,
            pitch:
              typeof pitch === 'number'
                ? Math.min(20, Math.max(-20, (pitch - 1) * 10))
                : 0,
          },
        }),
        signal: upstreamController.signal,
      }
    );
  } catch (error) {
    if (res.destroyed) return;
    console.error('[tts] Google Cloud request failed:', error);
    res.status(502).json({
      error: 'تعذر الاتصال بمزود النطق. تحقق من الإنترنت وحالة الخدمة وحاول مجددًا.',
    });
    return;
  } finally {
    clearTimeout(timeoutId);
    req.off('aborted', abortForDisconnectedClient);
    res.off('close', abortForDisconnectedClient);
  }

  if (!upstream.ok) {
    console.error(`[tts] Google Cloud returned HTTP ${upstream.status}.`);
    const status = upstream.status === 429 ? 429 : 502;
    res.status(status).json({
      error:
        upstream.status === 429
          ? 'وصلت خدمة النطق إلى حد الطلبات. انتظر قليلًا ثم أعد المحاولة.'
          : 'فشلت خدمة النطق الإنجليزية. تحقق من إعداد المفتاح والحصة المتاحة.',
    });
    return;
  }

  const result = (await upstream.json().catch(() => null)) as
    | { audioContent?: unknown }
    | null;
  if (typeof result?.audioContent !== 'string' || !result.audioContent) {
    console.error('[tts] Google Cloud response did not contain audio.');
    res.status(502).json({ error: 'لم تُرجع خدمة النطق ملفًا صوتيًا صالحًا.' });
    return;
  }

  const audio = Buffer.from(result.audioContent, 'base64');
  if (!audio.length) {
    res.status(502).json({ error: 'وصل ملف صوتي فارغ من خدمة النطق.' });
    return;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.send(audio);
});

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'تعذر قراءة طلب النطق.' });
    return;
  }
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === 413
  ) {
    res.status(413).json({ error: 'حجم طلب النطق أكبر من الحد المسموح.' });
    return;
  }
  console.error('[server] Unhandled request error:', error);
  res.status(500).json({ error: 'حدث خطأ داخلي في خادم النطق.' });
});

async function startServer() {
  if (isProduction) {
    app.use(express.static(distDirectory));
    app.get(/.*/, (_req, res) => res.sendFile(resolve(distDirectory, 'index.html')));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number.parseInt(process.env.PORT || '3000', 10);
  await new Promise<void>((resolveListen, rejectListen) => {
    httpServer.once('error', rejectListen);
    httpServer.listen(port, '0.0.0.0', resolveListen);
  });
  console.info(`[server] EnglishTok listening on port ${port}.`);
}

void startServer().catch((error: unknown) => {
  console.error('[server] Failed to start EnglishTok:', error);
  process.exitCode = 1;
});
