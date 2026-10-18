import 'dotenv/config';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const httpServer = createServer(app);
const isProduction =
  process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const distDirectory = resolve(process.cwd(), 'dist');

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
