import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import WebSocket from 'ws';

/**
 * Render the three 1080x1920 store screenshots from store/frames.html.
 * The feature graphic is rendered separately from store/feature.html with
 * Chrome's command-line screenshot mode.
 */
const root = resolve('.');
const port = 4180;
const chromePort = 9225;
const outScreens = resolve(root, 'store/screenshots');
await mkdir(outScreens, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = join(root, urlPath.replace(/^\/+/, ''));
    if (!filePath.startsWith(root) || !existsSync(filePath)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});
await new Promise((done) => server.listen(port, '127.0.0.1', done));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${resolve(process.env.TEMP, `englishtok-frames-${Date.now()}`)}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPageTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${chromePort}/json/list`).then((r) => r.json());
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a page target.');
}

const target = await getPageTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.once('open', res);
  ws.once('error', rej);
});

let nextId = 0;
const pending = new Map();
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  if (message.id && pending.has(message.id)) {
    const { resolve: done, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else done(message.result);
  }
});

const send = (method, params = {}) =>
  new Promise((done, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve: done, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
};

const capture = async (filePath) => {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(filePath, Buffer.from(result.data, 'base64'));
  console.log(`wrote ${filePath.replace(`${root}\\`, '')}`);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setScrollbarsHidden', { hidden: true });
await send('Emulation.setDeviceMetricsOverride', {
  width: 1080,
  height: 1920,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: 1080,
  screenHeight: 1920,
});
await send('Page.navigate', { url: `http://127.0.0.1:${port}/store/frames.html` });
await sleep(2500);
await evaluate('document.fonts.ready.then(() => true)');
await evaluate(`Promise.all(Array.from(document.images).map((img) => img.complete ? true : new Promise((resolve) => { img.onload = img.onerror = resolve; }))).then(() => true)`);
await sleep(500);

for (const [id, name] of [
  ['home', '01-home.png'],
  ['tutor', '02-tutor.png'],
  ['backup', '03-backup.png'],
]) {
  await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.frame, .feature').forEach((el) => { el.style.display = 'none'; });
    const el = document.getElementById('${id}');
    el.style.display = 'block';
    window.scrollTo(0, 0);
    return true;
  })()`);
  await sleep(1000);
  await evaluate(`(() => {
    document.body.style.opacity = '0.999';
    void document.body.offsetHeight;
    document.body.style.opacity = '1';
    return true;
  })()`);
  await sleep(1000);
  await capture(resolve(outScreens, name));
}

ws.close();
chrome.kill();
server.close();
