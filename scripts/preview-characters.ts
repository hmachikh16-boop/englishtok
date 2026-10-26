import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { characterSvg, PRIMARY_DESIGNS } from '../src/characters/characterArt';

const outDir = resolve(process.cwd(), 'tmp-placement-browser');
mkdirSync(outDir, { recursive: true });

const figures = PRIMARY_DESIGNS.map(
  (design) => `
    <figure>
      <svg viewBox="-84 -244 168 258" width="200" height="307">${characterSvg(design)}</svg>
      <figcaption>${design}</figcaption>
    </figure>`,
).join('');

const avatars = PRIMARY_DESIGNS.map(
  (design) => `
    <div class="avatar">
      <svg viewBox="-64 -232 128 148" width="72" height="83">${characterSvg(design)}</svg>
    </div>`,
).join('');

const scene = `<svg viewBox="0 0 420 740" width="290" height="511" style="border-radius:16px">
  <rect width="420" height="740" fill="#0b1220"/>
  <ellipse cx="100" cy="440" rx="58" ry="13" fill="#243247"/>
  <ellipse cx="310" cy="440" rx="58" ry="13" fill="#243247"/>
  <g transform="translate(100 436) scale(0.82)">${characterSvg('girl-teal')}</g>
  <g transform="translate(310 436) scale(0.82)">${characterSvg('boy-monster', { speaking: true, playing: true })}</g>
</svg>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Lin Go primary cast</title>
<style>
  body { margin: 0; padding: 24px; background: #eef7f1; font-family: system-ui, sans-serif; }
  h1 { font-size: 20px; color: #14532d; }
  .grid { display: flex; flex-wrap: wrap; gap: 12px; }
  figure { margin: 0; background: #fff; border-radius: 18px; padding: 8px; box-shadow: 0 4px 14px rgba(15,23,42,.08); text-align: center; }
  figcaption { font-size: 11px; color: #475569; margin-top: 4px; font-weight: 700; }
  .avatars { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
  .avatar { width: 72px; height: 72px; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg,#ecfdf5,#ccfbf1); border: 1px solid #bbf7d0; }
  .scene { margin-top: 8px; background: #0b1220; border-radius: 22px; padding: 10px; display: inline-block; }
</style></head>
<body>
  <h1>Primary-school cast</h1>
  <div class="grid">${figures}</div>
  <h1>Lesson scene (grade 1)</h1>
  <div class="scene">${scene}</div>
  <h1>Card avatars</h1>
  <div class="avatars">${avatars}</div>
</body></html>`;

const target = resolve(outDir, 'characters.html');
writeFileSync(target, html, 'utf8');
console.log(`Wrote ${target}`);
