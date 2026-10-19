#!/usr/bin/env node
/**
 * Serve the locally built APKs in releases/ over the local network.
 * Useful for installing on a phone that is on the same Wi-Fi.
 *
 * Usage: node scripts/serve-releases.mjs
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, resolve } from 'node:path';

const directory = resolve(process.cwd(), 'releases');
const port = Number(process.env.PORT || 8088);
const contentTypes = {
  '.apk': 'application/vnd.android.package-archive',
  '.json': 'application/json',
};

const server = createServer((request, response) => {
  const requested = decodeURIComponent((request.url || '/').split('?')[0]);
  const name = requested.replace(/^\/+/, '') || 'english-tok-1.0.0.apk';
  const file = resolve(directory, name);

  if (!file.startsWith(directory)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Content-Disposition': `attachment; filename="${name}"`,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${directory}`);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
    .map((entry) => entry.address);
  for (const address of addresses) {
    console.log(`http://${address}:${port}/english-tok-1.0.0.apk`);
  }
});
