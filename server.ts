import 'dotenv/config';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import chatHandler from './api/chat';
import progressHandler from './api/progress';
import ttsHandler from './api/tts';

const app = express();
const httpServer = createServer(app);
const isProduction =
  process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const distDirectory = resolve(process.cwd(), 'dist');

app.use(express.json({ limit: '64kb' }));
app.all('/api/progress', (request, response) => {
  void progressHandler(
    request as unknown as Parameters<typeof progressHandler>[0],
    response as unknown as Parameters<typeof progressHandler>[1],
  );
});
app.all('/api/chat', (request, response) => {
  void chatHandler(
    request as unknown as Parameters<typeof chatHandler>[0],
    response as unknown as Parameters<typeof chatHandler>[1],
  );
});
app.all('/api/tts', (request, response) => {
  void ttsHandler(
    request as unknown as Parameters<typeof ttsHandler>[0],
    response as unknown as Parameters<typeof ttsHandler>[1],
  );
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
  console.info(`[server] Lin Go listening on port ${port}.`);
}

void startServer().catch((error: unknown) => {
  console.error('[server] Failed to start Lin Go:', error);
  process.exitCode = 1;
});
